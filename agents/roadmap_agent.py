import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a product roadmap strategist for enterprise software projects.
Your job is to create a phased product roadmap based on the feature backlog,
success metrics, and project constraints.

You MUST return a JSON object with the following structure:
{
  "roadmap_title": "Product Roadmap: [Project Name]",
  "vision_statement": "1-2 sentence product vision",
  "phases": [
    {
      "phase_id": "PHASE-1",
      "name": "Phase name (e.g., 'Foundation & MVP')",
      "duration": "Estimated duration (e.g., '8 weeks')",
      "objective": "Primary objective for this phase",
      "features": ["FEAT-001", "FEAT-002"],
      "deliverables": ["What gets delivered in this phase"],
      "success_criteria": ["How to know this phase is complete"],
      "dependencies": ["External dependencies for this phase"],
      "risks": ["Phase-specific risks"]
    }
  ],
  "milestones": [
    {
      "name": "Milestone name",
      "target_date_relative": "e.g., 'Week 4', 'End of Phase 1'",
      "deliverables": ["What is delivered"],
      "kpis_measured": ["KPI-001"]
    }
  ],
  "release_strategy": {
    "approach": "big-bang | phased | rolling | beta-first",
    "rationale": "Why this approach",
    "rollback_plan": "Brief rollback strategy"
  },
  "resource_summary": {
    "estimated_team_size": "Recommended team size",
    "key_roles": ["Roles needed"],
    "estimated_total_effort": "Person-months or similar"
  },
  "roadmap_summary": "2-3 sentence executive summary of the roadmap"
}

Rules:
- Sequence features logically — dependencies and high-priority (P0) items first.
- Each phase should deliver tangible, demonstrable value.
- Link features back to their IDs from the feature backlog.
- Link milestones to KPIs where applicable.
- Be realistic about timelines based on the project constraints.
- Include at least 2-4 phases.
"""


class RoadmapAgent(BaseAgent):
    name = "Product Roadmap Agent"
    description = "Creates a phased product roadmap from features, metrics, and constraints"
    instructions = INSTRUCTIONS

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        features = context.get("features", [])
        success_metrics = context.get("success_metrics", {})
        requirements = context.get("requirements", [])
        parsed = context.get("parsed_rfp", {})
        metadata = parsed.get("metadata", {})

        if not features:
            raise ValueError("No features in context")

        prompt = (
            f"Project: {metadata.get('rfp_title', 'Unknown')}\n"
            f"Budget: {metadata.get('estimated_budget', 'Not specified')}\n"
            f"Timeline: {parsed.get('sections', {}).get('timeline', 'Not specified')}\n\n"
            f"Feature Backlog ({len(features)} features):\n"
            f"{json.dumps(features, indent=2)}\n\n"
            f"Success Metrics:\n{json.dumps(success_metrics, indent=2)}\n\n"
            f"Requirements summary ({len(requirements)} total):\n"
            f"{json.dumps(requirements[:10], indent=2)}\n\n"
            "Create a comprehensive phased product roadmap."
        )

        result = await self.invoke_json(prompt)

        context["roadmap"] = result
        await self.save_memory({
            "phase_count": len(result.get("phases", [])),
            "milestone_count": len(result.get("milestones", [])),
        })
        return context
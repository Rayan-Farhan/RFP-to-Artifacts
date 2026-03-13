import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class RoadmapAgent(BaseAgent):
    name = "Product Roadmap Agent"
    description = "Creates a phased product roadmap from features, metrics, and constraints"
    instructions = load_prompt("roadmap_agent")

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
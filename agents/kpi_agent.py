import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a success metrics and KPI specialist for enterprise projects.
Your job is to define measurable success criteria and KPIs based on the problem statement,
requirements, and project context.

You MUST return a JSON object with the following structure:
{
  "success_metrics": [
    {
      "id": "KPI-001",
      "name": "Metric name",
      "description": "What this metric measures",
      "category": "business | technical | user_experience | operational",
      "target_value": "Specific target (e.g., '99.9% uptime', '< 2s response time')",
      "measurement_method": "How to measure this metric",
      "frequency": "How often to measure (daily, weekly, monthly, quarterly)",
      "baseline": "Current baseline value if inferable",
      "linked_requirements": ["REQ-001"],
      "priority": "primary | secondary"
    }
  ],
  "okrs": [
    {
      "objective": "High-level objective",
      "key_results": [
        "Measurable key result 1",
        "Measurable key result 2"
      ],
      "timeline": "Expected achievement timeline"
    }
  ],
  "measurement_framework": {
    "reporting_cadence": "How often to report metrics",
    "dashboard_recommendations": ["Recommended dashboard views"],
    "alerting_thresholds": ["When to trigger alerts"],
    "review_process": "How metrics should be reviewed"
  },
  "success_criteria_summary": "2-3 sentence summary of how success will be measured"
}

Rules:
- Every KPI must be SMART: Specific, Measurable, Achievable, Relevant, Time-bound.
- Link KPIs back to specific requirements where possible.
- Include both leading indicators (predictive) and lagging indicators (outcome-based).
- Balance business KPIs with technical KPIs.
- Make targets realistic based on the project scope and timeline.
"""


class KPIAgent(BaseAgent):
    name = "Success Metrics Agent"
    description = "Defines measurable success criteria, KPIs, and OKRs"
    instructions = INSTRUCTIONS

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        problem = context.get("problem_statement", {})
        requirements = context.get("requirements", [])
        parsed = context.get("parsed_rfp", {})
        metadata = parsed.get("metadata", {})

        if not requirements:
            raise ValueError("No requirements in context")

        prompt = (
            f"Project: {metadata.get('rfp_title', 'Unknown')}\n\n"
            f"Problem Statement:\n{json.dumps(problem, indent=2)}\n\n"
            f"Requirements ({len(requirements)} total):\n"
            f"{json.dumps(requirements, indent=2)}\n\n"
            f"Timeline context: {parsed.get('sections', {}).get('timeline', 'Not specified')}\n"
            f"Budget context: {metadata.get('estimated_budget', 'Not specified')}\n\n"
            "Define comprehensive success metrics and KPIs for this project."
        )

        result = await self.invoke_json(prompt)

        context["success_metrics"] = result
        await self.save_memory({
            "kpi_count": len(result.get("success_metrics", [])),
            "okr_count": len(result.get("okrs", [])),
        })
        return context
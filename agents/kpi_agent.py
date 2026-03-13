import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class KPIAgent(BaseAgent):
    name = "Success Metrics Agent"
    description = "Defines measurable success criteria, KPIs, and OKRs"
    instructions = load_prompt("kpi_agent")

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
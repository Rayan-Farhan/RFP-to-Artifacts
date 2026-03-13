import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class FeaturePlanningAgent(BaseAgent):
    name = "Feature Planning Agent"
    description = "Converts requirements into a prioritized product feature backlog"
    instructions = load_prompt("feature_planning_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        requirements = context.get("requirements", [])
        if not requirements:
            raise ValueError("No requirements in context")

        # Also include RFP scope context for better feature mapping
        parsed = context.get("parsed_rfp", {})
        scope_text = parsed.get("sections", {}).get("scope_of_work", "")

        prompt = (
            f"Requirements:\n{json.dumps(requirements, indent=2)}\n\n"
            f"Project scope context:\n{scope_text}\n\n"
            "Convert these requirements into a prioritized feature backlog."
        )

        result = await self.invoke_json(prompt)

        context["features"] = result.get("features", [])
        await self.save_memory({
            "total_features": len(context["features"]),
            "by_priority": _count_by_field(context["features"], "priority"),
        })
        return context


def _count_by_field(items: list[dict], field: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        val = item.get(field, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts

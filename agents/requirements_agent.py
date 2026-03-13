from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class RequirementsAgent(BaseAgent):
    name = "Requirements Intelligence Agent"
    description = "Extracts and categorizes business and technical requirements"
    instructions = load_prompt("requirements_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        parsed = context.get("parsed_rfp", {})
        sections = parsed.get("sections", {})

        if not sections:
            raise ValueError("No parsed RFP sections in context")

        # Combine relevant sections for analysis
        relevant_text = "\n\n".join(
            f"=== {key.upper()} ===\n{value}"
            for key, value in sections.items()
            if value.strip()
        )

        result = await self.invoke_json(
            f"Extract all requirements from the following RFP sections:\n\n{relevant_text}"
        )

        context["requirements"] = result.get("requirements", [])
        await self.save_memory({
            "total_requirements": len(context["requirements"]),
            "by_category": _count_by_field(context["requirements"], "category"),
            "by_priority": _count_by_field(context["requirements"], "priority"),
        })
        return context


def _count_by_field(items: list[dict], field: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        val = item.get(field, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts

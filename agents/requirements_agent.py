from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are an expert business analyst specializing in enterprise software requirements.
Given parsed RFP sections, extract ALL requirements into a structured list.

Return a JSON object:
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Short requirement title",
      "description": "Detailed description of the requirement",
      "category": "functional | non-functional | constraint | compliance",
      "priority": "must-have | should-have | could-have | wont-have",
      "source_section": "Which RFP section this came from"
    }
  ]
}

Rules:
- Extract EVERY requirement, both explicit and implied.
- Categorize correctly: functional (what the system does), non-functional (performance, security, scalability), constraint (budget, timeline, tech limitations), compliance (regulatory, legal).
- Prioritize using MoSCoW based on language cues (e.g., "must", "shall" = must-have; "should", "ideally" = should-have; "may", "nice to have" = could-have).
- Number requirements sequentially: REQ-001, REQ-002, etc.
- Be thorough — missing requirements is worse than extracting too many.
"""


class RequirementsAgent(BaseAgent):
    name = "Requirements Intelligence Agent"
    description = "Extracts and categorizes business and technical requirements"
    instructions = INSTRUCTIONS

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

import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a senior product manager with expertise in feature planning and prioritization.
Given a list of requirements from an RFP, convert them into a prioritized product feature backlog.

Return a JSON object:
{
  "features": [
    {
      "id": "FEAT-001",
      "title": "Feature name",
      "description": "What this feature does and why it matters",
      "priority": "P0 | P1 | P2 | P3",
      "priority_score": 8.5,
      "linked_requirements": ["REQ-001", "REQ-003"],
      "user_story": "As a [role], I want [capability] so that [benefit]",
      "acceptance_criteria": [
        "Given X, when Y, then Z",
        "..."
      ]
    }
  ]
}

Prioritization rules:
- P0: Critical for MVP — system doesn't work without it.
- P1: Important — expected by most users, high impact.
- P2: Nice to have — enhances experience but not essential.
- P3: Future consideration — low urgency.
- priority_score: Rate 1-10 based on impact vs effort (higher = higher priority).
- Group related requirements into single features where appropriate.
- Each feature MUST have at least one user story and 2+ acceptance criteria.
- Link every feature back to source requirement IDs.
"""


class FeaturePlanningAgent(BaseAgent):
    name = "Feature Planning Agent"
    description = "Converts requirements into a prioritized product feature backlog"
    instructions = INSTRUCTIONS

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

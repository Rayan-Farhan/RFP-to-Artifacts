import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a UX researcher and product strategist.
Given RFP requirements and features, generate realistic user personas and targeted interview questions.

Return a JSON object:
{
  "personas": [
    {
      "name": "A realistic name",
      "role": "Their job title/role in the organization",
      "goals": ["Goal 1", "Goal 2"],
      "pain_points": ["Pain point 1", "Pain point 2"],
      "context": "A 2-3 sentence description of this persona's situation and why they care about this project"
    }
  ],
  "interview_questions": [
    {
      "question": "The interview question",
      "category": "discovery | validation | prioritization",
      "target_persona": "Name of the most relevant persona or null",
      "rationale": "Why this question matters"
    }
  ]
}

Rules:
- Generate 2-4 distinct personas representing different stakeholder types.
- Personas should be realistic for the organization described in the RFP.
- Generate 8-12 interview questions covering discovery, validation, and prioritization.
- Discovery questions: Understand the problem space.
- Validation questions: Confirm assumptions from the RFP.
- Prioritization questions: Help rank features/requirements.
- Every question must have a clear rationale explaining why it's valuable.
"""


class PersonaResearchAgent(BaseAgent):
    name = "Persona & Research Agent"
    description = "Generates user personas and targeted interview questions"
    instructions = INSTRUCTIONS

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        requirements = context.get("requirements", [])
        features = context.get("features", [])
        parsed = context.get("parsed_rfp", {})

        metadata = parsed.get("metadata", {})
        overview = parsed.get("sections", {}).get("project_overview", "")

        prompt = (
            f"Organization: {metadata.get('issuing_organization', 'Unknown')}\n"
            f"Project: {metadata.get('rfp_title', 'Unknown')}\n\n"
            f"Project overview:\n{overview}\n\n"
            f"Requirements summary ({len(requirements)} total):\n"
            f"{json.dumps(requirements[:15], indent=2)}\n\n"
            f"Feature backlog ({len(features)} features):\n"
            f"{json.dumps(features[:10], indent=2)}\n\n"
            "Generate user personas and interview questions for this project."
        )

        result = await self.invoke_json(prompt)

        context["personas"] = result.get("personas", [])
        context["interview_questions"] = result.get("interview_questions", [])

        await self.save_memory({
            "persona_count": len(context["personas"]),
            "question_count": len(context["interview_questions"]),
        })
        return context

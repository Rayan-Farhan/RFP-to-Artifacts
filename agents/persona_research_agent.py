import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class PersonaResearchAgent(BaseAgent):
    name = "Persona & Research Agent"
    description = "Generates user personas and targeted interview questions"
    instructions = load_prompt("persona_research_agent")

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

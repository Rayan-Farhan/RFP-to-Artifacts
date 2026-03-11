from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent
from config import get_settings

INSTRUCTIONS = """You are an expert RFP (Request for Proposal) document analyst.
Your job is to parse a raw RFP document and extract its key sections into a structured format.

You MUST return a JSON object with the following structure:
{
  "sections": {
    "executive_summary": "...",
    "project_overview": "...",
    "scope_of_work": "...",
    "requirements": "...",
    "technical_requirements": "...",
    "deliverables": "...",
    "timeline": "...",
    "evaluation_criteria": "...",
    "budget_constraints": "...",
    "submission_guidelines": "...",
    "terms_and_conditions": "...",
    "other": "..."
  },
  "metadata": {
    "issuing_organization": "...",
    "rfp_title": "...",
    "issue_date": "...",
    "due_date": "...",
    "contact_info": "...",
    "estimated_budget": "..."
  }
}

Rules:
- If a section is not found, set its value to an empty string.
- Preserve important details and numbers exactly as stated.
- Do NOT summarize excessively — keep detailed content.
- Extract all metadata you can find.
"""


class ParserAgent(BaseAgent):
    name = "RFP Parser Agent"
    description = "Extracts and structures sections from raw RFP text"
    instructions = INSTRUCTIONS

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        raw_text = context.get("raw_text", "")
        if not raw_text:
            raise ValueError("No raw_text provided in context")

        # Truncate to configurable limit to stay within token limits
        settings = get_settings()
        max_chars = settings.max_text_chars
        if len(raw_text) > max_chars:
            import logging
            logging.getLogger(__name__).warning(
                "RFP text truncated from %d to %d chars (configure MAX_TEXT_CHARS to increase)",
                len(raw_text), max_chars,
            )
        text_for_llm = raw_text[:max_chars]

        result = await self.invoke_json(
            f"Parse the following RFP document:\n\n{text_for_llm}"
        )

        context["parsed_rfp"] = {
            "sections": result.get("sections", {}),
            "metadata": result.get("metadata", {}),
            "raw_text": raw_text,
        }

        await self.save_memory({"sections_found": list(result.get("sections", {}).keys())})
        return context

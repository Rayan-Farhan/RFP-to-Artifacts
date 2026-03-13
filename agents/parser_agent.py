from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class ParserAgent(BaseAgent):
    name = "RFP Parser Agent"
    description = "Extracts and structures sections from raw RFP text"
    instructions = load_prompt("parser_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        raw_text = context.get("raw_text", "")
        if not raw_text:
            raise ValueError("No raw_text provided in context")

        # Truncate to ~100k chars to stay within token limits
        text_for_llm = raw_text[:100_000]

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

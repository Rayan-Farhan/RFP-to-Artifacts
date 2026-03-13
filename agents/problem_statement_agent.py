import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class ProblemStatementAgent(BaseAgent):
    name = "Problem Statement Agent"
    description = "Analyzes parsed RFP to define the core problem statement"
    instructions = load_prompt("problem_statement_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        parsed = context.get("parsed_rfp", {})
        sections = parsed.get("sections", {})
        metadata = parsed.get("metadata", {})

        if not sections:
            raise ValueError("No parsed RFP sections in context")

        prompt = (
            f"Organization: {metadata.get('issuing_organization', 'Unknown')}\n"
            f"Project: {metadata.get('rfp_title', 'Unknown')}\n\n"
            f"RFP Sections:\n{json.dumps(sections, indent=2)}\n\n"
            "Analyze this RFP and generate a comprehensive problem statement."
        )

        result = await self.invoke_json(prompt)

        context["problem_statement"] = result
        await self.save_memory({
            "problem_title": result.get("problem_title", ""),
            "stakeholders_count": len(result.get("stakeholders_affected", [])),
        })
        return context
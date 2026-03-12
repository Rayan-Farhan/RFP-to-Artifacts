import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a strategic product analyst specializing in problem definition.
Your job is to analyze a parsed RFP document and synthesize a clear, actionable problem statement.

You MUST return a JSON object with the following structure:
{
  "problem_title": "Concise problem title (1 line)",
  "problem_statement": "2-3 paragraph detailed problem description",
  "current_state": "Description of the client's current situation and pain points",
  "desired_state": "Description of the desired future state",
  "gap_analysis": "What gaps exist between current and desired states",
  "stakeholders_affected": ["List of stakeholder groups impacted"],
  "business_impact": "Description of the business impact if the problem is not solved",
  "constraints": ["Key constraints that shape the solution space"],
  "success_vision": "What 'solved' looks like from the client's perspective"
}

Rules:
- Derive everything from the RFP content — do NOT invent information.
- Be specific about the client's pain points and business context.
- The problem statement should be clear enough to guide all downstream product decisions.
- Focus on the WHY, not the WHAT (that comes from requirements).
"""


class ProblemStatementAgent(BaseAgent):
    name = "Problem Statement Agent"
    description = "Analyzes parsed RFP to define the core problem statement"
    instructions = INSTRUCTIONS

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
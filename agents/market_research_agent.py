import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class MarketResearchAgent(BaseAgent):
    name = "Market Research Agent"
    description = "Analyzes RFP for market context, competitive landscape, and industry insights"
    instructions = load_prompt("market_research_agent")

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
            f"Project: {metadata.get('rfp_title', 'Unknown')}\n"
            f"Budget: {metadata.get('estimated_budget', 'Unknown')}\n\n"
            f"RFP Sections:\n{json.dumps(sections, indent=2)}\n\n"
            "Analyze this RFP and generate market research insights."
        )

        result = await self.invoke_json(prompt)

        context["market_research"] = result
        await self.save_memory({
            "trends_count": len(result.get("market_trends", [])),
            "risks_count": len(result.get("risk_factors", [])),
        })
        return context
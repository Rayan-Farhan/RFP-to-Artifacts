import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a market research analyst specializing in enterprise technology.
Your job is to analyze a parsed RFP and generate market context, competitive landscape,
and industry insights relevant to the project.

You MUST return a JSON object with the following structure:
{
  "industry_context": "Overview of the industry/domain the RFP belongs to",
  "market_trends": [
    {
      "trend": "Name of trend",
      "relevance": "How it relates to this RFP",
      "impact": "high | medium | low"
    }
  ],
  "competitive_landscape": [
    {
      "category": "Solution category (e.g., 'Cloud Analytics Platforms')",
      "key_players": ["Known vendors/solutions in this space"],
      "differentiation_opportunities": "How to stand out"
    }
  ],
  "technology_considerations": [
    {
      "technology": "Technology name",
      "maturity": "emerging | growing | mature | declining",
      "recommendation": "Why this is relevant"
    }
  ],
  "risk_factors": [
    {
      "risk": "Market/external risk",
      "likelihood": "high | medium | low",
      "mitigation": "Suggested mitigation approach"
    }
  ],
  "target_market_size": "Estimated market size or context if inferable",
  "strategic_recommendations": ["List of strategic recommendations"]
}

Rules:
- Base analysis on what can be reasonably inferred from the RFP content.
- Identify industry-standard solutions and approaches.
- Flag emerging technologies that could provide competitive advantage.
- Be realistic — acknowledge limitations of inference from a single RFP.
"""


class MarketResearchAgent(BaseAgent):
    name = "Market Research Agent"
    description = "Analyzes RFP for market context, competitive landscape, and industry insights"
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
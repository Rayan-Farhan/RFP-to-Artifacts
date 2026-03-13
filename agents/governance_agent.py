import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class GovernanceAgent(BaseAgent):
    name = "Governance Agent"
    description = "Validates all artifacts for completeness, consistency, and quality"
    instructions = load_prompt("governance_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        # Build a summary of everything generated
        requirements = context.get("requirements", [])
        features = context.get("features", [])
        personas = context.get("personas", [])
        questions = context.get("interview_questions", [])
        sow = context.get("sow", {})
        parsed = context.get("parsed_rfp", {})
        problem = context.get("problem_statement", {})
        market = context.get("market_research", {})
        kpis = context.get("success_metrics", {})
        roadmap = context.get("roadmap", {})

        prompt = (
            f"Original RFP sections:\n"
            f"{json.dumps(parsed.get('sections', {}), indent=2)}\n\n"
            f"--- GENERATED ARTIFACTS ---\n\n"
            f"Problem Statement:\n{json.dumps(problem, indent=2)}\n\n"
            f"Market Research:\n{json.dumps(market, indent=2)}\n\n"
            f"Requirements ({len(requirements)}):\n{json.dumps(requirements, indent=2)}\n\n"
            f"Features ({len(features)}):\n{json.dumps(features, indent=2)}\n\n"
            f"Success Metrics/KPIs:\n{json.dumps(kpis, indent=2)}\n\n"
            f"Personas ({len(personas)}):\n{json.dumps(personas, indent=2)}\n\n"
            f"Interview Questions ({len(questions)}):\n{json.dumps(questions, indent=2)}\n\n"
            f"Product Roadmap:\n{json.dumps(roadmap, indent=2)}\n\n"
            f"Statement of Work:\n{json.dumps(sow, indent=2)}\n\n"
            "Validate all artifacts thoroughly."
        )

        result = await self.invoke_json(prompt)

        context["governance_report"] = result
        await self.save_memory({"overall_score": result.get("overall_score"), "status": result.get("status")})
        return context
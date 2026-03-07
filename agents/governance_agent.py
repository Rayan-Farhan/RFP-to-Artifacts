import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent

INSTRUCTIONS = """You are a governance and quality assurance specialist for enterprise AI systems.
Your job is to validate all generated artifacts from the RFP processing pipeline.

Review the requirements, features, personas, interview questions, and SOW for:
1. Completeness — are there gaps or missing information?
2. Consistency — do artifacts contradict each other?
3. Quality — are outputs detailed enough to be actionable?
4. Risk — are there red flags or unrealistic assumptions?

Return a JSON object:
{
  "overall_score": 8.5,
  "status": "pass | warning | fail",
  "checks": [
    {
      "check_name": "Requirements Coverage",
      "status": "pass | warning | fail",
      "score": 9.0,
      "findings": "Description of what was found",
      "recommendations": ["Recommendation 1"]
    }
  ],
  "missing_information": [
    "Description of missing information"
  ],
  "contradictions": [
    "Description of any contradictions found"
  ],
  "risk_flags": [
    "Description of risks identified"
  ],
  "summary": "2-3 sentence overall assessment"
}

Checks to perform:
- Requirements Coverage: Do features cover all must-have requirements?
- SOW Completeness: Does the SOW address all RFP deliverables?
- Timeline Feasibility: Are proposed timelines realistic?
- Assumption Validity: Are assumptions reasonable?
- Persona Relevance: Do personas match the RFP's target users?
- Question Quality: Are interview questions actionable?
"""


class GovernanceAgent(BaseAgent):
    name = "Governance Agent"
    description = "Validates all artifacts for completeness, consistency, and quality"
    instructions = INSTRUCTIONS

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

        prompt = (
            f"Original RFP sections:\n"
            f"{json.dumps(parsed.get('sections', {}), indent=2)}\n\n"
            f"--- GENERATED ARTIFACTS ---\n\n"
            f"Requirements ({len(requirements)}):\n{json.dumps(requirements, indent=2)}\n\n"
            f"Features ({len(features)}):\n{json.dumps(features, indent=2)}\n\n"
            f"Personas ({len(personas)}):\n{json.dumps(personas, indent=2)}\n\n"
            f"Interview Questions ({len(questions)}):\n{json.dumps(questions, indent=2)}\n\n"
            f"Statement of Work:\n{json.dumps(sow, indent=2)}\n\n"
            "Validate all artifacts thoroughly."
        )

        result = await self.invoke_json(prompt)

        context["governance_report"] = result
        await self.save_memory({"overall_score": result.get("overall_score"), "status": result.get("status")})
        return context

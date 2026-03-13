import json
from typing import Any
from semantic_kernel import Kernel
from agents.base_agent import BaseAgent, load_prompt


class SOWAgent(BaseAgent):
    name = "SOW Generation Agent"
    description = "Generates a professional Statement of Work from all artifacts"
    instructions = load_prompt("sow_agent")

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        super().__init__(job_id, kernel)

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        parsed = context.get("parsed_rfp", {})
        requirements = context.get("requirements", [])
        features = context.get("features", [])
        personas = context.get("personas", [])

        metadata = parsed.get("metadata", {})
        sections = parsed.get("sections", {})

        prompt = (
            f"RFP Title: {metadata.get('rfp_title', 'Enterprise Project')}\n"
            f"Issuing Organization: {metadata.get('issuing_organization', 'Client')}\n"
            f"Estimated Budget: {metadata.get('estimated_budget', 'Not specified')}\n\n"
            f"Original scope:\n{sections.get('scope_of_work', 'N/A')}\n\n"
            f"Original deliverables:\n{sections.get('deliverables', 'N/A')}\n\n"
            f"Original timeline:\n{sections.get('timeline', 'N/A')}\n\n"
            f"Extracted requirements ({len(requirements)} total):\n"
            f"{json.dumps(requirements, indent=2)}\n\n"
            f"Planned features ({len(features)} total):\n"
            f"{json.dumps(features, indent=2)}\n\n"
            f"User personas ({len(personas)}):\n"
            f"{json.dumps(personas, indent=2)}\n\n"
            "Generate a comprehensive Statement of Work for this project."
        )

        result = await self.invoke_json(prompt)

        context["sow"] = result

        await self.save_memory({
            "deliverable_count": len(result.get("deliverables", [])),
            "assumption_count": len(result.get("assumptions", [])),
        })
        return context

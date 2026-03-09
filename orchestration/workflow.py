import logging
from datetime import datetime
from typing import Any, Callable

from semantic_kernel import Kernel

from api.models import AgentLog, AgentStatus, JobStatus, RFPJob
from agents.base_agent import BaseAgent
from agents.parser_agent import ParserAgent
from agents.requirements_agent import RequirementsAgent
from agents.feature_planning_agent import FeaturePlanningAgent
from agents.persona_research_agent import PersonaResearchAgent
from agents.sow_agent import SOWAgent
from agents.governance_agent import GovernanceAgent
from services.ai_service import create_kernel
from services.foundry_tracing import trace_agent, trace_pipeline
from services.foundry_evaluation import evaluate_artifacts
from services import db_service

logger = logging.getLogger(__name__)

# Type for WebSocket broadcast callback
ProgressCallback = Callable[[str, AgentLog], Any] | None


class Workflow:
    """
    Orchestrates the multi-agent pipeline for RFP processing
    using Microsoft Semantic Kernel.

    Pipeline:
      RFP Text → Parser → Requirements → Feature Planning → Persona/Research → SOW → Governance

    All agents share a single Semantic Kernel instance with the
    Azure OpenAI chat completion service.
    """

    def __init__(self, job_id: str, on_progress: ProgressCallback = None):
        self.job_id = job_id
        self.on_progress = on_progress

        # Single shared Semantic Kernel instance for all agents
        self._kernel: Kernel = create_kernel()

        # Define the agent pipeline in execution order
        self.pipeline: list[BaseAgent] = [
            ParserAgent(job_id, kernel=self._kernel),
            RequirementsAgent(job_id, kernel=self._kernel),
            FeaturePlanningAgent(job_id, kernel=self._kernel),
            PersonaResearchAgent(job_id, kernel=self._kernel),
            SOWAgent(job_id, kernel=self._kernel),
            GovernanceAgent(job_id, kernel=self._kernel),
        ]

    async def run(self, raw_text: str) -> dict[str, Any]:
        """
        Execute the full agent pipeline.

        Args:
            raw_text: The extracted RFP document text.

        Returns:
            Final context dict containing all generated artifacts.
        """
        context: dict[str, Any] = {"raw_text": raw_text}
        agent_logs: list[AgentLog] = []

        # Update job as processing
        await db_service.save_job({
            "job_id": self.job_id,
            "status": JobStatus.PROCESSING.value,
            "updated_at": datetime.utcnow().isoformat(),
        })

        # Wrap the entire pipeline in an Azure AI Foundry trace span
        with trace_pipeline(self.job_id):
            for agent in self.pipeline:
                # Notify progress
                running_log = AgentLog(
                    agent_name=agent.name,
                    status=AgentStatus.RUNNING,
                    message=f"{agent.name} is processing...",
                )
                if self.on_progress:
                    await self.on_progress(self.job_id, running_log)

                try:
                    # Wrap each agent execution in a Foundry trace span
                    with trace_agent(agent.name, self.job_id) as span_data:
                        context, log = await agent.run(context)
                        span_data["duration_seconds"] = log.duration_seconds
                        span_data["tokens_used"] = log.tokens_used

                    agent_logs.append(log)

                    # Notify completion of this agent
                    if self.on_progress:
                        await self.on_progress(self.job_id, log)

                except Exception as e:
                    fail_log = AgentLog(
                        agent_name=agent.name,
                        status=AgentStatus.FAILED,
                        message=str(e),
                    )
                    agent_logs.append(fail_log)
                    if self.on_progress:
                        await self.on_progress(self.job_id, fail_log)

                    # Update job as failed
                    await db_service.save_job({
                        "job_id": self.job_id,
                        "status": JobStatus.FAILED.value,
                        "error": str(e),
                        "agent_logs": [l.model_dump(mode="json") for l in agent_logs],
                        "updated_at": datetime.utcnow().isoformat(),
                    })
                    raise

        # Save final artifacts
        artifacts = {
            "parsed_rfp": context.get("parsed_rfp"),
            "requirements": context.get("requirements", []),
            "features": context.get("features", []),
            "personas": context.get("personas", []),
            "interview_questions": context.get("interview_questions", []),
            "sow": context.get("sow"),
            "governance_report": context.get("governance_report"),
        }

        # Run Azure AI Foundry evaluation on generated artifacts
        evaluation_report = await evaluate_artifacts(self.job_id, artifacts)
        artifacts["foundry_evaluation"] = evaluation_report

        await db_service.save_artifacts(self.job_id, artifacts)

        # Update job as completed
        await db_service.save_job({
            "job_id": self.job_id,
            "status": JobStatus.COMPLETED.value,
            "agent_logs": [l.model_dump(mode="json") for l in agent_logs],
            "updated_at": datetime.utcnow().isoformat(),
        })

        logger.info("Pipeline completed for job %s (%d agents)", self.job_id, len(agent_logs))
        return artifacts

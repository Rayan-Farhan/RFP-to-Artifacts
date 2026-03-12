import asyncio
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
from agents.problem_statement_agent import ProblemStatementAgent
from agents.market_research_agent import MarketResearchAgent
from agents.kpi_agent import KPIAgent
from agents.roadmap_agent import RoadmapAgent
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

    Phased Pipeline (parallel within phases):
      Phase 1: Parser (sequential — everything depends on this)
      Phase 2: Problem Statement + Market Research + Requirements (parallel)
      Phase 3: Feature Planning + KPIs + Persona/Research (parallel)
      Phase 4: Product Roadmap + SOW (parallel)
      Phase 5: Governance (sequential — validates everything)

    All agents share a single Semantic Kernel instance with the
    Azure OpenAI chat completion service.
    """

    def __init__(self, job_id: str, on_progress: ProgressCallback = None):
        self.job_id = job_id
        self.on_progress = on_progress

        # Single shared Semantic Kernel instance for all agents
        self._kernel: Kernel = create_kernel()

    def _build_phases(self) -> list[list[BaseAgent]]:
        """
        Build the phased pipeline. Each inner list runs in parallel.
        """
        jid = self.job_id
        k = self._kernel
        return [
            # Phase 1: Ingestion (sequential)
            [ParserAgent(jid, kernel=k)],
            # Phase 2: Foundation (parallel)
            [
                ProblemStatementAgent(jid, kernel=k),
                MarketResearchAgent(jid, kernel=k),
                RequirementsAgent(jid, kernel=k),
            ],
            # Phase 3: Strategy & Metrics (parallel)
            [
                FeaturePlanningAgent(jid, kernel=k),
                KPIAgent(jid, kernel=k),
                PersonaResearchAgent(jid, kernel=k),
            ],
            # Phase 4: Output Generation (parallel)
            [
                RoadmapAgent(jid, kernel=k),
                SOWAgent(jid, kernel=k),
            ],
            # Phase 5: Validation (sequential)
            [GovernanceAgent(jid, kernel=k)],
        ]

    async def _run_agent(
        self, agent: BaseAgent, context: dict[str, Any], agent_logs: list[AgentLog]
    ) -> None:
        """Run a single agent, update shared context, broadcast progress."""
        # Notify running
        running_log = AgentLog(
            agent_name=agent.name,
            status=AgentStatus.RUNNING,
            message=f"{agent.name} is processing...",
        )
        if self.on_progress:
            await self.on_progress(self.job_id, running_log)

        # Execute with tracing
        with trace_agent(agent.name, self.job_id) as span_data:
            updated_context, log = await agent.run(context)
            span_data["duration_seconds"] = log.duration_seconds
            span_data["tokens_used"] = log.tokens_used

        # Merge results back into shared context
        context.update(updated_context)
        agent_logs.append(log)

        # Notify completion
        if self.on_progress:
            await self.on_progress(self.job_id, log)

    async def run(self, raw_text: str) -> dict[str, Any]:
        """
        Execute the full phased agent pipeline.

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

        phases = self._build_phases()

        # Wrap the entire pipeline in an Azure AI Foundry trace span
        with trace_pipeline(self.job_id):
            for phase_num, phase_agents in enumerate(phases, start=1):
                logger.info(
                    "Phase %d: running %d agent(s) — %s",
                    phase_num,
                    len(phase_agents),
                    [a.name for a in phase_agents],
                )

                try:
                    if len(phase_agents) == 1:
                        # Sequential — single agent, run directly
                        await self._run_agent(phase_agents[0], context, agent_logs)
                    else:
                        # Parallel — run all agents in this phase concurrently
                        await asyncio.gather(
                            *(
                                self._run_agent(agent, context, agent_logs)
                                for agent in phase_agents
                            )
                        )

                except Exception as e:
                    # Find which agent failed for the log
                    failed_agent_name = "Unknown"
                    for agent in phase_agents:
                        # The failing agent is whichever isn't in the completed logs
                        if agent.name not in [l.agent_name for l in agent_logs if l.status == AgentStatus.COMPLETED]:
                            failed_agent_name = agent.name
                            break

                    fail_log = AgentLog(
                        agent_name=failed_agent_name,
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
                        "error": f"Phase {phase_num} failed: {str(e)}",
                        "agent_logs": [l.model_dump(mode="json") for l in agent_logs],
                        "updated_at": datetime.utcnow().isoformat(),
                    })
                    raise

        # Save final artifacts (includes all new artifact types)
        artifacts = {
            "parsed_rfp": context.get("parsed_rfp"),
            "requirements": context.get("requirements", []),
            "features": context.get("features", []),
            "personas": context.get("personas", []),
            "interview_questions": context.get("interview_questions", []),
            "sow": context.get("sow"),
            "governance_report": context.get("governance_report"),
            # New artifacts
            "problem_statement": context.get("problem_statement"),
            "market_research": context.get("market_research"),
            "success_metrics": context.get("success_metrics"),
            "roadmap": context.get("roadmap"),
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
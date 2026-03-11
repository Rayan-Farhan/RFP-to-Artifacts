"""Tests for config, retry logic, and parallel workflow execution."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ── Config Tests ──

def test_config_defaults():
    """config.Settings should have sensible defaults."""
    from config import Settings

    settings = Settings(
        azure_openai_endpoint="https://test.openai.azure.com/",
        azure_openai_api_key="key",
    )
    assert settings.app_env == "development"
    assert settings.log_level == "INFO"
    assert settings.azure_openai_deployment == "gpt-4o"
    assert settings.max_text_chars == 100_000
    assert settings.agent_max_retries == 3
    assert settings.agent_retry_base_delay == 1.0
    assert settings.blob_rfp_container == "rfp-uploads"
    assert settings.blob_artifacts_container == "generated-artifacts"


# ── Retry Logic Tests ──

@pytest.mark.asyncio
async def test_invoke_with_retry_succeeds_first_try():
    """invoke_with_retry should return on first success."""
    from agents.parser_agent import ParserAgent

    with patch("agents.base_agent.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.ChatCompletionAgent", MagicMock):
        agent = ParserAgent(job_id="retry-test-001")
        agent.invoke = AsyncMock(return_value="hello")

        result = await agent.invoke_with_retry("test prompt")
        assert result == "hello"
        agent.invoke.assert_called_once()


@pytest.mark.asyncio
async def test_invoke_with_retry_retries_on_failure():
    """invoke_with_retry should retry after transient failures."""
    from agents.parser_agent import ParserAgent

    with patch("agents.base_agent.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.ChatCompletionAgent", MagicMock):
        agent = ParserAgent(job_id="retry-test-002")
        # Fail twice, then succeed
        agent.invoke = AsyncMock(side_effect=[
            RuntimeError("transient error"),
            RuntimeError("transient error again"),
            "success response",
        ])

        result = await agent.invoke_with_retry("test prompt")
        assert result == "success response"
        assert agent.invoke.call_count == 3


@pytest.mark.asyncio
async def test_invoke_with_retry_raises_after_max_retries():
    """invoke_with_retry should raise after exhausting retries."""
    from agents.parser_agent import ParserAgent

    with patch("agents.base_agent.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.ChatCompletionAgent", MagicMock):
        agent = ParserAgent(job_id="retry-test-003")
        agent.invoke = AsyncMock(side_effect=RuntimeError("permanent error"))

        with pytest.raises(RuntimeError, match="permanent error"):
            await agent.invoke_with_retry("test prompt")
        assert agent.invoke.call_count == 3  # default max_retries


# ── Parallel Workflow Tests ──

@pytest.mark.asyncio
async def test_workflow_has_parallel_stage():
    """Workflow should have a stage with multiple agents (parallel execution)."""
    from orchestration.workflow import Workflow

    with patch("orchestration.workflow.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.ChatCompletionAgent", MagicMock):
        wf = Workflow(job_id="parallel-test-001")

        # Check that there is at least one stage with >1 agent (parallel)
        parallel_stages = [s for s in wf._stages if len(s) > 1]
        assert len(parallel_stages) >= 1, "Workflow should have at least one parallel stage"

        # The parallel stage should contain Feature Planning and Persona agents
        parallel_agent_names = [a.name for a in parallel_stages[0]]
        assert "Feature Planning Agent" in parallel_agent_names
        assert "Persona & Research Agent" in parallel_agent_names


@pytest.mark.asyncio
async def test_workflow_parallel_merge_context():
    """Parallel agents should merge their outputs into the shared context."""
    from orchestration.workflow import Workflow

    with patch("orchestration.workflow.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.create_kernel", return_value=MagicMock()), \
         patch("agents.base_agent.ChatCompletionAgent", MagicMock), \
         patch("orchestration.workflow.trace_pipeline") as mock_trace_pipeline, \
         patch("orchestration.workflow.trace_agent") as mock_trace_agent, \
         patch("orchestration.workflow.evaluate_artifacts", new_callable=AsyncMock, return_value={}), \
         patch("orchestration.workflow.db_service") as mock_db:

        mock_trace_pipeline.return_value.__enter__ = MagicMock(return_value=None)
        mock_trace_pipeline.return_value.__exit__ = MagicMock(return_value=False)
        mock_trace_agent.return_value.__enter__ = MagicMock(return_value={})
        mock_trace_agent.return_value.__exit__ = MagicMock(return_value=False)
        mock_db.save_job = AsyncMock()
        mock_db.save_artifacts = AsyncMock()

        wf = Workflow(job_id="merge-test-001")

        # Mock all agents to inject specific outputs
        for stage in wf._stages:
            for agent in stage:
                async def make_run(name=agent.name):
                    from api.models import AgentLog, AgentStatus
                    return AgentLog(
                        agent_name=name,
                        status=AgentStatus.COMPLETED,
                        message="ok",
                    )

                if agent.name == "RFP Parser Agent":
                    agent.run = AsyncMock(return_value=(
                        {"raw_text": "test", "parsed_rfp": {"sections": {"s": "v"}, "metadata": {}, "raw_text": "t"}},
                        (await make_run()),
                    ))
                elif agent.name == "Requirements Intelligence Agent":
                    agent.run = AsyncMock(return_value=(
                        {"raw_text": "test", "parsed_rfp": {"sections": {"s": "v"}, "metadata": {}, "raw_text": "t"}, "requirements": [{"id": "R1"}]},
                        (await make_run()),
                    ))
                elif agent.name == "Feature Planning Agent":
                    agent.run = AsyncMock(return_value=(
                        {"features": [{"id": "F1"}]},
                        (await make_run()),
                    ))
                elif agent.name == "Persona & Research Agent":
                    agent.run = AsyncMock(return_value=(
                        {"personas": [{"name": "P1"}], "interview_questions": [{"q": "Q1"}]},
                        (await make_run()),
                    ))
                elif agent.name == "SOW Generation Agent":
                    agent.run = AsyncMock(return_value=(
                        {"sow": {"title": "SOW"}},
                        (await make_run()),
                    ))
                elif agent.name == "Governance Agent":
                    agent.run = AsyncMock(return_value=(
                        {"governance_report": {"status": "pass"}},
                        (await make_run()),
                    ))

        artifacts = await wf.run("Sample RFP text")

        # Verify parallel agents' outputs were merged
        assert "features" in artifacts
        assert "personas" in artifacts
        assert "interview_questions" in artifacts

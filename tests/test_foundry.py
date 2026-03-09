"""Tests for Azure AI Foundry integration (evaluation + tracing)."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from services.foundry_evaluation import evaluate_artifacts, _offline_evaluation
from services.foundry_tracing import init_tracing, trace_agent, trace_pipeline


# ── Offline Evaluation Tests ──

def test_offline_evaluation_complete_artifacts():
    """Offline evaluation should score complete artifacts highly."""
    artifacts = {
        "requirements": [{"id": f"REQ-{i}"} for i in range(6)],
        "features": [{"id": f"FEAT-{i}"} for i in range(4)],
        "personas": [{"name": f"Persona {i}"} for i in range(3)],
        "interview_questions": [{"q": f"Q{i}"} for i in range(8)],
        "sow": {
            "project_title": "Test",
            "executive_summary": "Summary",
            "scope": {"title": "Scope", "content": "Content"},
            "deliverables": ["D1"],
            "timeline": {"title": "Timeline", "content": "6mo"},
            "assumptions": ["A1"],
            "constraints": ["C1"],
            "acceptance_criteria": ["AC1"],
        },
    }
    result = _offline_evaluation(artifacts)

    assert result["evaluation_source"] == "offline_heuristic"
    assert result["overall_score"] > 7.0
    assert len(result["checks"]) == 5
    assert "summary" in result


def test_offline_evaluation_empty_artifacts():
    """Offline evaluation should score empty artifacts low."""
    result = _offline_evaluation({})

    assert result["evaluation_source"] == "offline_heuristic"
    assert result["overall_score"] == 0.0
    assert all(c["score"] == 0.0 for c in result["checks"])


def test_offline_evaluation_partial_artifacts():
    """Offline evaluation should handle partial artifacts."""
    artifacts = {
        "requirements": [{"id": "REQ-1"}, {"id": "REQ-2"}],
        "features": [],
        "sow": {"project_title": "Test"},
    }
    result = _offline_evaluation(artifacts)

    assert result["evaluation_source"] == "offline_heuristic"
    assert 0 < result["overall_score"] < 10.0


@pytest.mark.asyncio
async def test_evaluate_artifacts_fallback_no_config():
    """evaluate_artifacts should fall back to offline when Foundry not configured."""
    with patch("services.foundry_evaluation.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(azure_ai_project_connection_string="")
        result = await evaluate_artifacts("test-job", {
            "requirements": [{"id": "REQ-1"}],
        })
    assert result["evaluation_source"] == "offline_heuristic"


# ── Tracing Tests ──

def test_init_tracing_no_config():
    """init_tracing should gracefully skip when not configured."""
    with patch("services.foundry_tracing.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(azure_ai_project_connection_string="")
        init_tracing()  # Should not raise


def test_trace_agent_no_op():
    """trace_agent should yield a no-op dict when tracing is disabled."""
    import services.foundry_tracing as ft
    original_enabled = ft._tracing_enabled
    ft._tracing_enabled = False
    try:
        with trace_agent("TestAgent", "job-123") as span_data:
            span_data["test_key"] = "test_value"
        assert span_data["test_key"] == "test_value"
    finally:
        ft._tracing_enabled = original_enabled


def test_trace_pipeline_no_op():
    """trace_pipeline should yield a no-op when tracing is disabled."""
    import services.foundry_tracing as ft
    original_enabled = ft._tracing_enabled
    ft._tracing_enabled = False
    try:
        with trace_pipeline("job-123"):
            pass  # Should not raise
    finally:
        ft._tracing_enabled = original_enabled

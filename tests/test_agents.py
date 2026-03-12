import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock

from agents.parser_agent import ParserAgent
from agents.requirements_agent import RequirementsAgent
from agents.feature_planning_agent import FeaturePlanningAgent
from agents.persona_research_agent import PersonaResearchAgent
from agents.sow_agent import SOWAgent
from agents.governance_agent import GovernanceAgent


# ── Fixtures ──

MOCK_PARSED_RFP = {
    "sections": {
        "executive_summary": "Build a cloud platform for data analytics.",
        "requirements": "Must support real-time data processing. Must handle 10TB daily.",
        "scope_of_work": "Design, build, and deploy a data analytics platform.",
        "deliverables": "Working platform, documentation, training materials.",
        "timeline": "6 months from contract signing.",
        "project_overview": "Enterprise data analytics modernization project.",
    },
    "metadata": {
        "issuing_organization": "Acme Corp",
        "rfp_title": "Data Analytics Platform RFP",
        "estimated_budget": "$2M",
    },
    "raw_text": "Full RFP text here...",
}

MOCK_REQUIREMENTS = [
    {
        "id": "REQ-001",
        "title": "Real-time Processing",
        "description": "System must support real-time data processing",
        "category": "functional",
        "priority": "must-have",
        "source_section": "requirements",
    },
    {
        "id": "REQ-002",
        "title": "Data Volume",
        "description": "Handle 10TB daily data volume",
        "category": "non-functional",
        "priority": "must-have",
        "source_section": "requirements",
    },
]

MOCK_FEATURES = [
    {
        "id": "FEAT-001",
        "title": "Stream Processing Engine",
        "description": "Real-time data stream processing",
        "priority": "P0",
        "priority_score": 9.0,
        "linked_requirements": ["REQ-001"],
        "user_story": "As a data engineer, I want real-time processing.",
        "acceptance_criteria": ["Latency < 1s", "Handles 10TB/day"],
    },
]

MOCK_PERSONAS = [
    {
        "name": "Sarah Chen",
        "role": "Data Engineer",
        "goals": ["Process data in real-time"],
        "pain_points": ["Current system is too slow"],
        "context": "Senior data engineer at Acme Corp.",
    },
]


@pytest.fixture(autouse=True)
def _mock_sk(monkeypatch):
    """Prevent Semantic Kernel from connecting to Azure OpenAI during tests."""
    monkeypatch.setattr("agents.base_agent.create_kernel", lambda: MagicMock())
    monkeypatch.setattr("agents.base_agent.ChatCompletionAgent", MagicMock)


# ── Tests ──

@pytest.mark.asyncio
async def test_parser_agent():
    agent = ParserAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={
        "sections": MOCK_PARSED_RFP["sections"],
        "metadata": MOCK_PARSED_RFP["metadata"],
    })
    agent.save_memory = AsyncMock()

    context = {"raw_text": "Sample RFP text content here..."}
    result, log = await agent.run(context)

    assert "parsed_rfp" in result
    assert "sections" in result["parsed_rfp"]
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_requirements_agent():
    agent = RequirementsAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={"requirements": MOCK_REQUIREMENTS})
    agent.save_memory = AsyncMock()

    context = {"parsed_rfp": MOCK_PARSED_RFP}
    result, log = await agent.run(context)

    assert "requirements" in result
    assert len(result["requirements"]) == 2
    assert result["requirements"][0]["id"] == "REQ-001"
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_feature_planning_agent():
    agent = FeaturePlanningAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={"features": MOCK_FEATURES})
    agent.save_memory = AsyncMock()

    context = {"requirements": MOCK_REQUIREMENTS, "parsed_rfp": MOCK_PARSED_RFP}
    result, log = await agent.run(context)

    assert "features" in result
    assert len(result["features"]) == 1
    assert result["features"][0]["priority"] == "P0"
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_persona_research_agent():
    agent = PersonaResearchAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={
        "personas": MOCK_PERSONAS,
        "interview_questions": [
            {
                "question": "How do you currently handle data?",
                "category": "discovery",
                "target_persona": "Sarah Chen",
                "rationale": "Understand current state",
            }
        ],
    })
    agent.save_memory = AsyncMock()

    context = {
        "requirements": MOCK_REQUIREMENTS,
        "features": MOCK_FEATURES,
        "parsed_rfp": MOCK_PARSED_RFP,
    }
    result, log = await agent.run(context)

    assert "personas" in result
    assert "interview_questions" in result
    assert len(result["personas"]) == 1
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_sow_agent():
    agent = SOWAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={
        "project_title": "Data Analytics Platform",
        "executive_summary": "Comprehensive analytics solution.",
        "scope": {"title": "Scope", "content": "Full platform build."},
        "deliverables": ["Platform", "Documentation"],
        "timeline": {"title": "Timeline", "content": "6 months"},
        "assumptions": ["Client provides data access"],
        "constraints": ["$2M budget"],
        "acceptance_criteria": ["All tests pass"],
        "estimated_effort": "12 person-months",
    })
    agent.save_memory = AsyncMock()

    context = {
        "parsed_rfp": MOCK_PARSED_RFP,
        "requirements": MOCK_REQUIREMENTS,
        "features": MOCK_FEATURES,
        "personas": MOCK_PERSONAS,
    }
    result, log = await agent.run(context)

    assert "sow" in result
    assert result["sow"]["project_title"] == "Data Analytics Platform"
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_governance_agent():
    agent = GovernanceAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value={
        "overall_score": 8.5,
        "status": "pass",
        "checks": [],
        "missing_information": [],
        "contradictions": [],
        "risk_flags": [],
        "summary": "All artifacts are consistent.",
    })
    agent.save_memory = AsyncMock()

    context = {
        "parsed_rfp": MOCK_PARSED_RFP,
        "requirements": MOCK_REQUIREMENTS,
        "features": MOCK_FEATURES,
        "personas": MOCK_PERSONAS,
        "interview_questions": [],
        "sow": {"project_title": "Test"},
    }
    result, log = await agent.run(context)

    assert "governance_report" in result
    assert result["governance_report"]["status"] == "pass"
    assert log.status.value == "completed"

from agents.problem_statement_agent import ProblemStatementAgent
from agents.market_research_agent import MarketResearchAgent
from agents.kpi_agent import KPIAgent
from agents.roadmap_agent import RoadmapAgent


# ── New Agent Tests ──

MOCK_PROBLEM_STATEMENT = {
    "problem_title": "Legacy Analytics Modernization",
    "problem_statement": "Acme Corp needs to modernize their data analytics.",
    "current_state": "Outdated batch processing system.",
    "desired_state": "Real-time cloud analytics platform.",
    "gap_analysis": "Current system cannot handle 10TB daily volume.",
    "stakeholders_affected": ["Data Engineers", "Business Analysts"],
    "business_impact": "Revenue loss due to delayed insights.",
    "constraints": ["$2M budget", "6-month timeline"],
    "success_vision": "Self-service real-time analytics for all teams.",
}

MOCK_MARKET_RESEARCH = {
    "industry_context": "Enterprise data analytics market growing at 25% CAGR.",
    "market_trends": [
        {"trend": "Cloud-native analytics", "relevance": "Core to RFP", "impact": "high"}
    ],
    "competitive_landscape": [
        {
            "category": "Cloud Analytics Platforms",
            "key_players": ["Snowflake", "Databricks"],
            "differentiation_opportunities": "Real-time focus",
        }
    ],
    "technology_considerations": [
        {"technology": "Apache Kafka", "maturity": "mature", "recommendation": "Use for streaming"}
    ],
    "risk_factors": [
        {"risk": "Vendor lock-in", "likelihood": "medium", "mitigation": "Use open standards"}
    ],
    "target_market_size": "$50B enterprise analytics market",
    "strategic_recommendations": ["Prioritize real-time capabilities"],
}

MOCK_SUCCESS_METRICS = {
    "success_metrics": [
        {
            "id": "KPI-001",
            "name": "Data Processing Latency",
            "description": "Time to process incoming data",
            "category": "technical",
            "target_value": "< 2 seconds",
            "measurement_method": "APM monitoring",
            "frequency": "real-time",
            "baseline": "15 minutes (batch)",
            "linked_requirements": ["REQ-001"],
            "priority": "primary",
        }
    ],
    "okrs": [
        {
            "objective": "Deliver real-time analytics capability",
            "key_results": ["Latency < 2s", "99.9% uptime"],
            "timeline": "End of Phase 1",
        }
    ],
    "measurement_framework": {
        "reporting_cadence": "Weekly",
        "dashboard_recommendations": ["Latency dashboard"],
        "alerting_thresholds": ["Latency > 5s"],
        "review_process": "Weekly sprint review",
    },
    "success_criteria_summary": "Success measured by latency, uptime, and adoption.",
}

MOCK_ROADMAP = {
    "roadmap_title": "Product Roadmap: Data Analytics Platform",
    "vision_statement": "Real-time analytics for the enterprise.",
    "phases": [
        {
            "phase_id": "PHASE-1",
            "name": "Foundation & MVP",
            "duration": "8 weeks",
            "objective": "Core streaming pipeline",
            "features": ["FEAT-001"],
            "deliverables": ["Stream processing engine"],
            "success_criteria": ["Handles 10TB/day"],
            "dependencies": ["Cloud account provisioning"],
            "risks": ["Integration complexity"],
        }
    ],
    "milestones": [
        {
            "name": "MVP Demo",
            "target_date_relative": "Week 8",
            "deliverables": ["Working pipeline"],
            "kpis_measured": ["KPI-001"],
        }
    ],
    "release_strategy": {
        "approach": "phased",
        "rationale": "Reduce risk with incremental delivery",
        "rollback_plan": "Maintain legacy system in parallel",
    },
    "resource_summary": {
        "estimated_team_size": "6-8 engineers",
        "key_roles": ["Data Engineer", "DevOps", "PM"],
        "estimated_total_effort": "12 person-months",
    },
    "roadmap_summary": "3-phase delivery over 6 months.",
}


@pytest.mark.asyncio
async def test_problem_statement_agent():
    agent = ProblemStatementAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value=MOCK_PROBLEM_STATEMENT)
    agent.save_memory = AsyncMock()

    context = {"parsed_rfp": MOCK_PARSED_RFP}
    result, log = await agent.run(context)

    assert "problem_statement" in result
    assert result["problem_statement"]["problem_title"] == "Legacy Analytics Modernization"
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_market_research_agent():
    agent = MarketResearchAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value=MOCK_MARKET_RESEARCH)
    agent.save_memory = AsyncMock()

    context = {"parsed_rfp": MOCK_PARSED_RFP}
    result, log = await agent.run(context)

    assert "market_research" in result
    assert len(result["market_research"]["market_trends"]) == 1
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_kpi_agent():
    agent = KPIAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value=MOCK_SUCCESS_METRICS)
    agent.save_memory = AsyncMock()

    context = {
        "parsed_rfp": MOCK_PARSED_RFP,
        "requirements": MOCK_REQUIREMENTS,
        "problem_statement": MOCK_PROBLEM_STATEMENT,
    }
    result, log = await agent.run(context)

    assert "success_metrics" in result
    assert len(result["success_metrics"]["success_metrics"]) == 1
    assert result["success_metrics"]["success_metrics"][0]["id"] == "KPI-001"
    assert log.status.value == "completed"


@pytest.mark.asyncio
async def test_roadmap_agent():
    agent = RoadmapAgent(job_id="test-001")
    agent.invoke_json = AsyncMock(return_value=MOCK_ROADMAP)
    agent.save_memory = AsyncMock()

    context = {
        "parsed_rfp": MOCK_PARSED_RFP,
        "requirements": MOCK_REQUIREMENTS,
        "features": MOCK_FEATURES,
        "success_metrics": MOCK_SUCCESS_METRICS,
    }
    result, log = await agent.run(context)

    assert "roadmap" in result
    assert len(result["roadmap"]["phases"]) == 1
    assert result["roadmap"]["phases"][0]["phase_id"] == "PHASE-1"
    assert log.status.value == "completed"
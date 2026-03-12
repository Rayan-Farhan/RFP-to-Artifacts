from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentLog(BaseModel):
    agent_name: str
    status: AgentStatus
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: Optional[float] = None
    tokens_used: Optional[int] = None


class RFPJob(BaseModel):
    job_id: str
    filename: str
    status: JobStatus = JobStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    agent_logs: list[AgentLog] = []
    error: Optional[str] = None


class Requirement(BaseModel):
    id: str
    title: str
    description: str
    category: str  # functional, non-functional, constraint
    priority: str  # must-have, should-have, could-have, won't-have
    source_section: Optional[str] = None


class Feature(BaseModel):
    id: str
    title: str
    description: str
    priority: str  # P0, P1, P2, P3
    priority_score: Optional[float] = None
    linked_requirements: list[str] = []
    user_story: Optional[str] = None
    acceptance_criteria: list[str] = []


class UserPersona(BaseModel):
    name: str
    role: str
    goals: list[str]
    pain_points: list[str]
    context: str


class InterviewQuestion(BaseModel):
    question: str
    category: str  # discovery, validation, prioritization
    target_persona: Optional[str] = None
    rationale: str


class SOWSection(BaseModel):
    title: str
    content: str


class StatementOfWork(BaseModel):
    project_title: str
    executive_summary: str
    scope: SOWSection
    deliverables: list[str]
    timeline: SOWSection
    assumptions: list[str]
    constraints: list[str]
    acceptance_criteria: list[str]
    estimated_effort: Optional[str] = None


class ParsedRFP(BaseModel):
    sections: dict[str, str]
    metadata: dict[str, str] = {}
    raw_text: str


# ── New Models for Added Agents ──


class ProblemStatement(BaseModel):
    problem_title: str
    problem_statement: str
    current_state: str
    desired_state: str
    gap_analysis: str
    stakeholders_affected: list[str] = []
    business_impact: str
    constraints: list[str] = []
    success_vision: str


class MarketTrend(BaseModel):
    trend: str
    relevance: str
    impact: str  # high, medium, low


class CompetitiveLandscape(BaseModel):
    category: str
    key_players: list[str] = []
    differentiation_opportunities: str


class TechnologyConsideration(BaseModel):
    technology: str
    maturity: str  # emerging, growing, mature, declining
    recommendation: str


class MarketRiskFactor(BaseModel):
    risk: str
    likelihood: str  # high, medium, low
    mitigation: str


class MarketResearch(BaseModel):
    industry_context: str
    market_trends: list[MarketTrend] = []
    competitive_landscape: list[CompetitiveLandscape] = []
    technology_considerations: list[TechnologyConsideration] = []
    risk_factors: list[MarketRiskFactor] = []
    target_market_size: Optional[str] = None
    strategic_recommendations: list[str] = []


class SuccessMetric(BaseModel):
    id: str
    name: str
    description: str
    category: str  # business, technical, user_experience, operational
    target_value: str
    measurement_method: str
    frequency: str
    baseline: Optional[str] = None
    linked_requirements: list[str] = []
    priority: str  # primary, secondary


class OKR(BaseModel):
    objective: str
    key_results: list[str] = []
    timeline: str


class MeasurementFramework(BaseModel):
    reporting_cadence: str
    dashboard_recommendations: list[str] = []
    alerting_thresholds: list[str] = []
    review_process: str


class SuccessMetrics(BaseModel):
    success_metrics: list[SuccessMetric] = []
    okrs: list[OKR] = []
    measurement_framework: Optional[MeasurementFramework] = None
    success_criteria_summary: str


class RoadmapPhase(BaseModel):
    phase_id: str
    name: str
    duration: str
    objective: str
    features: list[str] = []
    deliverables: list[str] = []
    success_criteria: list[str] = []
    dependencies: list[str] = []
    risks: list[str] = []


class Milestone(BaseModel):
    name: str
    target_date_relative: str
    deliverables: list[str] = []
    kpis_measured: list[str] = []


class ReleaseStrategy(BaseModel):
    approach: str  # big-bang, phased, rolling, beta-first
    rationale: str
    rollback_plan: str


class ResourceSummary(BaseModel):
    estimated_team_size: str
    key_roles: list[str] = []
    estimated_total_effort: str


class ProductRoadmap(BaseModel):
    roadmap_title: str
    vision_statement: str
    phases: list[RoadmapPhase] = []
    milestones: list[Milestone] = []
    release_strategy: Optional[ReleaseStrategy] = None
    resource_summary: Optional[ResourceSummary] = None
    roadmap_summary: str


# ── Updated Artifacts Model ──


class Artifacts(BaseModel):
    job_id: str
    parsed_rfp: Optional[ParsedRFP] = None
    requirements: list[Requirement] = []
    features: list[Feature] = []
    personas: list[UserPersona] = []
    interview_questions: list[InterviewQuestion] = []
    sow: Optional[StatementOfWork] = None
    governance_report: Optional[dict] = None
    foundry_evaluation: Optional[dict] = None
    # New artifact fields
    problem_statement: Optional[dict] = None
    market_research: Optional[dict] = None
    success_metrics: Optional[dict] = None
    roadmap: Optional[dict] = None
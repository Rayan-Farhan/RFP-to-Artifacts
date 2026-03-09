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

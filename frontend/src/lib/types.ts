// === Enums ===
export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type AgentStatus = "idle" | "running" | "completed" | "failed";

// === Core Models ===
export interface AgentLog {
  agent_name: string;
  status: AgentStatus;
  message: string;
  timestamp: string;
  duration_seconds: number | null;
  tokens_used: number | null;
}

export interface RFPJob {
  job_id: string;
  filename: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  agent_logs: AgentLog[];
  error: string | null;
}

// === Parsed RFP ===
export interface ParsedRFP {
  sections: Record<string, string>;
  metadata: {
    issuing_organization?: string;
    rfp_title?: string;
    issue_date?: string;
    due_date?: string;
    contact_info?: string;
    estimated_budget?: string;
  };
  raw_text: string;
}

// === Requirements ===
export interface Requirement {
  id: string;
  title: string;
  description: string;
  category: "functional" | "non-functional" | "constraint" | "compliance" | string;
  priority: "must-have" | "should-have" | "could-have" | "wont-have" | "won't-have" | string;
  source_section: string | null;
}

// === Features ===
export interface Feature {
  id: string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2" | "P3";
  priority_score: number | null;
  linked_requirements: string[];
  user_story: string | null;
  acceptance_criteria: string[];
}

// === Personas ===
export interface UserPersona {
  name: string;
  role: string;
  goals: string[];
  pain_points: string[];
  context: string;
}

export interface InterviewQuestion {
  question: string;
  category: "discovery" | "validation" | "prioritization";
  target_persona: string | null;
  rationale: string;
}

// === Statement of Work ===
export interface SOWSection {
  title: string;
  content: string;
}

export interface StatementOfWork {
  project_title: string;
  executive_summary: string;
  scope: SOWSection;
  deliverables: string[];
  timeline: SOWSection;
  assumptions: string[];
  constraints: string[];
  acceptance_criteria: string[];
  estimated_effort: string | null;
}

// === Governance Report ===
export interface GovernanceCheck {
  check_name: string;
  status: "pass" | "warning" | "fail";
  score: number;
  findings: string;
  recommendations: string[];
}

export interface GovernanceReport {
  overall_score: number;
  status: "pass" | "warning" | "fail";
  checks: GovernanceCheck[];
  missing_information: string[];
  contradictions: string[];
  risk_flags: string[];
  summary: string;
}

// === Evaluation ===
export interface OfflineCheck {
  metric: string;
  value: number | string;
  score: number;
  max_score: number;
}

export interface EvaluationReport {
  evaluation_source: "azure_ai_foundry" | "offline_heuristic";
  // Azure AI Foundry fields
  sow_evaluation?: {
    relevance: number | Record<string, unknown>;
    coherence: number | Record<string, unknown>;
    groundedness: number | Record<string, unknown>;
  };
  requirements_evaluation?: {
    relevance: number | Record<string, unknown>;
    count: number;
  };
  // Offline heuristic fields
  checks?: OfflineCheck[];
  // Shared
  overall_score?: number;
  summary: string;
  job_id?: string;
}

// === New artifact types (flexible structure) ===
export type ProblemStatement = Record<string, unknown>;
export type MarketResearch = Record<string, unknown>;
export type SuccessMetrics = Record<string, unknown>;
export type Roadmap = Record<string, unknown>;

// === Artifacts Payload ===
export interface ArtifactsPayload {
  parsed_rfp: ParsedRFP | null;
  problem_statement: ProblemStatement | null;
  market_research: MarketResearch | null;
  requirements: Requirement[];
  features: Feature[];
  success_metrics: SuccessMetrics | null;
  roadmap: Roadmap | null;
  personas: UserPersona[];
  interview_questions: InterviewQuestion[];
  sow: StatementOfWork | null;
  governance_report: GovernanceReport | null;
  foundry_evaluation: EvaluationReport | null;
}

// === Artifacts Response (API wrapper) ===
export interface ArtifactsResponse {
  job_id: string;
  status: "processing" | "completed";
  message?: string;
  artifacts?: ArtifactsPayload;
  download_urls?: Record<string, string>;
}

// === Agent Pipeline Definition (5-stage orchestration) ===
export interface PipelineAgent {
  name: string;
  icon: string;
  description: string;
}

export interface PipelineStage {
  stage: number;
  title: string;
  parallel: boolean;
  agents: PipelineAgent[];
}

export const ORCHESTRATION_PIPELINE: PipelineStage[] = [
  {
    stage: 1,
    title: "Ingestion",
    parallel: false,
    agents: [
      { name: "RFP Parser Agent", icon: "FileText", description: "Extracting document structure & metadata" },
    ],
  },
  {
    stage: 2,
    title: "Foundation",
    parallel: true,
    agents: [
      { name: "Problem Statement Agent", icon: "Target", description: "Defining the core problem" },
      { name: "Market Research Agent", icon: "TrendingUp", description: "Analyzing market context" },
      { name: "Requirements Intelligence Agent", icon: "ListChecks", description: "Extracting & categorizing requirements" },
    ],
  },
  {
    stage: 3,
    title: "Strategy & Metrics",
    parallel: true,
    agents: [
      { name: "Feature Planning Agent", icon: "Kanban", description: "Building prioritized feature backlog" },
      { name: "Success Metrics Agent", icon: "BarChart3", description: "Defining KPIs and success criteria" },
      { name: "Persona & Research Agent", icon: "Users", description: "Generating personas & research questions" },
    ],
  },
  {
    stage: 4,
    title: "Output Generation",
    parallel: true,
    agents: [
      { name: "Product Roadmap Agent", icon: "Map", description: "Creating phased product roadmap" },
      { name: "SOW Generation Agent", icon: "FileSignature", description: "Drafting Statement of Work" },
    ],
  },
  {
    stage: 5,
    title: "Validation",
    parallel: false,
    agents: [
      { name: "Governance Agent", icon: "ShieldCheck", description: "Validating quality & compliance" },
    ],
  },
];

// Kept for backward compat if needed
export const AGENT_PIPELINE = ORCHESTRATION_PIPELINE.flatMap((s) => s.agents);

// === Download artifact types ===
export const DOWNLOAD_ARTIFACTS = [
  { key: "market_research", label: "Market Research", ext: "xlsx" },
  { key: "requirements", label: "Requirements", ext: "xlsx" },
  { key: "feature_backlog", label: "Feature Backlog", ext: "xlsx" },
  { key: "roadmap", label: "Roadmap", ext: "xlsx" },
  { key: "kpis", label: "KPIs", ext: "xlsx" },
  { key: "sow", label: "Statement of Work", ext: "docx" },
  { key: "problem_statement", label: "Problem Statement", ext: "docx" },
  { key: "personas", label: "Personas", ext: "docx" },
  { key: "governance_report", label: "Governance Report", ext: "docx" },
] as const;

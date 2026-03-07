# Architecture Decision Record

## System Design: Multi-Agent RFP Processing Pipeline

### Overview

The system uses a sequential multi-agent pipeline where each agent specializes in one transformation step. Agents communicate through a shared context dictionary, and each agent enriches it with its outputs.

### Why Multi-Agent Over Single LLM Call?

| Factor | Single Call | Multi-Agent Pipeline |
|--------|------------|---------------------|
| Quality | Shallow, generic output | Deep, specialized output per artifact |
| Reliability | One failure = total failure | Isolated failures, partial results possible |
| Observability | Black box | Per-agent metrics, logs, and debugging |
| Scalability | Token limit bottleneck | Each agent operates within limits |
| Governance | Hard to validate | Each output is independently checkable |

### Agent Pipeline Design

```
                    ┌──────────────┐
     Raw Text ────►│ Parser Agent  │
                    └──────┬───────┘
                           │ Structured sections + metadata
                    ┌──────▼───────────────┐
                    │ Requirements Agent    │
                    └──────┬───────────────┘
                           │ Categorized requirements list
                    ┌──────▼───────────────┐
                    │ Feature Planning Agent│
                    └──────┬───────────────┘
                           │ Prioritized feature backlog
                    ┌──────▼───────────────┐
                    │ Persona/Research Agent│
                    └──────┬───────────────┘
                           │ Personas + interview questions
                    ┌──────▼───────────────┐
                    │ SOW Generation Agent  │
                    └──────┬───────────────┘
                           │ Statement of Work
                    ┌──────▼───────────────┐
                    │ Governance Agent      │
                    └──────┬───────────────┘
                           │ Quality report
                           ▼
                    Final Artifacts
```

### Shared Context Pattern

All agents read from and write to a shared `context: dict` passed through the pipeline:

```python
context = {
    "raw_text": "...",           # Input: from document processor
    "parsed_rfp": {...},         # Output: Parser Agent
    "requirements": [...],       # Output: Requirements Agent
    "features": [...],           # Output: Feature Planning Agent
    "personas": [...],           # Output: Persona Agent
    "interview_questions": [...],# Output: Persona Agent
    "sow": {...},                # Output: SOW Agent
    "governance_report": {...},  # Output: Governance Agent
}
```

### Why Sequential (Not Parallel)?

Each agent depends on the previous agent's output:
- Requirements Agent needs parsed sections from Parser Agent
- Feature Agent needs requirements to build features
- SOW Agent needs all previous artifacts

The Governance Agent runs last because it validates everything.

**Future enhancement**: Persona Agent and Feature Planning Agent could run in parallel since they both depend on Requirements but not on each other.

### Azure Service Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Cosmos DB (serverless) | Native Azure, pay-per-request (cheap for demo), JSON-native |
| Storage | Blob Storage | Standard for document storage, integrates with Document Intelligence |
| AI Model | Azure OpenAI (GPT-4o) | Most capable model, native Azure integration |
| IaC | Bicep | Native Azure language, judges prefer Microsoft tooling |
| Backend | FastAPI | Fastest Python web framework, native async, auto-docs |
| Deployment | App Service + Docker | Simpler than AKS for MVP, sufficient for demo |

### Security Architecture

- **Secrets**: Azure Key Vault (no hardcoded keys)
- **Storage**: Encrypted at rest (Azure default + TLS 1.2 minimum)
- **Access**: RBAC on all resources
- **API**: CORS restricted, file type validation, size limits
- **AI Safety**: Content filtering via Azure OpenAI, output validation via Governance Agent

### Monitoring Strategy

- **Application Insights**: Request latency, error rates, dependencies
- **Custom Metrics**: Per-agent execution time, token usage, processing cost
- **Agent Logs**: Stored in Cosmos DB for audit trail and debugging
- **WebSocket**: Real-time progress pushed to frontend

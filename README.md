# RFP Product Strategy Engine

> Autonomous Enterprise Product Strategy Engine — A multi-agent AI system that transforms complex RFP documents into actionable product management artifacts.

## What It Does

Upload a 50-page enterprise RFP and get back:

- **Structured Requirements** — Categorized and prioritized (MoSCoW)
- **Product Feature Backlog** — Prioritized features with user stories and acceptance criteria
- **User Personas** — Realistic stakeholder profiles derived from the RFP
- **Interview Questions** — Targeted discovery, validation, and prioritization questions
- **Statement of Work** — Professional SOW with scope, timeline, deliverables, and assumptions
- **Governance Report** — Quality validation with completeness scores and risk flags

## Architecture

```
User uploads RFP (PDF/DOCX)
        │
   Azure Blob Storage
        │
   FastAPI Backend
        │
┌───────────────────────────────┐
│   Multi-Agent Pipeline        │
│                               │
│  1. RFP Parser Agent          │
│  2. Requirements Agent        │
│  3. Feature Planning Agent    │
│  4. Persona & Research Agent  │
│  5. SOW Generation Agent      │
│  6. Governance Agent          │
└───────────────────────────────┘
        │
   Azure OpenAI (GPT-4o)
        │
   Azure Cosmos DB (memory)
        │
   Artifacts Dashboard
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | Custom multi-agent pipeline with Azure OpenAI |
| AI Models | Azure OpenAI Service (GPT-4o) |
| Backend | Python, FastAPI, WebSockets |
| Document Processing | Azure Document Intelligence, PyPDF2 |
| Database | Azure Cosmos DB (serverless) |
| Storage | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Monitoring | Azure Application Insights |
| Infrastructure | Bicep (IaC) |
| CI/CD | GitHub Actions → Azure Container Registry → App Service |
| Containerization | Docker |

## Quick Start

### Prerequisites

- Python 3.12+
- Azure subscription with provisioned services (see Azure Setup)
- Docker (optional, for containerized development)

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-org/rfp-product-engine.git
cd rfp-product-engine

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in Azure credentials
copy .env.example .env
# Edit .env with your Azure keys

# Run the server
uvicorn api.main:app --reload --port 8000
```

### Docker

```bash
docker-compose up --build
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload RFP and start processing |
| GET | `/api/status/{job_id}` | Check processing status |
| GET | `/api/artifacts/{job_id}` | Get generated artifacts |
| WS | `/ws/{job_id}` | Real-time agent progress |
| GET | `/health` | Health check |

### Run Tests

```bash
pytest tests/ -v
```

## Azure Setup

See the [Azure Setup Guidelines](#azure-resource-provisioning) section below or deploy everything at once:

```bash
az deployment group create \
  --resource-group rg-rfp-engine \
  --template-file infra/main.bicep
```

## CI/CD Pipeline

On push to `main`:
1. **Lint** — `ruff check .`
2. **Test** — `pytest tests/`
3. **Build** — Docker image
4. **Push** — Azure Container Registry
5. **Deploy** — Azure App Service

## Project Structure

```
rfp-product-engine/
├── agents/                    # AI agent implementations
│   ├── base_agent.py          # Base agent class
│   ├── parser_agent.py        # RFP document parser
│   ├── requirements_agent.py  # Requirements extractor
│   ├── feature_planning_agent.py  # Feature backlog generator
│   ├── persona_research_agent.py  # Persona & question generator
│   ├── sow_agent.py           # SOW document generator
│   └── governance_agent.py    # Quality validation agent
├── orchestration/
│   └── workflow.py            # Multi-agent pipeline orchestrator
├── services/                  # Azure service integrations
│   ├── ai_service.py          # Azure OpenAI wrapper
│   ├── storage_service.py     # Blob Storage operations
│   ├── db_service.py          # Cosmos DB operations
│   └── document_processor.py  # PDF/DOCX text extraction
├── api/
│   ├── main.py                # FastAPI application
│   ├── models.py              # Pydantic data models
│   ├── ws.py                  # WebSocket handler
│   └── routes/
│       ├── upload.py          # Upload endpoint
│       └── artifacts.py       # Artifacts endpoint
├── infra/
│   └── main.bicep             # Azure IaC template
├── tests/                     # Unit and integration tests
├── .github/workflows/
│   └── deploy.yml             # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── config.py                  # App configuration
```

## Hackathon Prize Alignment

- **Best Enterprise Solution** — Governance, security (Key Vault, encrypted storage), responsible AI validation
- **Best Multi-Agent System** — 6-agent orchestrated pipeline with shared memory and progress tracking
- **Grand Prize AI Applications** — Production-ready architecture with CI/CD, monitoring, and IaC

## License

MIT

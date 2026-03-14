# RFP Product Strategy Engine

> **Autonomous Enterprise Product Strategy Engine** — a multi-agent AI system that transforms complex enterprise RFP (Request for Proposal) documents into actionable product strategy and delivery artifacts.

This repository contains a **FastAPI backend** and a **phased, multi-agent pipeline** built on **Microsoft Semantic Kernel**. The system ingests long-form RFPs (PDF/DOCX/TXT), extracts structure, and generates a complete set of artifacts used by product, engineering, and delivery teams—optionally enriched with **Azure AI Foundry evaluation** and **OpenTelemetry tracing**.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Artifacts Generated](#artifacts-generated)
- [Architecture](#architecture)
  - [High-Level Flow](#high-level-flow)
  - [Phased Agent Pipeline (Updated)](#phased-agent-pipeline-updated)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker](#docker)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Azure Notes (Foundry Tracing/Evaluation)](#azure-notes-foundry-tracingevaluation)
- [API](#api)
  - [Endpoints](#endpoints)
  - [Typical Workflow](#typical-workflow)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Azure Setup](#azure-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [License](#license)

---

## What It Does

Upload a 50+ page enterprise RFP and get back a structured set of product and delivery artifacts, including strategy outputs (problem framing, market context, KPIs, roadmap) and delivery outputs (SOW), all validated by a governance layer.

---

## Artifacts Generated

Core artifacts (original):

- **Structured Requirements** — categorized and prioritized (MoSCoW).
- **Product Feature Backlog** — prioritized features with user stories and acceptance criteria.
- **User Personas** — realistic stakeholder profiles derived from the RFP.
- **Interview Questions** — discovery, validation, and prioritization questions.
- **Statement of Work (SOW)** — professional SOW including scope, deliverables, timeline, assumptions, constraints, acceptance criteria.
- **Governance Report** — completeness/consistency checks, risk flags, and recommendations.
- **Foundry Evaluation** — Azure AI Foundry scoring (relevance, coherence, groundedness) with offline fallback.

New artifacts (added):

- **Problem Statement** — clear articulation of the core problem, desired outcomes, gaps, and constraints.
- **Market Research** — trends, competitive landscape, risk factors, and strategic recommendations (derived from RFP context).
- **Success Metrics / KPIs** — SMART KPIs, OKRs, and measurement framework tied back to requirements.
- **Product Roadmap** — phased roadmap with milestones, dependencies, risks, and KPI-linked measurement points.

---

## Architecture

### High-Level Flow

```text
User uploads RFP (PDF/DOCX/TXT)
        │
   Azure Blob Storage
        │
   FastAPI Backend (async)
        │
 Phased Multi-Agent Pipeline (Semantic Kernel)
        │
 Azure AI Foundry Evaluation + Tracing (optional)
        │
 Azure Cosmos DB (serverless) — artifacts + job metadata
        │
REST + WebSocket APIs — retrieve artifacts & live progress
```

### Phased Agent Pipeline (Updated)

The pipeline is executed in **phases**, with **parallel execution inside phases** where dependencies allow.

**Phase 1 — Ingestion (Sequential)**
1. **RFP Parser Agent** → Extracts structured sections + metadata

**Phase 2 — Foundation (Parallel)**
2. **Problem Statement Agent** → Defines core problem and desired state  
3. **Market Research Agent** → Market/competitor context and strategic insight  
4. **Requirements Agent** → Functional, non-functional, constraints (MoSCoW)

**Phase 3 — Strategy & Metrics (Parallel)**
5. **Feature Planning Agent** → Converts requirements into prioritized backlog  
6. **Success Metrics / KPIs Agent** → KPIs/OKRs tied to problem + requirements  
7. **Persona & Research Agent** → Personas + interview questions informed by problem + market

**Phase 4 — Output Generation (Parallel)**
8. **Product Roadmap Agent** → Phased roadmap based on features + metrics  
9. **SOW Generation Agent** → SOW based on all prior artifacts

**Phase 5 — Validation (Sequential)**
10. **Governance Agent** → Validates completeness, consistency, risk, and alignment across all artifacts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | **Microsoft Semantic Kernel** (`ChatCompletionAgent`) |
| AI Models | Azure OpenAI (GPT-4o) |
| AI Evaluation | **Azure AI Foundry** (relevance, coherence, groundedness scoring) + offline heuristic fallback |
| Tracing | Azure AI Foundry + OpenTelemetry (pipeline spans + agent spans) |
| Backend | Python, FastAPI, WebSockets |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Document Processing | Azure Document Intelligence, PyPDF2, python-docx |
| Database | Azure Cosmos DB (serverless) |
| Storage | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Monitoring | Azure Application Insights |
| Infrastructure | Bicep (IaC) |
| CI/CD | GitHub Actions → Azure Container Registry → App Service |
| Containerization | Docker |

---

## Quick Start

### Prerequisites

- Python **3.12+**
- **Node.js 18+** and **npm** (for the frontend)
- Azure subscription with provisioned services (see [Azure Setup](#azure-setup))
- Docker (optional)

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
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Run the server
uvicorn api.main:app --reload --port 8000
```

#### Frontend

See [`frontend/README.md`](frontend/README.md) for the full details. Quick start:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at **http://localhost:8080** and connects to the backend at `http://localhost:8000` by default. Set `VITE_API_URL` in `frontend/.env` to override the backend URL.

### Docker

```bash
docker-compose up --build
```

---

## Configuration

### Environment Variables

The app is configured using `config.py` (Pydantic settings) and environment variables loaded from `.env`.

At minimum for full functionality you typically need:

- **Azure OpenAI**: endpoint, key, deployment, API version
- **Blob Storage**: connection string
- **Cosmos DB**: endpoint, key, database name

Optional:
- **Azure AI Foundry project connection string** (enables Foundry evaluation + tracing export)

> Tip: If Foundry is not configured, evaluation and tracing fall back gracefully (offline evaluation + local logging).

### Azure Notes (Foundry Tracing/Evaluation)

- Tracing uses Azure Monitor exporter when configured correctly.
- If your Foundry/Insights connection string is invalid, the app will log a **non-fatal warning** and continue.

---

## API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload RFP and start processing |
| GET | `/api/status/{job_id}` | Check processing status |
| GET | `/api/artifacts/{job_id}` | Get generated artifacts |
| GET | `/api/evaluation/{job_id}` | Get Foundry evaluation report |
| POST | `/api/evaluation/{job_id}/rerun` | Re-run Foundry evaluation |
| WS | `/ws/{job_id}` | Real-time agent progress |
| GET | `/health` | Health check |

### Typical Workflow

1. Upload an RFP (`/api/upload`) → receive a `job_id`
2. Subscribe to progress (`/ws/{job_id}`) or poll status (`/api/status/{job_id}`)
3. Retrieve artifacts (`/api/artifacts/{job_id}`)
4. Retrieve evaluation (`/api/evaluation/{job_id}`)

---

## Testing

Run the full test suite:

```bash
pytest tests/ -v
```

Useful subsets:

```bash
pytest tests/test_agents.py -v
pytest tests/test_api.py -v
pytest tests/test_foundry.py -v
```

Lint:

```bash
ruff check .
```

---

## Project Structure

```text
rfp-product-engine/
├── agents/                          # Multi-agent implementations (10 agents)
│   ├── base_agent.py                # Base agent wrapper (Semantic Kernel)
│   ├── parser_agent.py              # Phase 1
│   ├── problem_statement_agent.py   # Phase 2 (NEW)
│   ├── market_research_agent.py     # Phase 2 (NEW)
│   ├── requirements_agent.py        # Phase 2
│   ├── feature_planning_agent.py    # Phase 3
│   ├── kpi_agent.py                 # Phase 3 (NEW)
│   ├── persona_research_agent.py    # Phase 3
│   ├── roadmap_agent.py             # Phase 4 (NEW)
│   ├── sow_agent.py                 # Phase 4
│   └── governance_agent.py          # Phase 5
├── orchestration/
│   └── workflow.py                  # Phased pipeline orchestration (parallel inside phases)
├── services/
│   ├── ai_service.py                # Semantic Kernel factory (Azure OpenAI)
│   ├── db_service.py                # Cosmos DB operations
│   ├── storage_service.py           # Blob storage operations
│   ├── document_processor.py        # PDF/DOCX/TXT extraction
│   ├── foundry_evaluation.py        # Foundry evaluation + offline fallback
│   └── foundry_tracing.py           # OpenTelemetry tracing
├── api/
│   ├── main.py                      # FastAPI app + lifespan
│   ├── models.py                    # Pydantic models (includes new artifacts)
│   ├── ws.py                        # WebSocket progress updates
│   └── routes/
│       ├── upload.py
│       ├── artifacts.py
│       └── evaluation.py
├── frontend/                        # React SPA (see frontend/README.md)
│   ├── src/
│   │   ├── components/              # UI components (shadcn/ui)
│   │   ├── hooks/                   # React hooks (API, WebSocket)
│   │   ├── lib/                     # API client, types, utilities
│   │   └── pages/                   # Route pages
│   ├── .env.example                 # Frontend environment template
│   ├── package.json
│   └── vite.config.ts
├── infra/
│   └── main.bicep                   # Azure IaC template
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── config.py                        # App configuration (Pydantic settings)
```

---

## Azure Setup

Deploy all Azure resources (example):

```bash
az deployment group create \
  --resource-group rg-rfp-engine \
  --template-file infra/main.bicep
```

---

## CI/CD Pipeline

On push to `main`:

1. **Lint** — `ruff check .`
2. **Test** — `pytest tests/`
3. **Build** — Docker image
4. **Push** — Azure Container Registry
5. **Deploy** — Azure App Service

---

## License

MIT
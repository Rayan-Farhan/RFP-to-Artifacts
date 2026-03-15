import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes.upload import router as upload_router
from api.routes.artifacts import router as artifacts_router
from api.routes.evaluation import router as evaluation_router
from api.routes.download import router as download_router
from api.ws import websocket_endpoint
from services.foundry_tracing import init_tracing

settings = get_settings()
allowed_origins = [
    origin.strip()
    for origin in settings.cors_allowed_origins.split(",")
    if origin.strip()
]

logging.basicConfig(
    level=getattr(logging, settings.log_level, logging.INFO),
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.getLogger(__name__).info("RFP Product Engine starting (env=%s)", settings.app_env)
    init_tracing()
    yield
    logging.getLogger(__name__).info("RFP Product Engine shutting down")


app = FastAPI(
    title="RFP Product Strategy Engine",
    description="Multi-agent AI system that transforms enterprise RFPs into actionable product management artifacts",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(artifacts_router, prefix="/api", tags=["Artifacts"])
app.include_router(evaluation_router, prefix="/api", tags=["Evaluation"])
app.include_router(download_router, prefix="/api", tags=["Download"])

# WebSocket route
app.websocket("/ws/{job_id}")(websocket_endpoint)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "rfp-product-engine"}
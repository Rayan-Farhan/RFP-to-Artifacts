import logging
from azure.cosmos import CosmosClient, PartitionKey
from config import get_settings

logger = logging.getLogger(__name__)

_client: CosmosClient | None = None
_database = None


def _get_database():
    global _client, _database
    if _database is None:
        settings = get_settings()
        _client = CosmosClient(settings.cosmos_db_endpoint, settings.cosmos_db_key)
        _database = _client.get_database_client(settings.cosmos_db_database)
    return _database


def _get_container(name: str):
    db = _get_database()
    return db.get_container_client(name)


async def save_job(job: dict) -> None:
    """Save or update a job record."""
    container = _get_container("jobs")
    job["id"] = job["job_id"]
    container.upsert_item(job)
    logger.info("Saved job: %s", job["job_id"])


async def get_job(job_id: str) -> dict | None:
    """Get a job by ID."""
    container = _get_container("jobs")
    try:
        return container.read_item(item=job_id, partition_key=job_id)
    except Exception:
        return None


async def save_artifacts(job_id: str, artifacts: dict) -> None:
    """Save generated artifacts for a job."""
    container = _get_container("artifacts")
    artifacts["id"] = job_id
    artifacts["job_id"] = job_id
    container.upsert_item(artifacts)
    logger.info("Saved artifacts for job: %s", job_id)


async def get_artifacts(job_id: str) -> dict | None:
    """Get artifacts for a job."""
    container = _get_container("artifacts")
    try:
        return container.read_item(item=job_id, partition_key=job_id)
    except Exception:
        return None


async def save_agent_memory(job_id: str, agent_name: str, data: dict) -> None:
    """Save agent intermediate state/memory."""
    container = _get_container("agent_memory")
    record = {
        "id": f"{job_id}_{agent_name}",
        "job_id": job_id,
        "agent_name": agent_name,
        **data,
    }
    container.upsert_item(record)
    logger.info("Saved memory for agent %s (job=%s)", agent_name, job_id)


async def get_agent_memory(job_id: str, agent_name: str) -> dict | None:
    """Retrieve agent memory for a specific job."""
    container = _get_container("agent_memory")
    try:
        return container.read_item(
            item=f"{job_id}_{agent_name}",
            partition_key=job_id,
        )
    except Exception:
        return None
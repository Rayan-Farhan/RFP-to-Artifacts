import logging

from fastapi import APIRouter

from services import cancel_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: str):
    """Request cancellation of a running pipeline job."""
    cancel_service.request_cancel(job_id)
    logger.info("Cancellation requested for job %s", job_id)
    return {"job_id": job_id, "message": "Cancellation requested"}

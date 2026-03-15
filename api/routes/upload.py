import uuid
import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException

from api.models import JobStatus
from services.document_processor import extract_text
from services.storage_service import upload_rfp
from services.db_service import save_job
from orchestration.workflow import Workflow
from api.ws import broadcast_agent_progress

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Track active pipeline tasks for cancellation
_active_tasks: dict[str, asyncio.Task] = {}


@router.post("/upload")
async def upload_and_process(
    file: UploadFile = File(...),
):
    """Upload an RFP document and start the multi-agent processing pipeline."""
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    # Generate job ID
    job_id = str(uuid.uuid4())
    safe_filename = f"{job_id}_{file.filename}"

    # Upload to Blob Storage
    try:
        await upload_rfp(safe_filename, file_bytes, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.warning("Blob upload failed (continuing with local processing): %s", e)

    # Extract text
    raw_text = await extract_text(file.filename, file_bytes)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    # Create job record
    job = {
        "job_id": job_id,
        "filename": file.filename,
        "status": JobStatus.PENDING.value,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "text_length": len(raw_text),
    }

    try:
        await save_job(job)
    except Exception as e:
        logger.warning("Cosmos DB save failed (continuing): %s", e)

    # Start processing as an asyncio task (trackable for cancellation)
    task = asyncio.create_task(_run_pipeline(job_id, raw_text))
    _active_tasks[job_id] = task
    task.add_done_callback(lambda _: _active_tasks.pop(job_id, None))

    return {
        "job_id": job_id,
        "filename": file.filename,
        "status": "processing",
        "text_length": len(raw_text),
        "message": "RFP uploaded. Processing started.",
    }


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running RFP processing pipeline."""
    task = _active_tasks.get(job_id)
    if task is None:
        raise HTTPException(status_code=404, detail="No active pipeline found for this job.")
    if task.done():
        raise HTTPException(status_code=400, detail="Pipeline has already finished.")

    task.cancel()

    # Update job status to failed with cancellation message
    try:
        await save_job({
            "job_id": job_id,
            "status": JobStatus.FAILED.value,
            "error": "Pipeline cancelled by user.",
            "updated_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        logger.warning("Failed to update cancelled job %s: %s", job_id, e)

    return {"job_id": job_id, "status": "cancelled", "message": "Pipeline cancelled."}


async def _run_pipeline(job_id: str, raw_text: str):
    """Background task that runs the agent pipeline."""
    try:
        workflow = Workflow(
            job_id=job_id,
            on_progress=broadcast_agent_progress,
        )
        await workflow.run(raw_text)
    except asyncio.CancelledError:
        logger.info("Pipeline cancelled for job %s", job_id)
        raise
    except Exception as e:
        logger.error("Pipeline failed for job %s: %s", job_id, e, exc_info=True)

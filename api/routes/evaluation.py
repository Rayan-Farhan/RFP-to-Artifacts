from fastapi import APIRouter, HTTPException
from services.db_service import get_job, get_artifacts
from services.foundry_evaluation import evaluate_artifacts

router = APIRouter()


@router.get("/evaluation/{job_id}")
async def get_evaluation(job_id: str):
    """Get the Azure AI Foundry evaluation report for a completed job."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed (status: {job.get('status')})",
        )

    artifacts = await get_artifacts(job_id)
    if not artifacts:
        raise HTTPException(status_code=404, detail="Artifacts not found")

    # Return cached evaluation if it exists
    cached = artifacts.get("foundry_evaluation")
    if cached:
        return {"job_id": job_id, "evaluation": cached}

    # Otherwise, run evaluation now
    evaluation = await evaluate_artifacts(job_id, artifacts)
    return {"job_id": job_id, "evaluation": evaluation}


@router.post("/evaluation/{job_id}/rerun")
async def rerun_evaluation(job_id: str):
    """Re-run Foundry evaluation on existing artifacts (useful after config changes)."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed (status: {job.get('status')})",
        )

    artifacts = await get_artifacts(job_id)
    if not artifacts:
        raise HTTPException(status_code=404, detail="Artifacts not found")

    evaluation = await evaluate_artifacts(job_id, artifacts)
    return {"job_id": job_id, "evaluation": evaluation, "rerun": True}

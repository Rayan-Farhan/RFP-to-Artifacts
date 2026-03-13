from fastapi import APIRouter, HTTPException
from services.db_service import get_job, get_artifacts

router = APIRouter()


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get the current processing status of an RFP job."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.get("job_id"),
        "filename": job.get("filename"),
        "status": job.get("status"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
        "agent_logs": job.get("agent_logs", []),
        "error": job.get("error"),
    }


@router.get("/artifacts/{job_id}")
async def get_job_artifacts(job_id: str):
    """Get all generated artifacts for a completed RFP job."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") == "processing":
        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Agents are still processing. Check back shortly.",
        }

    if job.get("status") == "failed":
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {job.get('error', 'Unknown error')}",
        )

    artifacts = await get_artifacts(job_id)
    if not artifacts:
        raise HTTPException(status_code=404, detail="Artifacts not found")

    return {
        "job_id": job_id,
        "status": "completed",
        "artifacts": {
            "parsed_rfp": artifacts.get("parsed_rfp"),
            "problem_statement": artifacts.get("problem_statement"),
            "market_research": artifacts.get("market_research"),
            "requirements": artifacts.get("requirements", []),
            "features": artifacts.get("features", []),
            "success_metrics": artifacts.get("success_metrics"),
            "roadmap": artifacts.get("roadmap"),
            "personas": artifacts.get("personas", []),
            "interview_questions": artifacts.get("interview_questions", []),
            "sow": artifacts.get("sow"),
            "governance_report": artifacts.get("governance_report"),
            "foundry_evaluation": artifacts.get("foundry_evaluation"),
        },
        "download_urls": artifacts.get("download_urls", {}),
    }

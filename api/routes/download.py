"""Download route — streams generated artifact files from Blob Storage."""
from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.db_service import get_artifacts
from services.storage_service import download_artifact_file

router = APIRouter()

# Maps the artifact_type URL parameter to the blob filename and MIME type
_ARTIFACT_MAP: dict[str, tuple[str, str]] = {
    "market_research": (
        "market_research.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "requirements": (
        "requirements.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "feature_backlog": (
        "feature_backlog.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "roadmap": (
        "roadmap.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "kpis": (
        "kpis.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "sow": (
        "sow.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    "problem_statement": (
        "problem_statement.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    "personas": (
        "personas.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    "governance_report": (
        "governance_report.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
}


@router.get("/download/{job_id}/{artifact_type}")
async def download_artifact(job_id: str, artifact_type: str):
    """
    Stream a generated artifact file (Excel or Word) for a completed job.

    artifact_type must be one of:
      market_research, requirements, feature_backlog, roadmap, kpis,
      sow, problem_statement, personas, governance_report
    """
    if artifact_type not in _ARTIFACT_MAP:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown artifact type '{artifact_type}'. "
                f"Valid types: {', '.join(_ARTIFACT_MAP)}"
            ),
        )

    artifacts = await get_artifacts(job_id)
    if not artifacts:
        raise HTTPException(status_code=404, detail="Job artifacts not found")

    download_urls = artifacts.get("download_urls", {})
    if artifact_type not in download_urls:
        raise HTTPException(
            status_code=404,
            detail=f"File for '{artifact_type}' has not been generated yet.",
        )

    filename, media_type = _ARTIFACT_MAP[artifact_type]

    try:
        data = await download_artifact_file(job_id, filename)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve file from storage: {exc}",
        )

    return StreamingResponse(
        BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

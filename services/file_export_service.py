"""
File export service — converts JSON artifacts to styled Excel/Word files
and uploads them to Azure Blob Storage.

Called once after the agent pipeline completes. Each formatter is
isolated: a failure in one export does not abort the others.
"""
import logging
from typing import Any

from formatters.excel.market_research import build_market_research_excel
from formatters.excel.requirements import build_requirements_excel
from formatters.excel.feature_planning import build_feature_planning_excel
from formatters.excel.roadmap import build_roadmap_excel
from formatters.excel.kpi import build_kpi_excel
from formatters.word.sow import build_sow_docx
from formatters.word.problem_statement import build_problem_statement_docx
from formatters.word.persona_research import build_personas_docx
from formatters.word.governance import build_governance_docx
from services.storage_service import upload_artifact

logger = logging.getLogger(__name__)

_EXCEL_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_WORD_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Each entry: (artifact_key, filename, content_type, builder_callable)
# builder_callable receives the full artifacts dict so it can pull whatever it needs.
_EXPORT_SPECS: list[tuple[str, str, str, Any]] = [
    (
        "market_research",
        "market_research.xlsx",
        _EXCEL_CT,
        lambda a: build_market_research_excel(a.get("market_research") or {}),
    ),
    (
        "requirements",
        "requirements.xlsx",
        _EXCEL_CT,
        lambda a: build_requirements_excel(a.get("requirements") or []),
    ),
    (
        "feature_backlog",
        "feature_backlog.xlsx",
        _EXCEL_CT,
        lambda a: build_feature_planning_excel(a.get("features") or []),
    ),
    (
        "roadmap",
        "roadmap.xlsx",
        _EXCEL_CT,
        lambda a: build_roadmap_excel(a.get("roadmap") or {}),
    ),
    (
        "kpis",
        "kpis.xlsx",
        _EXCEL_CT,
        lambda a: build_kpi_excel(a.get("success_metrics") or {}),
    ),
    (
        "sow",
        "sow.docx",
        _WORD_CT,
        lambda a: build_sow_docx(a.get("sow") or {}),
    ),
    (
        "problem_statement",
        "problem_statement.docx",
        _WORD_CT,
        lambda a: build_problem_statement_docx(a.get("problem_statement") or {}),
    ),
    (
        "personas",
        "personas.docx",
        _WORD_CT,
        lambda a: build_personas_docx(
            a.get("personas") or [],
            a.get("interview_questions") or [],
        ),
    ),
    (
        "governance_report",
        "governance_report.docx",
        _WORD_CT,
        lambda a: build_governance_docx(a.get("governance_report") or {}),
    ),
]


async def export_all(job_id: str, artifacts: dict[str, Any]) -> dict[str, str]:
    """
    Generate all formatted output files and upload to Blob Storage.

    Returns a dict mapping artifact_key → blob URL.
    Failures are logged as warnings and skipped — all other exports continue.
    """
    urls: dict[str, str] = {}

    for key, filename, content_type, builder in _EXPORT_SPECS:
        try:
            data: bytes = builder(artifacts)
            url: str = await upload_artifact(job_id, filename, data, content_type)
            urls[key] = url
            logger.info("[FileExport] Uploaded %s for job %s", filename, job_id)
        except Exception as exc:
            logger.warning(
                "[FileExport] Skipped %s for job %s: %s",
                filename,
                job_id,
                exc,
                exc_info=True,
            )

    logger.info(
        "[FileExport] Completed for job %s — %d/%d files uploaded",
        job_id,
        len(urls),
        len(_EXPORT_SPECS),
    )
    return urls

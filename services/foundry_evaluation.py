"""
Azure AI Foundry – Evaluation Service

Uses azure-ai-evaluation to score generated artifacts for quality,
relevance, coherence, and groundedness after the agent pipeline completes.
Results are stored alongside artifacts so judges (and the Governance Agent)
can reference objective quality metrics.

When a properly configured AI Foundry project endpoint is available,
uses Foundry evaluators. Otherwise falls back to offline heuristic scoring.
"""

import json
import logging
from typing import Any

from config import get_settings

logger = logging.getLogger(__name__)


async def evaluate_artifacts(job_id: str, artifacts: dict[str, Any]) -> dict[str, Any]:
    """
    Run evaluations on the generated artifacts.

    Attempts Azure AI Foundry evaluators first (requires a valid
    AI Foundry project endpoint). Falls back to offline heuristic
    evaluation if Foundry is unavailable.

    Returns a structured evaluation report.
    """
    settings = get_settings()

    # The connection string must be a proper AI Foundry project endpoint,
    # not an Application Insights connection string
    conn_str = settings.azure_ai_project_connection_string
    if not conn_str or conn_str.startswith("InstrumentationKey="):
        logger.info("AI Foundry evaluation not configured — using offline evaluation")
        return _offline_evaluation(artifacts)

    try:
        from azure.ai.evaluation import (
            RelevanceEvaluator,
            CoherenceEvaluator,
            GroundednessEvaluator,
        )

        # Build model config for evaluators using Azure OpenAI directly
        model_config = {
            "azure_endpoint": settings.azure_openai_endpoint,
            "api_key": settings.azure_openai_api_key,
            "azure_deployment": settings.azure_openai_deployment,
            "api_version": settings.azure_openai_api_version,
        }

        results = {}

        # --- Evaluate SOW quality ---
        sow = artifacts.get("sow", {})
        rfp_sections = artifacts.get("parsed_rfp", {}).get("sections", {})
        source_text = "\n".join(v for v in rfp_sections.values() if v)

        if sow and source_text:
            sow_text = json.dumps(sow, indent=2) if isinstance(sow, dict) else str(sow)

            relevance = RelevanceEvaluator(model_config=model_config)
            coherence = CoherenceEvaluator(model_config=model_config)
            groundedness = GroundednessEvaluator(model_config=model_config)

            relevance_result = relevance(
                query="Generate a Statement of Work from this RFP",
                response=sow_text,
            )
            coherence_result = coherence(
                query="Generate a Statement of Work from this RFP",
                response=sow_text,
            )
            groundedness_result = groundedness(
                query="Generate a Statement of Work from this RFP",
                response=sow_text,
                context=source_text[:8000],
            )

            results["sow_evaluation"] = {
                "relevance": relevance_result,
                "coherence": coherence_result,
                "groundedness": groundedness_result,
            }

        # --- Evaluate requirements quality ---
        requirements = artifacts.get("requirements", [])
        if requirements and source_text:
            req_text = json.dumps(requirements, indent=2)

            relevance = RelevanceEvaluator(model_config=model_config)
            rel_result = relevance(
                query="Extract all requirements from this RFP",
                response=req_text,
            )
            results["requirements_evaluation"] = {
                "relevance": rel_result,
                "count": len(requirements),
            }

        # --- Overall summary ---
        results["evaluation_source"] = "azure_ai_foundry"
        results["job_id"] = job_id
        results["summary"] = _summarize_scores(results)

        logger.info("Foundry evaluation complete for job %s: %s", job_id, results["summary"])
        return results

    except Exception as e:
        logger.error("Foundry evaluation failed, falling back to offline: %s", e, exc_info=True)
        return _offline_evaluation(artifacts)


def _offline_evaluation(artifacts: dict[str, Any]) -> dict[str, Any]:
    """
    Simple heuristic-based evaluation when Foundry is unavailable.
    Checks artifact completeness and basic quality signals.
    """
    results = {"evaluation_source": "offline_heuristic"}
    checks = []

    # Requirements completeness
    reqs = artifacts.get("requirements", [])
    req_score = min(10.0, len(reqs) * 1.5)
    checks.append({
        "metric": "requirements_count",
        "value": len(reqs),
        "score": round(req_score, 1),
        "max_score": 10.0,
    })

    # Features completeness
    feats = artifacts.get("features", [])
    feat_score = min(10.0, len(feats) * 2.0)
    checks.append({
        "metric": "features_count",
        "value": len(feats),
        "score": round(feat_score, 1),
        "max_score": 10.0,
    })

    # Personas
    personas = artifacts.get("personas", [])
    persona_score = min(10.0, len(personas) * 3.0)
    checks.append({
        "metric": "personas_count",
        "value": len(personas),
        "score": round(persona_score, 1),
        "max_score": 10.0,
    })

    # SOW completeness
    sow = artifacts.get("sow", {})
    sow_fields = ["project_title", "executive_summary", "scope", "deliverables",
                   "timeline", "assumptions", "constraints", "acceptance_criteria"]
    filled = sum(1 for f in sow_fields if sow.get(f))
    sow_score = (filled / len(sow_fields)) * 10
    checks.append({
        "metric": "sow_completeness",
        "value": f"{filled}/{len(sow_fields)} sections",
        "score": round(sow_score, 1),
        "max_score": 10.0,
    })

    # Interview questions
    questions = artifacts.get("interview_questions", [])
    q_score = min(10.0, len(questions) * 1.0)
    checks.append({
        "metric": "interview_questions_count",
        "value": len(questions),
        "score": round(q_score, 1),
        "max_score": 10.0,
    })

    total = sum(c["score"] for c in checks)
    max_total = sum(c["max_score"] for c in checks)
    overall = round((total / max_total) * 10, 1) if max_total > 0 else 0

    results["checks"] = checks
    results["overall_score"] = overall
    results["summary"] = f"Offline evaluation: {overall}/10.0 ({len(checks)} checks)"

    return results


def _build_eval_dataset(artifacts: dict[str, Any]) -> list[dict]:
    """Build evaluation dataset rows from artifacts."""
    rows = []
    sow = artifacts.get("sow", {})
    if sow:
        rows.append({
            "query": "Generate a professional Statement of Work from this RFP",
            "response": json.dumps(sow) if isinstance(sow, dict) else str(sow),
            "context": json.dumps(artifacts.get("parsed_rfp", {}).get("sections", {})),
        })
    return rows


def _summarize_scores(results: dict) -> str:
    """Build a human-readable summary from evaluation results."""
    parts = []
    sow_eval = results.get("sow_evaluation", {})
    if sow_eval:
        parts.append(f"SOW relevance={sow_eval.get('relevance', 'N/A')}")
        parts.append(f"coherence={sow_eval.get('coherence', 'N/A')}")
        parts.append(f"groundedness={sow_eval.get('groundedness', 'N/A')}")

    req_eval = results.get("requirements_evaluation", {})
    if req_eval:
        parts.append(f"Requirements relevance={req_eval.get('relevance', 'N/A')} (n={req_eval.get('count', 0)})")

    return "; ".join(parts) if parts else "No evaluations completed"

"""
Azure AI Foundry – Tracing Service

Instruments the agent pipeline with OpenTelemetry tracing.
Exports traces to Azure Application Insights when configured,
so every agent invocation is visible in the Azure portal.
"""

import logging
from contextlib import contextmanager
from typing import Generator

from config import get_settings

logger = logging.getLogger(__name__)

_tracer = None
_tracing_enabled = False


def init_tracing() -> None:
    """
    Initialize OpenTelemetry tracing with Azure Monitor exporter.
    Call once at application startup. If the connection string is not set,
    tracing falls back to local logging only.
    """
    global _tracer, _tracing_enabled
    settings = get_settings()

    conn_str = settings.azure_ai_project_connection_string
    if not conn_str:
        logger.info("Tracing: connection string not set — using local logging only")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor

        # Try Azure Monitor exporter (works with Application Insights connection string)
        try:
            from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
            exporter = AzureMonitorTraceExporter(connection_string=conn_str)
            provider = TracerProvider()
            provider.add_span_processor(SimpleSpanProcessor(exporter))
            trace.set_tracer_provider(provider)
            logger.info("Azure Monitor tracing enabled (Application Insights)")
        except ImportError:
            logger.info("azure-monitor-opentelemetry-exporter not installed — using default provider")
        except Exception as e:
            logger.warning("Azure Monitor exporter setup failed (non-fatal): %s", e)

        _tracer = trace.get_tracer("rfp-product-engine")
        _tracing_enabled = True
        logger.info("OpenTelemetry tracing initialized")

    except Exception as e:
        logger.warning("Tracing initialization failed (non-fatal): %s", e)
        _tracing_enabled = False


@contextmanager
def trace_agent(agent_name: str, job_id: str) -> Generator[dict, None, None]:
    """
    Context manager that creates a traced span for an agent execution.

    Usage:
        with trace_agent("Parser Agent", job_id) as span_data:
            result = await agent.run(context)
            span_data["tokens"] = 1234  # optional attributes

    The span appears in Azure AI Foundry's tracing dashboard.
    """
    attributes: dict = {}

    if _tracing_enabled and _tracer is not None:
        with _tracer.start_as_current_span(
            name=f"agent.{agent_name}",
            attributes={
                "agent.name": agent_name,
                "job.id": job_id,
                "agent.framework": "semantic_kernel",
            },
        ) as span:
            try:
                yield attributes
                # Set any extra attributes the caller added
                for key, value in attributes.items():
                    span.set_attribute(f"agent.{key}", str(value))
                span.set_status(trace_status_ok())
            except Exception as e:
                span.set_status(trace_status_error(str(e)))
                span.record_exception(e)
                raise
    else:
        # No-op fallback — just yield so the calling code still works
        logger.debug("Tracing span (local): agent=%s job=%s", agent_name, job_id)
        yield attributes


@contextmanager
def trace_pipeline(job_id: str) -> Generator[None, None, None]:
    """
    Context manager that wraps the entire pipeline run in a parent span.
    """
    if _tracing_enabled and _tracer is not None:
        with _tracer.start_as_current_span(
            name="rfp_pipeline",
            attributes={
                "job.id": job_id,
                "pipeline.agent_count": "6",
            },
        ):
            yield
    else:
        yield


def trace_status_ok():
    """Return OK status for OpenTelemetry span."""
    try:
        from opentelemetry.trace import StatusCode, Status
        return Status(StatusCode.OK)
    except ImportError:
        return None


def trace_status_error(description: str = ""):
    """Return ERROR status for OpenTelemetry span."""
    try:
        from opentelemetry.trace import StatusCode, Status
        return Status(StatusCode.ERROR, description)
    except ImportError:
        return None
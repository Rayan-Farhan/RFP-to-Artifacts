"""In-memory cancellation flag store for pipeline jobs.

Note: This module is used only from async FastAPI request handlers running on a
single asyncio event loop, so plain dict access is safe without a lock.
"""

_cancel_flags: dict[str, bool] = {}


def request_cancel(job_id: str) -> None:
    """Signal that a job should be cancelled."""
    _cancel_flags[job_id] = True


def is_cancelled(job_id: str) -> bool:
    """Check whether a cancel has been requested for a job."""
    return _cancel_flags.get(job_id, False)


def clear(job_id: str) -> None:
    """Remove the cancel flag after it has been handled."""
    _cancel_flags.pop(job_id, None)

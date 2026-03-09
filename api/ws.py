import json
import logging
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

# Active WebSocket connections keyed by job_id
_connections: dict[str, list[WebSocket]] = {}


async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time agent progress updates."""
    await websocket.accept()

    if job_id not in _connections:
        _connections[job_id] = []
    _connections[job_id].append(websocket)

    logger.info("WebSocket connected for job %s", job_id)

    try:
        # Keep connection alive until client disconnects
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        _connections[job_id].remove(websocket)
        if not _connections[job_id]:
            del _connections[job_id]
        logger.info("WebSocket disconnected for job %s", job_id)


async def broadcast_agent_progress(job_id: str, agent_log) -> None:
    """Broadcast agent progress to all WebSocket listeners for a job."""
    if job_id not in _connections:
        return

    message = json.dumps(agent_log.model_dump(mode="json"), default=str)

    disconnected = []
    for ws in _connections[job_id]:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)

    for ws in disconnected:
        _connections[job_id].remove(ws)

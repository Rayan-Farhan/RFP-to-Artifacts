import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from api.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_upload_no_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/upload")
    assert response.status_code == 422  # Missing file


@pytest.mark.asyncio
async def test_upload_invalid_extension():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/upload",
            files={"file": ("test.exe", b"fake content", "application/octet-stream")},
        )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
@patch("api.routes.upload.upload_rfp", new_callable=AsyncMock, return_value="https://blob.url")
@patch("api.routes.upload.save_job", new_callable=AsyncMock)
@patch("api.routes.upload.extract_text", new_callable=AsyncMock, return_value="Sample RFP text")
async def test_upload_success(mock_extract, mock_save, mock_upload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/upload",
            files={"file": ("test.pdf", b"fake pdf content", "application/pdf")},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"
    assert "job_id" in data


@pytest.mark.asyncio
@patch("api.routes.artifacts.get_job", new_callable=AsyncMock, return_value=None)
async def test_status_not_found(mock_get):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/status/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
@patch("api.routes.evaluation.get_job", new_callable=AsyncMock, return_value=None)
async def test_evaluation_not_found(mock_get):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/evaluation/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
@patch("api.routes.evaluation.get_artifacts", new_callable=AsyncMock, return_value={
    "requirements": [{"id": "REQ-1"}],
    "foundry_evaluation": {"evaluation_source": "offline_heuristic", "overall_score": 5.0},
})
@patch("api.routes.evaluation.get_job", new_callable=AsyncMock, return_value={
    "job_id": "eval-test", "status": "completed",
})
async def test_evaluation_cached(mock_job, mock_artifacts):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/evaluation/eval-test")
    assert response.status_code == 200
    data = response.json()
    assert data["evaluation"]["evaluation_source"] == "offline_heuristic"

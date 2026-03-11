"""Shared test fixtures and configuration."""

import pytest
from unittest.mock import MagicMock


@pytest.fixture(autouse=True)
def _mock_settings(monkeypatch):
    """Provide a mock Settings instance for all tests so config.py never reads real env."""
    mock_settings = MagicMock()
    mock_settings.app_env = "test"
    mock_settings.log_level = "DEBUG"
    mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
    mock_settings.azure_openai_api_key = "test-key"
    mock_settings.azure_openai_deployment = "gpt-4o"
    mock_settings.azure_openai_api_version = "2024-02-15-preview"
    mock_settings.cosmos_db_endpoint = "https://test.documents.azure.com/"
    mock_settings.cosmos_db_key = "test-cosmos-key"
    mock_settings.cosmos_db_database = "test-db"
    mock_settings.blob_storage_connection_string = "DefaultEndpointsProtocol=https;AccountName=test"
    mock_settings.blob_rfp_container = "rfp-uploads"
    mock_settings.blob_artifacts_container = "generated-artifacts"
    mock_settings.azure_ai_project_connection_string = ""
    mock_settings.max_text_chars = 100_000
    mock_settings.agent_max_retries = 3
    mock_settings.agent_retry_base_delay = 0.01  # Fast retries in tests
    monkeypatch.setattr("config.get_settings", lambda: mock_settings)

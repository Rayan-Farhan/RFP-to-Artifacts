"""
Application configuration using pydantic-settings.

Loads settings from environment variables (or a .env file).
All Azure service credentials and application settings are centralized here.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Application ──
    app_env: str = "development"
    log_level: str = "INFO"

    # ── Azure OpenAI ──
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-02-15-preview"

    # ── Azure Cosmos DB ──
    cosmos_db_endpoint: str = ""
    cosmos_db_key: str = ""
    cosmos_db_database: str = "rfp-engine"

    # ── Azure Blob Storage ──
    blob_storage_connection_string: str = ""
    blob_rfp_container: str = "rfp-uploads"
    blob_artifacts_container: str = "generated-artifacts"

    # ── Azure AI Foundry / Application Insights ──
    azure_ai_project_connection_string: str = ""

    # ── Agent Pipeline ──
    max_text_chars: int = 100_000
    agent_max_retries: int = 3
    agent_retry_base_delay: float = 1.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton of application settings."""
    return Settings()

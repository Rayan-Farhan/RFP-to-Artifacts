import logging
from azure.storage.blob import BlobServiceClient, ContentSettings
from config import get_settings

logger = logging.getLogger(__name__)

RFP_CONTAINER = "rfp-uploads"
ARTIFACTS_CONTAINER = "generated-artifacts"


def get_blob_service_client() -> BlobServiceClient:
    settings = get_settings()
    return BlobServiceClient.from_connection_string(settings.blob_storage_connection_string)


async def upload_rfp(filename: str, data: bytes, content_type: str) -> str:
    """Upload an RFP file to Azure Blob Storage. Returns the blob URL."""
    client = get_blob_service_client()
    container = client.get_container_client(RFP_CONTAINER)

    blob = container.get_blob_client(filename)
    blob.upload_blob(
        data,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    logger.info("Uploaded RFP: %s", filename)
    return blob.url


async def upload_artifact(job_id: str, filename: str, data: bytes, content_type: str = "application/json") -> str:
    """Upload a generated artifact to Blob Storage."""
    client = get_blob_service_client()
    container = client.get_container_client(ARTIFACTS_CONTAINER)

    blob_name = f"{job_id}/{filename}"
    blob = container.get_blob_client(blob_name)
    blob.upload_blob(
        data,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    logger.info("Uploaded artifact: %s", blob_name)
    return blob.url


async def download_rfp(filename: str) -> bytes:
    """Download an RFP file from Blob Storage."""
    client = get_blob_service_client()
    container = client.get_container_client(RFP_CONTAINER)
    blob = container.get_blob_client(filename)
    return blob.download_blob().readall()

import logging
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from config import get_settings

logger = logging.getLogger(__name__)

def create_kernel() -> Kernel:
    """Create a Semantic Kernel instance configured with Azure OpenAI."""
    settings = get_settings()
    kernel = Kernel()
    kernel.add_service(
        AzureChatCompletion(
            deployment_name=settings.azure_openai_deployment,
            endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
    )
    logger.info(
        "Semantic Kernel created (deployment=%s, endpoint=%s)",
        settings.azure_openai_deployment,
        settings.azure_openai_endpoint,
    )
    return kernel

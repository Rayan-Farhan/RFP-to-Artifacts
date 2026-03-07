import json
import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from semantic_kernel import Kernel
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.contents import ChatHistory, ChatMessageContent, AuthorRole

from api.models import AgentLog, AgentStatus
from services.ai_service import create_kernel, SERVICE_ID
from services.db_service import save_agent_memory

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all agents in the RFP processing pipeline.
    Built on Microsoft Semantic Kernel ChatCompletionAgent.
    """

    name: str = "BaseAgent"
    description: str = ""
    instructions: str = ""

    def __init__(self, job_id: str, kernel: Kernel | None = None):
        self.job_id = job_id
        self.start_time: float | None = None
        self.tokens_used: int = 0

        # Each agent gets its own Semantic Kernel instance (or shares one)
        self._kernel = kernel or create_kernel()

        # Create the SK ChatCompletionAgent
        self._sk_agent = ChatCompletionAgent(
            kernel=self._kernel,
            service_id=SERVICE_ID,
            name=self.name.replace(" ", "_").replace("&", "and"),
            description=self.description,
            instructions=self.instructions,
        )

    @abstractmethod
    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent's task.

        Args:
            context: Shared context dict passed through the pipeline.
                     Contains outputs from previous agents.

        Returns:
            Updated context dict with this agent's outputs added.
        """
        ...

    async def run(self, context: dict[str, Any]) -> tuple[dict[str, Any], AgentLog]:
        """Run the agent with logging and error handling."""
        self.start_time = time.time()
        logger.info("[%s] Starting (job=%s)", self.name, self.job_id)

        try:
            result = await self.execute(context)
            duration = time.time() - self.start_time

            log = AgentLog(
                agent_name=self.name,
                status=AgentStatus.COMPLETED,
                message=f"{self.name} completed successfully",
                timestamp=datetime.utcnow(),
                duration_seconds=round(duration, 2),
                tokens_used=self.tokens_used,
            )
            logger.info("[%s] Completed in %.2fs", self.name, duration)
            return result, log

        except Exception as e:
            duration = time.time() - (self.start_time or time.time())
            log = AgentLog(
                agent_name=self.name,
                status=AgentStatus.FAILED,
                message=f"{self.name} failed: {str(e)}",
                timestamp=datetime.utcnow(),
                duration_seconds=round(duration, 2),
            )
            logger.error("[%s] Failed: %s", self.name, e, exc_info=True)
            raise

    async def invoke(self, user_message: str) -> str:
        """
        Invoke the Semantic Kernel ChatCompletionAgent with a user message.
        Returns the agent's text response.
        """
        history = ChatHistory()
        history.add_user_message(user_message)

        response_content = ""
        async for message in self._sk_agent.invoke(history):
            response_content += str(message.content or "")

        logger.info("[%s] SK agent responded (%d chars)", self.name, len(response_content))
        return response_content

    async def invoke_json(self, user_message: str) -> dict:
        """Invoke the SK agent and parse the response as JSON."""
        raw = await self.invoke(user_message)

        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first line (```json) and last line (```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        return json.loads(text)

    async def save_memory(self, data: dict) -> None:
        """Persist agent memory/metadata to the database."""
        await save_agent_memory(self.job_id, self.name, data)

    async def save_memory(self, data: dict) -> None:
        """Persist agent memory to Cosmos DB."""
        await save_agent_memory(self.job_id, self.name, data)

    @property
    def sk_agent(self) -> ChatCompletionAgent:
        """Access the underlying Semantic Kernel agent."""
        return self._sk_agent

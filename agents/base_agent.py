import json
import logging
import re
import time
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any

from semantic_kernel import Kernel
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.contents import ChatHistory, ChatMessageContent, AuthorRole

from api.models import AgentLog, AgentStatus
from services.ai_service import create_kernel
from services.db_service import save_agent_memory

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(agent_slug: str) -> str:
    """Load an agent system prompt from the prompts/ directory."""
    return (_PROMPTS_DIR / f"{agent_slug}.txt").read_text(encoding="utf-8")


def _escape_control_chars_in_json_strings(text: str) -> str:
    """
    Escape raw control characters that appear inside JSON strings.

    LLM output sometimes includes literal newlines/tabs or other control chars
    inside quoted strings, which makes strict JSON parsing fail.
    """
    out: list[str] = []
    in_string = False
    escaped = False

    for ch in text:
        if in_string:
            if escaped:
                out.append(ch)
                escaped = False
                continue

            if ch == "\\":
                out.append(ch)
                escaped = True
                continue

            if ch == '"':
                out.append(ch)
                in_string = False
                continue

            if ord(ch) < 0x20:
                if ch == "\n":
                    out.append("\\n")
                elif ch == "\r":
                    out.append("\\r")
                elif ch == "\t":
                    out.append("\\t")
                else:
                    out.append(f"\\u{ord(ch):04x}")
                continue

            out.append(ch)
            continue

        out.append(ch)
        if ch == '"':
            in_string = True

    return "".join(out)


def _extract_outer_json_object(text: str) -> str:
    """Trim leading/trailing prose and return text between first '{' and last '}'."""
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return text
    return text[start : end + 1]


def _remove_trailing_commas(text: str) -> str:
    """Best-effort cleanup for trailing commas before ] or }."""
    prev = None
    curr = text
    while prev != curr:
        prev = curr
        curr = re.sub(r",\s*([}\]])", r"\1", curr)
    return curr


def _fix_single_quotes(text: str) -> str:
    """Replace single-quoted JSON keys/values with double quotes.

    Only applied when the text looks like it uses single quotes for JSON
    strings (a common LLM mistake).  This is a heuristic — it replaces
    single quotes that appear in key/value positions while leaving
    apostrophes inside words (e.g. "don't") alone.
    """
    # Quick check: if the text already parses or has no single quotes, skip
    if "'" not in text:
        return text

    out: list[str] = []
    i = 0
    in_double = False
    while i < len(text):
        ch = text[i]

        # Track double-quoted regions to leave them untouched
        if ch == '"' and (i == 0 or text[i - 1] != "\\"):
            in_double = not in_double
            out.append(ch)
            i += 1
            continue

        if in_double:
            out.append(ch)
            i += 1
            continue

        if ch == "'":
            # Heuristic: if the char before and after are both word characters,
            # it's likely a contraction (e.g. don't) — keep as-is.
            prev_is_word = i > 0 and text[i - 1].isalpha()
            next_is_word = i + 1 < len(text) and text[i + 1].isalpha()
            if prev_is_word and next_is_word:
                out.append("'")
            else:
                out.append('"')
        else:
            out.append(ch)
        i += 1
    return "".join(out)


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
        """Invoke the SK agent and parse the response as JSON, with repair and retry."""
        raw = await self.invoke(user_message)
        parsed = self._try_parse_json(raw)
        if parsed is not None:
            return parsed

        # All local repairs failed — retry the LLM once with a strict correction prompt.
        logger.warning("[%s] JSON parse failed on first attempt, retrying with correction prompt.", self.name)
        retry_prompt = (
            "Your previous response was not valid JSON. "
            "Return ONLY a single valid JSON object — no markdown fences, no prose, "
            "no trailing commas, and use double quotes for all keys and string values. "
            "Here is the malformed output to fix:\n\n" + raw[:4000]
        )
        raw_retry = await self.invoke(retry_prompt)
        parsed = self._try_parse_json(raw_retry)
        if parsed is not None:
            return parsed

        logger.error("[%s] Failed to parse JSON after retry. Snippet: %s", self.name, raw_retry[:600])
        raise ValueError(f"{self.name} returned invalid JSON after retry")

    def _try_parse_json(self, raw: str) -> dict | None:
        """Attempt to parse raw LLM output as JSON, applying progressive repairs."""
        text = raw.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        text = _extract_outer_json_object(text.strip())

        # Attempt 1: raw text
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Attempt 2: escape control chars
        repaired = _escape_control_chars_in_json_strings(text)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass

        # Attempt 3: remove trailing commas
        repaired = _remove_trailing_commas(repaired)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass

        # Attempt 4: fix single quotes
        repaired = _fix_single_quotes(repaired)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass

        return None

    async def save_memory(self, data: dict) -> None:
        """Persist agent memory to Cosmos DB."""
        await save_agent_memory(self.job_id, self.name, data)

    @property
    def sk_agent(self) -> ChatCompletionAgent:
        """Access the underlying Semantic Kernel agent."""
        return self._sk_agent
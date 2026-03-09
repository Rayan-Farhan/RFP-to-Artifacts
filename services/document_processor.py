import io
import logging
from PyPDF2 import PdfReader
from docx import Document

logger = logging.getLogger(__name__)


async def extract_text(filename: str, file_bytes: bytes) -> str:
    """Extract text from PDF or DOCX files. Falls back to raw decode."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return _extract_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return _extract_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="replace")
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def _extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    full_text = "\n\n".join(pages)
    logger.info("Extracted %d pages from PDF (%d chars)", len(pages), len(full_text))
    return full_text


def _extract_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n\n".join(paragraphs)
    logger.info("Extracted %d paragraphs from DOCX (%d chars)", len(paragraphs), len(full_text))
    return full_text

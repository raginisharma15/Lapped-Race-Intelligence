from fastapi import APIRouter

from app.ai.summariser import generate_race_summary
from app.services.analysis_payload import build_analysis_payload

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/{session_key}")
async def get_summary(session_key: str) -> dict:
    """Return AI generated race summary."""
    payload = await build_analysis_payload(session_key)
    summary = await generate_race_summary(payload)
    return summary.model_dump()


@router.post("/{session_key}/refresh")
async def refresh_summary(session_key: str) -> dict:
    """Force rerun all analysis modules and regenerate summary."""
    payload = await build_analysis_payload(session_key)
    summary = await generate_race_summary(payload)
    return summary.model_dump()

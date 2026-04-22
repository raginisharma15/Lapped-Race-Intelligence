import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.alerts import router as alerts_router
from app.routes.analysis import router as analysis_router
from app.routes.history import router as history_router
from app.routes.summary import router as summary_router
from app.routes.telemetry import router as telemetry_router
from app.services.pipeline import get_session_dataframe
from config import get_settings

settings = get_settings()
API_V1_PREFIX = "/api/v1"
logger = logging.getLogger(__name__)


async def get_app_mode() -> tuple[Literal["live", "historical"], bool]:
    """Infer live vs off-season from OpenF1 latest session date."""
    url = f"{settings.openf1_base_url.rstrip('/')}/sessions"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, params={"session_key": "latest"})
            r.raise_for_status()
            data = r.json()
    except (httpx.HTTPError, ValueError) as e:
        logger.warning("Could not fetch latest session: %s", e)
        return "historical", False
    
    if not isinstance(data, list) or not data:
        return "historical", False
    
    raw = data[0].get("date_start") or data[0].get("date_end") or ""
    if not raw:
        return "historical", bool(data)
    
    try:
        dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return "historical", True
    
    now = datetime.now(timezone.utc)
    is_live = dt >= now - timedelta(days=7)
    return ("live" if is_live else "historical"), is_live


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create cache dirs and pre-warm pipeline."""
    try:
        Path(settings.reports_cache_dir).expanduser().mkdir(parents=True, exist_ok=True)
        Path(settings.fastf1_cache_dir).expanduser().mkdir(parents=True, exist_ok=True)
    except OSError as e:
        logger.warning("Cache setup failed: %s", e)
    
    try:
        logger.info("Pre-warming pipeline...")
        await get_session_dataframe(settings.default_session_key)
        logger.info("Pipeline ready")
    except Exception as e:
        logger.error("Startup pre-warm failed: %s", e)
    
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root() -> dict[str, Any]:
    mode, live_ok = await get_app_mode()
    return {
        "service": "LAPPED - AI Race Intelligence",
        "status": "online",
        "mode": mode,
        "live_session_available": live_ok,
        "endpoints": {
            "docs": "/docs",
            "telemetry": "/api/v1/telemetry/{session_key}/laps",
            "history": "/api/v1/history/{year}/races",
            "report": "/api/v1/history/{session_key}/report",
        },
    }


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"type": exc.__class__.__name__, "message": str(exc)}},
    )


app.include_router(telemetry_router, prefix=API_V1_PREFIX)
app.include_router(analysis_router, prefix=API_V1_PREFIX)
app.include_router(alerts_router, prefix=API_V1_PREFIX)
app.include_router(summary_router, prefix=API_V1_PREFIX)
app.include_router(history_router, prefix=API_V1_PREFIX)

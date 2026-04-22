import asyncio
import logging
import time
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.ai.summariser import (
    answer_race_question,
    build_fallback_race_report,
    compare_race_reports_groq,
    generate_race_report,
)
from app.services.analysis_payload import build_analysis_payload
from app.services.openf1_service import OpenF1Service
from app.services.pipeline import get_session_dataframe
from app.services.race_history_service import RaceHistoryService
from app.utils.schemas import ComparisonReport, RaceMeta, RaceReport

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])

REQUEST_TIMEOUT = 30.0
_svc = RaceHistoryService()


async def _with_timeout(coro):
    return await asyncio.wait_for(coro, timeout=REQUEST_TIMEOUT)


async def _driver_map(session_key: str) -> dict[int, str]:
    openf1 = OpenF1Service()
    drivers = await openf1.get_drivers(session_key)
    out: dict[int, str] = {}
    for d in drivers:
        if d.driver_number is None:
            continue
        name = d.full_name or d.acronym or f"Driver {d.driver_number}"
        out[int(d.driver_number)] = str(name)
    return out


@router.get("/seasons")
async def list_seasons() -> list[int]:
    """Years available for browsing (2023+)."""
    return _svc.get_all_seasons()


@router.get("/compare")
async def compare_races(session_key_1: str, session_key_2: str) -> ComparisonReport:
    """Compare two races using Groq over full reports."""

    async def _load_or_build(sk: str) -> RaceReport:
        c = _svc.get_race_summary_cached(sk)
        if c:
            return c
        lap_df = await get_session_dataframe(sk)
        if lap_df.empty:
            raise HTTPException(
                status_code=404,
                detail={"error": f"No data for session_key {sk}"},
            )
        meta = await _svc.get_race_meta_for_session(sk)
        if meta is None:
            raise HTTPException(status_code=404, detail={"error": f"No metadata for {sk}"})
        analysis = await build_analysis_payload(sk)
        drivers = await _driver_map(sk)
        try:
            report = await generate_race_report(sk, meta, analysis, lap_df, driver_id_to_name=drivers)
            _svc.save_race_report(sk, report)
            return report
        except Exception:
            return build_fallback_race_report(sk, meta, analysis, lap_df)

    async def _both() -> tuple[RaceReport, RaceReport]:
        return await asyncio.gather(
            _load_or_build(session_key_1),
            _load_or_build(session_key_2),
        )

    r1, r2 = await _with_timeout(_both())
    return await _with_timeout(compare_race_reports_groq(r1, r2))


@router.get("/{year}/races")
async def list_races(year: int) -> list[RaceMeta]:
    """Past races for a season, chronological."""
    if year < 2023:
        raise HTTPException(status_code=400, detail="Year must be 2023 or later")
    return await _with_timeout(_svc.get_races_by_year(year))


@router.get("/{session_key}/report")
async def get_report(session_key: str, response: Response) -> dict[str, Any]:
    """Full AI race report; cached when possible."""
    t0 = time.perf_counter()
    cached = _svc.get_race_summary_cached(session_key)
    if cached is not None:
        logger.info("Race report cache HIT session_key=%s", session_key)
        response.headers["X-Generation-Time"] = f"{time.perf_counter() - t0:.3f}"
        return {"cached": True, "report": cached.model_dump()}

    lap_df = await _with_timeout(get_session_dataframe(session_key))
    if lap_df.empty:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No data found for session_key {session_key}",
                "suggestion": "Try GET /api/v1/history/2025/races for valid keys",
            },
        )

    meta = await _with_timeout(_svc.get_race_meta_for_session(session_key))
    if meta is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No session metadata for session_key {session_key}",
                "suggestion": "Try GET /api/v1/history/2025/races for valid keys",
            },
        )

    analysis = await _with_timeout(build_analysis_payload(session_key))
    drivers = await _driver_map(session_key)

    try:
        report = await _with_timeout(
            generate_race_report(
                session_key,
                meta,
                analysis,
                lap_df,
                driver_id_to_name=drivers,
            )
        )
    except Exception as e:
        logger.exception("Groq race report failed: %s", e)
        fb = build_fallback_race_report(session_key, meta, analysis, lap_df)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI generation failed; telemetry-only report attached",
                "exception": str(e),
                "report": fb.model_dump(),
                "analysis": analysis,
            },
        ) from e

    _svc.save_race_report(session_key, report)
    elapsed = time.perf_counter() - t0
    response.headers["X-Generation-Time"] = f"{elapsed:.3f}"
    return {"cached": False, "report": report.model_dump()}


@router.get("/{session_key}/report/refresh")
async def refresh_report(session_key: str, response: Response) -> dict[str, Any]:
    """Force regenerate race report."""
    _svc.delete_race_report_cache(session_key)
    t0 = time.perf_counter()
    lap_df = await _with_timeout(get_session_dataframe(session_key))
    if lap_df.empty:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No data found for session_key {session_key}",
                "suggestion": "Try GET /api/v1/history/2025/races for valid keys",
            },
        )
    meta = await _with_timeout(_svc.get_race_meta_for_session(session_key))
    if meta is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No session metadata for session_key {session_key}",
                "suggestion": "Try GET /api/v1/history/2025/races for valid keys",
            },
        )
    analysis = await _with_timeout(build_analysis_payload(session_key))
    drivers = await _driver_map(session_key)
    try:
        report = await _with_timeout(
            generate_race_report(
                session_key,
                meta,
                analysis,
                lap_df,
                driver_id_to_name=drivers,
            )
        )
    except Exception as e:
        logger.exception("Groq race report failed: %s", e)
        fb = build_fallback_race_report(session_key, meta, analysis, lap_df)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI generation failed; telemetry-only report attached",
                "exception": str(e),
                "report": fb.model_dump(),
                "analysis": analysis,
            },
        ) from e
    _svc.save_race_report(session_key, report)
    response.headers["X-Generation-Time"] = f"{time.perf_counter() - t0:.3f}"
    return {"cached": False, "report": report.model_dump()}


class AskBody(BaseModel):
    question: str = Field(..., min_length=1)


@router.post("/{session_key}/ask")
async def ask_about_race(session_key: str, body: AskBody) -> dict[str, str]:
    """Natural-language Q&A for a race (uses report + analysis)."""
    report_c = _svc.get_race_summary_cached(session_key)
    analysis = await _with_timeout(build_analysis_payload(session_key))
    if report_c is None:
        lap_df = await _with_timeout(get_session_dataframe(session_key))
        if lap_df.empty:
            raise HTTPException(status_code=404, detail="No data for this session")
        meta = await _svc.get_race_meta_for_session(session_key)
        if meta is None:
            raise HTTPException(status_code=404, detail="Unknown session")
        drivers = await _driver_map(session_key)
        try:
            report_c = await _with_timeout(
                generate_race_report(
                    session_key,
                    meta,
                    analysis,
                    lap_df,
                    driver_id_to_name=drivers,
                )
            )
        except Exception:
            report_c = build_fallback_race_report(session_key, meta, analysis, lap_df)
    answer = await _with_timeout(answer_race_question(body.question, report_c, analysis))
    return {"answer": answer}

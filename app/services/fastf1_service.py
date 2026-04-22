import asyncio
import re
from pathlib import Path
from typing import Any, Optional, Tuple

import httpx
import pandas as pd

from app.services.openf1_service import _query_session_key
from config import get_settings

SESSION_MAP: dict[str, tuple[int, str, str]] = {
    "9839": (2025, "Abu Dhabi", "R"),
    "9161": (2023, "Singapore", "R"),
    "9158": (2023, "Singapore", "FP1"),
}

_OPENF1_SESSION_NAME_TO_FASTF1: dict[str, str] = {
    "race": "R",
    "sprint": "Sprint",
    "sprint shootout": "Sprint Shootout",
    "qualifying": "Q",
    "sprint qualifying": "Sprint Qualifying",
    "fp1": "FP1",
    "fp2": "FP2",
    "fp3": "FP3",
}


def _meeting_name_to_gp_name(meeting_name: Optional[str]) -> str:
    if not meeting_name:
        return ""
    return re.sub(r"\s+Grand Prix\s*$", "", meeting_name.strip(), flags=re.IGNORECASE).strip()


def _openf1_session_name_to_fastf1(session_name: Optional[str]) -> str:
    if not session_name:
        return "R"
    key = session_name.strip().lower()
    return _OPENF1_SESSION_NAME_TO_FASTF1.get(key, "R")


class FastF1Service:
    """Fetch and normalize FastF1 telemetry for session analysis."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def _fetch_openf1_session_metadata(self, session_key: str) -> Optional[Tuple[int, str, str]]:
        """Resolve (year, grand prix name, session type) from OpenF1 /sessions."""
        settings = get_settings()
        url = f"{settings.openf1_base_url}/sessions"
        params: dict[str, Any] = {"session_key": _query_session_key(session_key)}
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError):
            return None
        if not isinstance(data, list) or not data:
            return None
        row = data[0]
        if not isinstance(row, dict):
            return None
        year = row.get("year")
        if year is None:
            return None
        try:
            year_int = int(year)
        except (TypeError, ValueError):
            return None
        meeting_name = row.get("meeting_name")
        country_name = row.get("country_name")
        gp = _meeting_name_to_gp_name(meeting_name if meeting_name else None)
        if not gp and country_name:
            gp = str(country_name).strip()
        session_name = row.get("session_name")
        session_type = _openf1_session_name_to_fastf1(
            str(session_name) if session_name is not None else None
        )
        if not gp:
            return None
        return (year_int, gp, session_type)

    async def _resolve_fastf1_session(self, session_key: str) -> Optional[Tuple[int, str, str]]:
        """Map OpenF1 session_key to FastF1 get_session(year, gp, session_type)."""
        key = str(session_key).strip()
        if key in SESSION_MAP:
            return SESSION_MAP[key]
        return await self._fetch_openf1_session_metadata(session_key)

    async def get_telemetry(self, session_key: str) -> pd.DataFrame:
        """Return telemetry features merged at driver/lap granularity."""
        try:
            import fastf1
        except ImportError:
            return pd.DataFrame()

        raw_cache_dir = str(self.settings.fastf1_cache_dir or "").strip()
        cache_dir = Path(raw_cache_dir if raw_cache_dir else "./cache/fastf1").expanduser().resolve()
        cache_dir.mkdir(parents=True, exist_ok=True)
        print(f"FastF1 cache directory: {cache_dir}")
        fastf1.Cache.enable_cache(str(cache_dir))

        resolved = await self._resolve_fastf1_session(session_key)
        if resolved is None:
            return pd.DataFrame()

        year, gp_name, session_identifier = resolved
        cache_path = str(cache_dir)

        def _load() -> pd.DataFrame:
            import fastf1

            fastf1.Cache.enable_cache(cache_path)
            session = fastf1.get_session(year, gp_name, session_identifier)
            session.load(telemetry=True, laps=True, weather=False, messages=False)
            laps = session.laps[["DriverNumber", "LapNumber", "Compound", "TyreLife"]].copy()
            laps.columns = ["driver_number", "lap_number", "tyre_compound", "tyre_age"]
            return laps

        df = await asyncio.to_thread(_load)
        return df

    def merge_with_openf1(self, base_df: pd.DataFrame, fastf1_df: pd.DataFrame) -> pd.DataFrame:
        """Merge FastF1 and OpenF1 frames by driver and lap."""
        if fastf1_df.empty:
            base_df["tyre_compound"] = base_df.get("tyre_compound", "UNKNOWN")
            base_df["tyre_age"] = base_df.get("tyre_age", 0)
            return base_df
        return base_df.merge(fastf1_df, how="left", on=["driver_number", "lap_number"])

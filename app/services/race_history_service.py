"""Past races listing and cached AI race reports (OpenF1 + local JSON cache)."""

import json
import logging
from pathlib import Path
from typing import Any, Optional

import httpx

from app.utils.schemas import RaceMeta, RaceReport
from config import get_settings

logger = logging.getLogger(__name__)


class RaceHistoryService:
    """Browse seasons/meetings and persist immutable race reports."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._base = self.settings.openf1_base_url.rstrip("/")

    def _reports_path(self, session_key: str) -> Path:
        root = Path(self.settings.reports_cache_dir).expanduser().resolve()
        safe = str(session_key).strip().replace("/", "_")
        return root / f"{safe}.json"

    @staticmethod
    def get_all_seasons() -> list[int]:
        """Return supported seasons (2023 onwards)."""
        return [2023, 2024, 2025]

    async def _http_get_json(self, path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        url = f"{self._base}/{path.lstrip('/')}"
        try:
            async with httpx.AsyncClient(timeout=25) as client:
                r = await client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
        except (httpx.HTTPError, ValueError) as e:
            logger.warning("OpenF1 request failed %s %s: %s", path, params, e)
            return []
        if not isinstance(data, list):
            return []
        return [x for x in data if isinstance(x, dict)]

    def _row_to_race_meta(
        self,
        meeting: dict[str, Any],
        race_session: dict[str, Any],
        year_fallback: int,
    ) -> Optional[RaceMeta]:
        try:
            mk_raw = meeting.get("meeting_key") if isinstance(meeting, dict) else None
            if mk_raw is None:
                mk_raw = race_session.get("meeting_key")
            mk = int(mk_raw) if mk_raw is not None else 0
            sk = int(race_session.get("session_key", 0))
        except (TypeError, ValueError):
            return None
        if not sk:
            return None
        race_name = (
            meeting.get("meeting_official_name")
            or meeting.get("meeting_name")
            or meeting.get("circuit_short_name")
            or "Grand Prix"
        )
        country = str(meeting.get("country_name") or meeting.get("country_code") or "")
        circuit = str(meeting.get("circuit_short_name") or meeting.get("location") or "")
        date_raw = meeting.get("date_start") or race_session.get("date_start") or ""
        date_str = str(date_raw)[:10] if date_raw else ""
        y = meeting.get("year") if isinstance(meeting, dict) else None
        if y is None:
            y = race_session.get("year")
        try:
            year = int(y) if y is not None else year_fallback
        except (TypeError, ValueError):
            year = year_fallback
        return RaceMeta(
            meeting_key=mk,
            session_key=sk,
            race_name=str(race_name),
            country=country,
            circuit=circuit,
            date=date_str,
            year=year,
        )

    async def get_races_by_year(self, year: int) -> list[RaceMeta]:
        """List race weekends for a season with Race session_key."""
        meetings = await self._http_get_json("meetings", {"year": year})
        out: list[RaceMeta] = []
        for m in meetings:
            mk = m.get("meeting_key")
            if mk is None:
                continue
            sessions = await self._http_get_json(
                "sessions",
                {"meeting_key": int(mk), "session_name": "Race"},
            )
            race_sess = next(
                (s for s in sessions if str(s.get("session_name", "")).lower() == "race"),
                sessions[0] if sessions else None,
            )
            if race_sess is None:
                continue
            meta = self._row_to_race_meta(m, race_sess, year)
            if meta:
                out.append(meta)
        out.sort(key=lambda x: x.date or "")
        return out

    def get_race_summary_cached(self, session_key: str) -> Optional[RaceReport]:
        """Load cached report JSON if present."""
        path = self._reports_path(session_key)
        if not path.is_file():
            return None
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            return RaceReport.model_validate(raw)
        except (OSError, ValueError, json.JSONDecodeError) as e:
            logger.warning("Failed to load cached report %s: %s", path, e)
            return None

    def save_race_report(self, session_key: str, report: RaceReport) -> None:
        """Persist report to ./cache/reports/{session_key}.json."""
        path = self._reports_path(session_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            report.model_dump_json(indent=2),
            encoding="utf-8",
        )

    def delete_race_report_cache(self, session_key: str) -> None:
        """Remove cached file for refresh."""
        path = self._reports_path(session_key)
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass

    async def get_race_meta_for_session(self, session_key: str) -> Optional[RaceMeta]:
        """Resolve RaceMeta from OpenF1 /sessions for a race session_key."""
        from app.services.openf1_service import _query_session_key

        qk = _query_session_key(session_key)
        rows = await self._http_get_json("sessions", {"session_key": qk})
        if not rows:
            return None
        row = rows[0]
        mk = row.get("meeting_key")
        if mk is None:
            return None
        meetings = await self._http_get_json("meetings", {"meeting_key": int(mk)})
        meeting = meetings[0] if meetings else row
        y = row.get("year") or meeting.get("year")
        try:
            yf = int(y) if y is not None else 2024
        except (TypeError, ValueError):
            yf = 2024
        return self._row_to_race_meta(meeting if meeting else row, row, yf)

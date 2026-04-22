import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd

from app.utils.schemas import (
    ComparisonReport,
    DriverReport,
    FastestLapInfo,
    RaceMeta,
    RaceReport,
    RaceSummary,
)
from config import get_settings

logger = logging.getLogger(__name__)


def _build_groq_client(api_key: str):
    """Create Groq client lazily so app can boot without dependency."""
    try:
        from groq import Groq
    except ImportError:
        return None
    return Groq(api_key=api_key)


def _build_prompt(payload: dict[str, Any]) -> str:
    """Build structured prompt for LLM summary generation."""
    return (
        "You are an F1 race telemetry analyst. Produce JSON with keys: "
        "headline, key_events, driver_reports, technical_insights, alert_summary.\n"
        f"Input data:\n{json.dumps(payload, default=str)}"
    )


def _strip_json_fences(raw: str) -> str:
    """Remove markdown code fences from model output."""
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()


def _lap_df_to_context(lap_df: pd.DataFrame) -> dict[str, Any]:
    """Compact stats from unified lap dataframe for LLM context."""
    if lap_df.empty:
        return {"empty": True}
    out: dict[str, Any] = {"per_driver": {}}
    for drv, g in lap_df.groupby("driver_number"):
        g = g.sort_values("lap_number")
        lt = g["lap_time"].dropna()
        best = float(lt.min()) if not lt.empty else None
        avg = float(lt.mean()) if not lt.empty else None
        first_pos = g.iloc[0].get("position")
        last_pos = g.iloc[-1].get("position")
        compounds = [str(x) for x in g["tyre_compound"].dropna().unique().tolist()]
        cc = g["tyre_compound"].fillna("UNK")
        pit_proxy = int((cc != cc.shift(fill_value=cc.iloc[0])).sum()) if len(cc) else 0
        out["per_driver"][str(int(drv))] = {
            "best_lap_time": best,
            "avg_lap_time": avg,
            "start_position": int(first_pos) if pd.notna(first_pos) else None,
            "finish_position": int(last_pos) if pd.notna(last_pos) else None,
            "compounds_seen": compounds,
            "pit_events_proxy": max(0, pit_proxy - 1),
        }
    # Fastest lap overall
    valid = lap_df.dropna(subset=["lap_time"])
    if not valid.empty:
        i = valid["lap_time"].idxmin()
        row = lap_df.loc[i]
        out["fastest_lap_row"] = {
            "driver_number": int(row["driver_number"]),
            "lap_number": int(row["lap_number"]),
            "lap_time": float(row["lap_time"]),
            "sector_1": float(row["sector_1"]) if pd.notna(row.get("sector_1")) else None,
            "sector_2": float(row["sector_2"]) if pd.notna(row.get("sector_2")) else None,
            "sector_3": float(row["sector_3"]) if pd.notna(row.get("sector_3")) else None,
        }
    return out


def _merge_driver_reports(
    llm_drivers: dict[str, Any],
    lap_df: pd.DataFrame,
    driver_id_to_name: dict[int, str],
) -> dict[str, DriverReport]:
    """Combine LLM text with dataframe-derived numbers."""
    merged: dict[str, DriverReport] = {}
    ctx = _lap_df_to_context(lap_df).get("per_driver", {})
    for name, blob in llm_drivers.items():
        if not isinstance(blob, dict):
            continue
        drn = blob.get("driver_number")
        if drn is None:
            for k, v in driver_id_to_name.items():
                if v == name:
                    drn = k
                    break
        try:
            dnum = int(drn) if drn is not None else 0
        except (TypeError, ValueError):
            dnum = 0
        st = ctx.get(str(dnum), {}) if dnum else {}
        sp = int(blob.get("start_position") or st.get("start_position") or 0)
        fp = int(blob.get("finish_position") or st.get("finish_position") or 0)
        pg_raw = blob.get("positions_gained")
        if pg_raw is not None:
            pg = int(pg_raw)
        elif sp and fp:
            pg = max(0, sp - fp)
        else:
            pg = 0
        merged[name] = DriverReport(
            driver_number=dnum or int(blob.get("driver_number") or 0),
            driver_name=str(blob.get("driver_name") or name),
            finish_position=fp,
            start_position=sp,
            positions_gained=pg,
            best_lap_time=_f(blob.get("best_lap_time"), st.get("best_lap_time")),
            avg_lap_time=_f(blob.get("avg_lap_time"), st.get("avg_lap_time")),
            tire_degradation_rate=_f(blob.get("tire_degradation_rate")),
            pit_stops=int(blob.get("pit_stops") or st.get("pit_events_proxy") or 0),
            assessment=str(blob.get("assessment") or ""),
        )
    # Fill missing drivers from dataframe only
    if lap_df.empty:
        return merged
    last_per = lap_df.sort_values("lap_number").groupby("driver_number").tail(1)
    first_per = lap_df.sort_values("lap_number").groupby("driver_number").head(1)
    for drv in lap_df["driver_number"].dropna().unique():
        try:
            dint = int(drv)
        except (TypeError, ValueError):
            continue
        nm = driver_id_to_name.get(dint, f"Driver {dint}")
        if nm in merged:
            continue
        lp = last_per[last_per["driver_number"] == drv]
        fp = first_per[first_per["driver_number"] == drv]
        fin = int(lp["position"].iloc[0]) if not lp.empty and pd.notna(lp["position"].iloc[0]) else 0
        sta = int(fp["position"].iloc[0]) if not fp.empty and pd.notna(fp["position"].iloc[0]) else 0
        sub = lap_df[lap_df["driver_number"] == drv]
        lt = sub["lap_time"].dropna()
        merged[nm] = DriverReport(
            driver_number=dint,
            driver_name=nm,
            finish_position=fin,
            start_position=sta,
            positions_gained=max(0, sta - fin) if sta and fin else 0,
            best_lap_time=float(lt.min()) if not lt.empty else None,
            avg_lap_time=float(lt.mean()) if not lt.empty else None,
            tire_degradation_rate=None,
            pit_stops=0,
            assessment="See telemetry summary; LLM did not return a narrative for this driver.",
        )
    return merged


def _f(*vals: Any) -> Optional[float]:
    for v in vals:
        if v is None:
            continue
        try:
            return float(v)
        except (TypeError, ValueError):
            continue
    return None


async def generate_race_summary(analysis_payload: dict[str, Any]) -> RaceSummary:
    """Generate race summary from aggregated analysis payload."""
    settings = get_settings()
    prompt = _build_prompt(analysis_payload)

    if not settings.groq_api_key:
        return RaceSummary(
            headline="Telemetry summary generated without external LLM.",
            key_events=["Groq API key not configured."],
            driver_reports={},
            technical_insights=["Configure GROQ_API_KEY to enable AI summaries."],
            alert_summary={"INFO": ["No grouped alerts available."]},
        )

    client = _build_groq_client(settings.groq_api_key)
    if client is None:
        return RaceSummary(
            headline="Telemetry summary generated without external LLM.",
            key_events=["Groq package not installed."],
            driver_reports={},
            technical_insights=["Install groq package to enable AI summaries."],
            alert_summary={"INFO": ["No grouped alerts available."]},
        )

    def _run_completion() -> str:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
        )
        content = completion.choices[0].message.content
        return content if isinstance(content, str) else str(content)

    text = await asyncio.to_thread(_run_completion)
    try:
        parsed = json.loads(_strip_json_fences(text))
    except json.JSONDecodeError:
        parsed = {
            "headline": "Unable to parse model output.",
            "key_events": [text[:500]],
            "driver_reports": {},
            "technical_insights": [],
            "alert_summary": {},
        }
    return RaceSummary.model_validate(parsed)


async def generate_race_report(
    session_key: str,
    race_meta: RaceMeta,
    analysis_data: dict[str, Any],
    lap_df: pd.DataFrame,
    driver_id_to_name: Optional[dict[int, str]] = None,
) -> RaceReport:
    """Generate a full historical race report using Groq LLM."""
    settings = get_settings()
    driver_id_to_name = driver_id_to_name or {}
    lap_ctx = _lap_df_to_context(lap_df)
    rich = {
        **analysis_data,
        "lap_statistics": lap_ctx,
        "race_meta": race_meta.model_dump(),
    }
    prompt = f"""
You are an expert F1 analyst and race journalist.

Generate a detailed race report for:
Race: {race_meta.race_name}
Country: {race_meta.country}
Date: {race_meta.date}
Year: {race_meta.year}

Race Data:
{json.dumps(rich, indent=2, default=str)}

Return ONLY a valid JSON object with this exact structure:
{{
  "headline": "one compelling sentence summarising the race",
  "race_story": "3-4 paragraph narrative telling the full race story",
  "key_moments": ["moment 1", "moment 2"],
  "winner": "driver name",
  "podium": ["1st", "2nd", "3rd"],
  "driver_reports": {{
    "driver_name": {{
      "driver_number": 0,
      "driver_name": "string",
      "finish_position": 0,
      "start_position": 0,
      "positions_gained": 0,
      "best_lap_time": null,
      "avg_lap_time": null,
      "tire_degradation_rate": null,
      "pit_stops": 0,
      "assessment": "2-3 sentence assessment"
    }}
  }},
  "tire_strategies": {{"driver_name": ["SOFT", "MEDIUM"]}},
  "fastest_lap": {{
    "driver_name": "str",
    "lap_number": 0,
    "lap_time": 0.0,
    "sector_1": null,
    "sector_2": null,
    "sector_3": null
  }},
  "safety_car_periods": ["lap X to Y"],
  "notable_retirements": ["driver - reason"],
  "anomalies_detected": ["description"],
  "performance_insights": ["insight 1", "insight 2"]
}}
"""

    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not configured")

    client = _build_groq_client(settings.groq_api_key)
    if client is None:
        raise RuntimeError("groq package not installed")

    def _run() -> str:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000,
            temperature=0.3,
        )
        raw = completion.choices[0].message.content
        return raw if isinstance(raw, str) else str(raw)

    raw = await asyncio.to_thread(_run)
    clean = _strip_json_fences(raw)
    data = json.loads(clean)

    dr_in = data.get("driver_reports") or {}
    if not isinstance(dr_in, dict):
        dr_in = {}
    driver_reports = _merge_driver_reports(dr_in, lap_df, driver_id_to_name)

    fl = data.get("fastest_lap") or {}
    if lap_ctx.get("fastest_lap_row"):
        flr = lap_ctx["fastest_lap_row"]
        dn = flr["driver_number"]
        fname = driver_id_to_name.get(dn, fl.get("driver_name", f"Driver {dn}"))
        fastest = FastestLapInfo(
            driver_name=str(fname),
            lap_number=int(flr["lap_number"]),
            lap_time=float(flr["lap_time"]),
            sector_1=flr.get("sector_1"),
            sector_2=flr.get("sector_2"),
            sector_3=flr.get("sector_3"),
        )
    else:
        fastest = FastestLapInfo(
            driver_name=str(fl.get("driver_name", "")),
            lap_number=int(fl.get("lap_number", 0)),
            lap_time=float(fl.get("lap_time", 0)),
            sector_1=_f(fl.get("sector_1")),
            sector_2=_f(fl.get("sector_2")),
            sector_3=_f(fl.get("sector_3")),
        )

    gen_at = datetime.now(timezone.utc).isoformat()
    return RaceReport(
        session_key=str(session_key),
        race_name=race_meta.race_name,
        country=race_meta.country,
        date=race_meta.date,
        year=race_meta.year,
        generated_at=gen_at,
        headline=str(data.get("headline", "")),
        race_story=str(data.get("race_story", "")),
        key_moments=list(data.get("key_moments") or [])[:10],
        winner=str(data.get("winner", "")),
        podium=list(data.get("podium") or [])[:3],
        driver_reports=driver_reports,
        tire_strategies={str(k): list(v) for k, v in (data.get("tire_strategies") or {}).items()},
        fastest_lap=fastest,
        safety_car_periods=list(data.get("safety_car_periods") or []),
        notable_retirements=list(data.get("notable_retirements") or []),
        anomalies_detected=list(data.get("anomalies_detected") or []),
        performance_insights=list(data.get("performance_insights") or []),
    )


def build_fallback_race_report(
    session_key: str,
    race_meta: RaceMeta,
    analysis_data: dict[str, Any],
    lap_df: pd.DataFrame,
) -> RaceReport:
    """Structured report without LLM (ML / telemetry only)."""
    ctx = _lap_df_to_context(lap_df)
    gen_at = datetime.now(timezone.utc).isoformat()
    fastest = FastestLapInfo(driver_name="Unknown", lap_number=0, lap_time=0.0)
    if ctx.get("fastest_lap_row"):
        flr = ctx["fastest_lap_row"]
        fastest = FastestLapInfo(
            driver_name=f"Driver {flr['driver_number']}",
            lap_number=int(flr["lap_number"]),
            lap_time=float(flr["lap_time"]),
            sector_1=flr.get("sector_1"),
            sector_2=flr.get("sector_2"),
            sector_3=flr.get("sector_3"),
        )
    return RaceReport(
        session_key=str(session_key),
        race_name=race_meta.race_name,
        country=race_meta.country,
        date=race_meta.date,
        year=race_meta.year,
        generated_at=gen_at,
        headline="Telemetry and ML analysis (AI narrative unavailable)",
        race_story=json.dumps(
            {"analysis": analysis_data, "lap_statistics": ctx},
            indent=2,
            default=str,
        )[:8000],
        key_moments=[str(x) for x in (analysis_data.get("alerts") or [])][:10],
        winner="",
        podium=[],
        driver_reports={},
        tire_strategies={},
        fastest_lap=fastest,
        safety_car_periods=[],
        notable_retirements=[],
        anomalies_detected=[str(x) for x in (analysis_data.get("anomalies") or [])][:20],
        performance_insights=[str(x) for x in (analysis_data.get("sector_time_losses") or [])][:10],
    )


async def compare_race_reports_groq(
    report_a: RaceReport,
    report_b: RaceReport,
) -> ComparisonReport:
    """Ask Groq to compare two full race reports."""
    settings = get_settings()
    if not settings.groq_api_key:
        return ComparisonReport(
            race_1_summary=report_a.headline,
            race_2_summary=report_b.headline,
            key_differences=["Configure GROQ_API_KEY for AI comparison."],
            better_race="N/A",
            driver_comparisons={},
        )
    client = _build_groq_client(settings.groq_api_key)
    if client is None:
        return ComparisonReport(
            race_1_summary=report_a.headline,
            race_2_summary=report_b.headline,
            key_differences=["Install groq package to enable AI comparison."],
            better_race="N/A",
            driver_comparisons={},
        )
    payload = {
        "race_1": report_a.model_dump(),
        "race_2": report_b.model_dump(),
    }
    prompt = f"""Compare these two F1 races. Return ONLY valid JSON:
{{
  "race_1_summary": "short summary",
  "race_2_summary": "short summary",
  "key_differences": ["..."],
  "better_race": "which was more exciting and why (one paragraph)",
  "driver_comparisons": {{ "driver name": "comparison note" }}
}}
Data:
{json.dumps(payload, default=str)}
"""

    def _run() -> str:
        c = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2500,
            temperature=0.3,
        )
        t = c.choices[0].message.content
        return t if isinstance(t, str) else str(t)

    raw = await asyncio.to_thread(_run)
    try:
        data = json.loads(_strip_json_fences(raw))
    except json.JSONDecodeError:
        return ComparisonReport(
            race_1_summary=report_a.headline,
            race_2_summary=report_b.headline,
            key_differences=[raw[:2000]],
            better_race="Unable to parse comparison.",
            driver_comparisons={},
        )
    return ComparisonReport(
        race_1_summary=str(data.get("race_1_summary", "")),
        race_2_summary=str(data.get("race_2_summary", "")),
        key_differences=list(data.get("key_differences") or []),
        better_race=str(data.get("better_race", "")),
        driver_comparisons=dict(data.get("driver_comparisons") or {}),
    )


async def answer_race_question(
    question: str,
    report: RaceReport,
    analysis_data: dict[str, Any],
) -> str:
    """Answer a natural-language question about a cached/generated race."""
    settings = get_settings()
    if not settings.groq_api_key:
        return "Set GROQ_API_KEY to enable Q&A."
    client = _build_groq_client(settings.groq_api_key)
    if client is None:
        return "Install groq package to enable Q&A."
    prompt = f"""You are an F1 analyst. Answer concisely using the report and data.

Question: {question}

Report summary:
{report.model_dump_json()}

Extra telemetry analysis:
{json.dumps(analysis_data, default=str)[:12000]}
"""

    def _run() -> str:
        c = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.4,
        )
        t = c.choices[0].message.content
        return t if isinstance(t, str) else str(t)

    return await asyncio.to_thread(_run)

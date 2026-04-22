"""Shared ML + alerts payload for summary and history report generation."""

from app.alerts.alert_engine import AlertEngine
from app.ml.anomaly_detector import run_anomaly_detection
from app.ml.engine_monitor import analyze_engine_health
from app.ml.overtake_analyzer import analyze_overtakes
from app.ml.sector_analyzer import analyze_sectors
from app.ml.tire_model import build_tire_degradation_report
from app.services.pipeline import get_session_dataframe

_alert_engine = AlertEngine()


async def build_analysis_payload(session_key: str) -> dict:
    """Aggregate dataframe-driven analysis for LLM and API responses."""
    df = await get_session_dataframe(session_key)
    anomalies = [item.model_dump() for item in run_anomaly_detection(df)]
    tires = [item.model_dump() for item in build_tire_degradation_report(df)]
    engine = [item.model_dump() for item in analyze_engine_health(df)]
    sectors = [item.model_dump() for item in analyze_sectors(df)]
    overtakes = [item.model_dump() for item in analyze_overtakes(df)]
    alerts = [
        item.model_dump()
        for item in _alert_engine.generate_alerts(
            df,
            build_tire_degradation_report(df),
            analyze_engine_health(df),
            analyze_overtakes(df),
        )
    ]
    return {
        "session_key": session_key,
        "anomalies": anomalies,
        "tire_degradation_report": tires,
        "engine_warnings": engine,
        "sector_time_losses": sectors,
        "overtake_events": overtakes,
        "alerts": alerts,
    }

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class LapRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    lap_number: Optional[int] = None
    lap_time: Optional[float] = None
    sector_1: Optional[float] = None
    sector_2: Optional[float] = None
    sector_3: Optional[float] = None


class CarDataRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    rpm: Optional[float] = None
    throttle: Optional[float] = None
    brake: Optional[float] = None
    drs: Optional[int] = None
    n_gear: Optional[int] = None
    speed: Optional[float] = None
    speed_trap: Optional[float] = None
    lap_number: Optional[int] = None


class IntervalRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    lap_number: Optional[int] = None
    gap_to_leader: Optional[float] = None
    interval: Optional[float] = None


class PitRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    lap_number: Optional[int] = None
    pit_duration: Optional[float] = None


class PositionRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    lap_number: Optional[int] = None
    position: Optional[int] = None


class DriverRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: Optional[int] = None
    full_name: Optional[str] = None
    team_name: Optional[str] = None
    acronym: Optional[str] = None


class AnomalyResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: int
    lap_number: int
    anomaly_score: float
    is_anomaly: bool
    most_anomalous_feature: str


class TireDegradationReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    compound: str
    deg_rate: float
    laps_to_cliff: int
    recommended_pit_lap: int


class EngineFlag(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: int
    overheating_risk: bool
    mapping_change_detected: bool


class OvertakeEvent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lap: int
    driver: int
    position_gained: int
    zone: str
    speed_delta: float


class SectorReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_number: int
    worst_sector: str
    time_loss_vs_best: float
    problem_corners: list[str] = Field(default_factory=list)


class RaceAlert(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    severity: Literal["CRITICAL", "WARNING", "INFO"]
    category: Literal[
        "TIRE_DEGRADATION",
        "ENGINE_TEMP",
        "BATTERY_ERS",
        "LAP_TIME_ANOMALY",
        "POSITION_CHANGE",
        "PIT_WINDOW",
    ]
    driver: Optional[int] = None
    message: str
    timestamp: datetime


class RaceSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    headline: str
    key_events: list[str]
    driver_reports: dict[str, dict[str, Any]]
    technical_insights: list[str]
    alert_summary: dict[str, list[str]]


class RaceMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    meeting_key: int
    session_key: int
    race_name: str
    country: str
    circuit: str
    date: str
    year: int


class FastestLapInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    driver_name: str
    lap_number: int
    lap_time: float
    sector_1: Optional[float] = None
    sector_2: Optional[float] = None
    sector_3: Optional[float] = None


class DriverReport(BaseModel):
    """Per-driver narrative report for historical race reports."""

    model_config = ConfigDict(populate_by_name=True)

    driver_number: int
    driver_name: str
    finish_position: int
    start_position: int
    positions_gained: int
    best_lap_time: Optional[float] = None
    avg_lap_time: Optional[float] = None
    tire_degradation_rate: Optional[float] = None
    pit_stops: int
    assessment: str


class RaceReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_key: str
    race_name: str
    country: str
    date: str
    year: int
    generated_at: str
    headline: str
    race_story: str
    key_moments: list[str]
    winner: str
    podium: list[str]
    driver_reports: dict[str, DriverReport]
    tire_strategies: dict[str, list[str]]
    fastest_lap: FastestLapInfo
    safety_car_periods: list[str]
    notable_retirements: list[str]
    anomalies_detected: list[str]
    performance_insights: list[str]


class ComparisonReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    race_1_summary: str
    race_2_summary: str
    key_differences: list[str]
    better_race: str
    driver_comparisons: dict[str, Any]

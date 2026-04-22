export interface LapRecord {
  driver_number: number;
  lap_number: number;
  lap_time: number | null;
  sector_1: number | null;
  sector_2: number | null;
  sector_3: number | null;
  tyre_compound: string;
  tyre_age: number;
  speed_trap: number | null;
  throttle_pct: number | null;
  brake_pct: number | null;
  engine_rpm: number | null;
  drs_active: number | null;
  gap_to_leader: number | null;
  position: number | null;
}

export interface DriverReport {
  driver_number: number;
  driver_name: string;
  finish_position: number;
  start_position: number;
  positions_gained: number;
  best_lap_time: number | null;
  avg_lap_time: number | null;
  tire_degradation_rate: number | null;
  pit_stops: number;
  assessment: string;
}

export interface FastestLapInfo {
  driver_name: string;
  lap_number: number;
  lap_time: number;
  sector_1: number | null;
  sector_2: number | null;
  sector_3: number | null;
}

export interface RaceReport {
  session_key: string;
  race_name: string;
  country: string;
  date: string;
  year: number;
  generated_at: string;
  headline: string;
  race_story: string;
  key_moments: string[];
  winner: string;
  podium: string[];
  driver_reports: Record<string, DriverReport>;
  tire_strategies: Record<string, string[]>;
  fastest_lap: FastestLapInfo;
  safety_car_periods: string[];
  notable_retirements: string[];
  anomalies_detected: string[];
  performance_insights: string[];
}

export interface RaceAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  driver_number: number | null;
  message: string;
  timestamp: string;
}

export interface RaceMeta {
  session_key: string;
  race_name: string;
  country: string;
  date: string;
  year: number;
}

export interface SessionInfo {
  session_key: string;
  session_name: string;
  circuit_name: string;
  is_live: boolean;
}

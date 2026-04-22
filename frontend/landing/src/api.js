const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

async function requestJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Invalid JSON from ${path}`);
  }
  if (!response.ok) {
    const detail = payload?.detail || payload?.error || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return payload;
}

export async function fetchSummary(sessionKey) {
  return requestJson(`/api/v1/summary/${encodeURIComponent(sessionKey)}`);
}

export async function fetchTelemetry(sessionKey) {
  return requestJson(`/api/v1/telemetry/${encodeURIComponent(sessionKey)}/laps`);
}

export async function fetchPitStrategy(sessionKey) {
  return requestJson(`/api/v1/analysis/${encodeURIComponent(sessionKey)}/tires`);
}

export async function fetchFinalInsights(sessionKey) {
  const [anomalies, overtakes, report] = await Promise.allSettled([
    requestJson(`/api/v1/analysis/${encodeURIComponent(sessionKey)}/anomalies`),
    requestJson(`/api/v1/analysis/${encodeURIComponent(sessionKey)}/overtakes`),
    requestJson(`/api/v1/history/${encodeURIComponent(sessionKey)}/report`)
  ]);

  return {
    anomalies: anomalies.status === "fulfilled" ? anomalies.value : [],
    overtakes: overtakes.status === "fulfilled" ? overtakes.value : [],
    report: report.status === "fulfilled" ? report.value : null
  };
}

export async function fetchLandingData(sessionKey) {
  const [summary, telemetry, strategy, insights] = await Promise.allSettled([
    fetchSummary(sessionKey),
    fetchTelemetry(sessionKey),
    fetchPitStrategy(sessionKey),
    fetchFinalInsights(sessionKey)
  ]);

  return {
    summary,
    telemetry,
    strategy,
    insights
  };
}

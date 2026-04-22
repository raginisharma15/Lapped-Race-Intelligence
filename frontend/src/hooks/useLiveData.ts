import { useState, useEffect, useRef } from 'react';
import { LapRecord } from '@/types';
import { telemetryApi } from '@/api/telemetry';

export const useLiveData = (sessionKey: string, interval = 5000) => {
  const [data, setData] = useState<LapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!sessionKey) return;

    const fetchData = async () => {
      try {
        const laps = await telemetryApi.getSessionLaps(sessionKey);
        setData(laps);
        setError(null);
        setLastUpdated(new Date());
        errorCountRef.current = 0;
        setLoading(false);
      } catch (err) {
        errorCountRef.current += 1;
        if (errorCountRef.current >= 3) {
          setError('Failed to fetch data after 3 attempts');
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [sessionKey, interval]);

  return { data, loading, error, lastUpdated };
};

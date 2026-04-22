import { useState, useEffect, useRef } from 'react';
import { RaceAlert } from '@/types';
import { alertsApi } from '@/api/alerts';

export const useAlerts = (sessionKey: string) => {
  const [alerts, setAlerts] = useState<RaceAlert[]>([]);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const previousAlertsRef = useRef<RaceAlert[]>([]);

  useEffect(() => {
    if (!sessionKey) return;

    const fetchAlerts = async () => {
      try {
        const data = await alertsApi.getAlerts(sessionKey);
        
        const newCritical = data.filter(
          (alert) =>
            alert.severity === 'CRITICAL' &&
            !previousAlertsRef.current.some((prev) => prev.timestamp === alert.timestamp)
        );

        if (newCritical.length > 0) {
          setNewAlertsCount((prev) => prev + newCritical.length);
        }

        setAlerts(data);
        previousAlertsRef.current = data;
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 10000);

    return () => clearInterval(intervalId);
  }, [sessionKey]);

  return { alerts, newAlertsCount };
};

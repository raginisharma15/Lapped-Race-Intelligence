import { useState, useEffect } from 'react';
import { RaceReport } from '@/types';
import { historyApi } from '@/api/history';

export const useRaceReport = (sessionKey: string) => {
  const [report, setReport] = useState<RaceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (!sessionKey) return;

    const fetchReport = async () => {
      setLoading(true);
      setGenerating(true);
      setError(null);

      const steps = [
        'Fetching telemetry...',
        'Analyzing tires...',
        'Running anomaly detection...',
        'Generating AI narrative...',
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex]);
          stepIndex++;
        }
      }, 6000);

      try {
        const data = await historyApi.getRaceReport(sessionKey);
        setReport(data);
        setProgress('Complete!');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        clearInterval(progressInterval);
        setLoading(false);
        setGenerating(false);
      }
    };

    fetchReport();
  }, [sessionKey]);

  return { report, loading, generating, error, progress };
};

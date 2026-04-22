import { useParams } from 'react-router-dom';
import { useRaceReport } from '@/hooks/useRaceReport';
import { Card } from '@/components/ui/Card';
import styles from './RaceReport.module.css';

export const RaceReport = () => {
  const { sessionKey } = useParams<{ sessionKey: string }>();
  const { report, loading, progress } = useRaceReport(sessionKey || 'latest');

  if (loading) {
    return (
      <div className={styles.container}>
        <Card>
          <div className={styles.loading}>
            <h2>Generating Race Report...</h2>
            <p>{progress}</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={styles.container}>
        <Card>
          <p>No report available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.raceName}>{report.race_name}</h1>
        <p className={styles.meta}>
          {report.country} · {report.date} · {report.year}
        </p>
      </div>

      <Card active>
        <h2 className={styles.headline}>{report.headline}</h2>
        <p className={styles.timestamp}>Generated: {new Date(report.generated_at).toLocaleString()}</p>
      </Card>

      <Card title="Race Story">
        <div className={styles.story}>{report.race_story}</div>
      </Card>

      <Card title="Key Moments">
        <ul className={styles.moments}>
          {report.key_moments.map((moment, i) => (
            <li key={i}>{moment}</li>
          ))}
        </ul>
      </Card>

      <Card title="Podium">
        <div className={styles.podium}>
          {report.podium.map((driver, i) => (
            <div key={i} className={styles.podiumPosition}>
              <span className={styles.position}>P{i + 1}</span>
              <span className={styles.driver}>{driver}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Driver Reports">
        <div className={styles.driverGrid}>
          {Object.entries(report.driver_reports).map(([name, data]) => (
            <div key={name} className={styles.driverCard}>
              <h3>{data.driver_name}</h3>
              <p>P{data.finish_position} (started P{data.start_position})</p>
              <p className={styles.assessment}>{data.assessment}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

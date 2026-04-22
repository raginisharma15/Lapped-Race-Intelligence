import { useState } from 'react';
import { useLiveData } from '@/hooks/useLiveData';
import { useAlerts } from '@/hooks/useAlerts';
import { Card } from '@/components/ui/Card';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const [sessionKey] = useState('latest');
  const { data: laps, loading, error } = useLiveData(sessionKey);
  const { alerts } = useAlerts(sessionKey);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.skeleton}>Loading telemetry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <Card title="Error">
          <p style={{ color: 'var(--color-critical)' }}>{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.grid}>
        <div className={styles.left}>
          <Card title="Driver Standings">
            <p>Standings data: {laps.length} laps loaded</p>
          </Card>
          
          <Card title="Alerts">
            <div className={styles.alertsList}>
              {alerts.slice(0, 8).map((alert, i) => (
                <div key={i} className={styles.alert} data-severity={alert.severity}>
                  <span className={styles.alertCategory}>{alert.category}</span>
                  <span className={styles.alertMessage}>{alert.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <div className={styles.center}>
          <Card title="Lap Time Chart">
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Chart placeholder - {laps.length} laps
            </div>
          </Card>
          
          <Card title="Sector Analysis">
            <div className={styles.sectors}>
              <div>S1</div>
              <div>S2</div>
              <div>S3</div>
            </div>
          </Card>
        </div>
        
        <div className={styles.right}>
          <Card title="Tire Strategy">
            <p>Tire timeline</p>
          </Card>
          
          <Card title="Engine & Battery">
            <p>Gauges</p>
          </Card>
          
          <Card title="Fastest Lap">
            <p>Fastest lap info</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

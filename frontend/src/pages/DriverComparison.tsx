import { Card } from '@/components/ui/Card';
import styles from './DriverComparison.module.css';

export const DriverComparison = () => {
  return (
    <div className={styles.container}>
      <Card title="Driver Comparison">
        <p>Select two drivers to compare their performance</p>
        <div className={styles.selectors}>
          <select>
            <option>Select Driver 1</option>
          </select>
          <select>
            <option>Select Driver 2</option>
          </select>
        </div>
      </Card>
      
      <div className={styles.comparison}>
        <Card title="Lap Times">
          <p>Lap time comparison chart</p>
        </Card>
        
        <Card title="Sector Analysis">
          <p>Sector breakdown</p>
        </Card>
      </div>
    </div>
  );
};

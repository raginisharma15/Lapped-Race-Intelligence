import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import styles from './RaceHistory.module.css';

export const RaceHistory = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const years = [2023, 2024, 2025];

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {years.map((year) => (
          <button
            key={year}
            className={year === selectedYear ? styles.tabActive : styles.tab}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <h3 className={styles.raceName}>Race {i}</h3>
            <p className={styles.location}>Circuit Name</p>
            <p className={styles.date}>Date TBD</p>
            <button className={styles.viewButton}>View Report</button>
          </Card>
        ))}
      </div>
    </div>
  );
};

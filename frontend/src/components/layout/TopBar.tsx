import { useState } from 'react';
import styles from './TopBar.module.css';

export const TopBar = () => {
  const [sessionKey, setSessionKey] = useState('latest');

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <span className={styles.wordmark}>LAPPED</span>
      </div>
      
      <div className={styles.center}>
        <span className={styles.sessionName}>ABU DHABI GP · RACE</span>
      </div>
      
      <div className={styles.right}>
        <div className={styles.liveStatus}>
          <div className={styles.liveDot}></div>
          <span>LIVE</span>
        </div>
        
        <input
          type="text"
          value={sessionKey}
          onChange={(e) => setSessionKey(e.target.value)}
          placeholder="Session Key"
          className={styles.sessionInput}
        />
      </div>
    </header>
  );
};

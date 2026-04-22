import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Landing.module.css';

export const Landing = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing race systems...');

  useEffect(() => {
    // Simulate initialization sequence
    const steps = [
      { progress: 20, text: 'Loading telemetry modules...', delay: 300 },
      { progress: 40, text: 'Connecting to OpenF1 API...', delay: 500 },
      { progress: 60, text: 'Initializing AI engine...', delay: 400 },
      { progress: 80, text: 'Preparing dashboard...', delay: 400 },
      { progress: 100, text: 'Ready!', delay: 300 },
    ];

    let currentStep = 0;

    const runStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setProgress(step.progress);
        setStatusText(step.text);
        currentStep++;
        setTimeout(runStep, step.delay);
      } else {
        // Initialization complete - navigate to 3D landing
        setTimeout(() => {
          navigate('/landing-3d');
        }, 500);
      }
    };

    runStep();
  }, [navigate]);

  return (
    <div className={styles.initializing}>
      <div className={styles.initContent}>
        <h1 className={styles.initTitle}>LAPPED</h1>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={styles.statusText}>{statusText}</p>
      </div>
    </div>
  );
};

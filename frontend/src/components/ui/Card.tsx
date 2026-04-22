import { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
  action?: ReactNode;
}

export const Card = ({ title, children, active, className, action }: CardProps) => {
  return (
    <div className={`${styles.card} ${active ? styles.cardActive : ''} ${className || ''}`}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {action}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
};

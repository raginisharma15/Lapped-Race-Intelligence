import { NavLink } from 'react-router-dom';
import { Radio, FileText, Users, Clock } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>LAPPED</div>
      
      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <Radio size={20} />
          <span>Live Dashboard</span>
        </NavLink>
        
        <NavLink to="/report/latest" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <FileText size={20} />
          <span>Race Report</span>
        </NavLink>
        
        <NavLink to="/compare" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <Users size={20} />
          <span>Driver Comparison</span>
        </NavLink>
        
        <NavLink to="/history" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <Clock size={20} />
          <span>Race History</span>
        </NavLink>
      </nav>
      
      <div className={styles.status}>
        <div className={styles.statusDot}></div>
        <span>Backend: Connected</span>
      </div>
    </aside>
  );
};

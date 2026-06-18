'use client';

import React from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={`${styles.tabsContainer} ${className || ''}`}>
      <div className={styles.tabsList}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span className={styles.label}>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`${styles.badge} ${isActive ? styles.activeBadge : ''}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

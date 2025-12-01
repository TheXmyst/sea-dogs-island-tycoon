import React from 'react';
import './Navigation.css';

export default function Navigation({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'island', label: 'Island', icon: '🏝️', shortLabel: 'Island' },
    { id: 'fleet', label: 'Fleet', icon: '⚓', shortLabel: 'Fleet' },
    { id: 'technology', label: 'Tech', icon: '🔬', shortLabel: 'Tech' },
    { id: 'crew', label: 'Crew', icon: '👥', shortLabel: 'Crew' },
    { id: 'captains', label: 'Captains', icon: '⭐', shortLabel: 'Captains' },
    { id: 'recruitment', label: 'Recruit', icon: '🎰', shortLabel: 'Recruit' },
    { id: 'events', label: 'Events', icon: '📅', shortLabel: 'Events' },
    { id: 'battle', label: 'Battle', icon: '⚔️', shortLabel: 'Battle' },
    { id: 'alliance', label: 'Alliance', icon: '🤝', shortLabel: 'Alliance' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', shortLabel: 'Rank' },
    { id: 'system', label: 'System', icon: '📋', shortLabel: 'System' },
  ];
  
  return (
    <nav className="navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          title={tab.label}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}


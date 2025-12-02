import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './Navigation.css';

export default function Navigation({ currentTab, onTabChange }) {
  const { t } = useTranslation();
  
  const tabs = [
    { id: 'island', icon: '🏝️', labelKey: 'nav.island', shortLabelKey: 'nav.islandShort' },
    { id: 'fleet', icon: '⚓', labelKey: 'nav.fleet', shortLabelKey: 'nav.fleetShort' },
    { id: 'technology', icon: '🔬', labelKey: 'nav.technology', shortLabelKey: 'nav.technologyShort' },
    { id: 'crew', icon: '👥', labelKey: 'nav.crew', shortLabelKey: 'nav.crewShort' },
    { id: 'captains', icon: '⭐', labelKey: 'nav.captains', shortLabelKey: 'nav.captainsShort' },
    { id: 'recruitment', icon: '🎰', labelKey: 'nav.recruitment', shortLabelKey: 'nav.recruitmentShort' },
    { id: 'events', icon: '📅', labelKey: 'nav.events', shortLabelKey: 'nav.eventsShort' },
    { id: 'sea', icon: '🌊', labelKey: 'nav.sea', shortLabelKey: 'nav.seaShort' },
    { id: 'alliance', icon: '🤝', labelKey: 'nav.alliance', shortLabelKey: 'nav.allianceShort' },
    { id: 'leaderboard', icon: '🏆', labelKey: 'nav.leaderboard', shortLabelKey: 'nav.leaderboardShort' },
    { id: 'system', icon: '📋', labelKey: 'nav.system', shortLabelKey: 'nav.systemShort' },
  ];
  
  return (
    <nav className="navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${currentTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          title={t(tab.labelKey)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{t(tab.shortLabelKey)}</span>
        </button>
      ))}
    </nav>
  );
}


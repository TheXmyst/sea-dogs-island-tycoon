import React from 'react';
import './ResourceHUD.css';

const RESOURCE_ICONS = {
  gold: '💰',
  wood: '🪵',
  rum: '🍺',
  stone: '🪨',
  food: '🍖',
  crew: '👥',
  cannons: '💣',
  diamonds: '💎',
  fragments: '🎫',
};

const RESOURCE_COLORS = {
  gold: 'var(--color-gold)',
  wood: 'var(--color-wood)',
  rum: 'var(--color-rum)',
  stone: 'var(--color-stone)',
  food: 'var(--color-food)',
  crew: 'var(--color-crew)',
  cannons: 'var(--color-cannon)',
  diamonds: '#b19cd9', // Purple for premium
  fragments: '#ffd700', // Gold for special currency
};

export default function ResourceHUD({ resources }) {
  return (
    <div className="resource-hud">
      {Object.keys(resources).map(resource => (
        <div key={resource} className="resource-item" style={{ '--resource-color': RESOURCE_COLORS[resource] }}>
          <span className="resource-icon">{RESOURCE_ICONS[resource] || '📦'}</span>
          <span className="resource-name">{resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
          <span className="resource-value">{Math.floor(resources[resource] || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}


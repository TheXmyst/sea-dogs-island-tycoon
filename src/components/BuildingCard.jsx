import React from 'react';
import { getBuildingConfig, checkPrerequisites } from '../config/buildings';
import { hasResources } from '../utils/gameState';
import { useTranslation } from '../i18n/LanguageContext';
import BuildingSprite from './BuildingSprite';
import './BuildingCard.css';

export default function BuildingCard({ building, onClick, gameState }) {
  const { t } = useTranslation();
  const config = getBuildingConfig(building.id);
  if (!config) return null;
  
  const cost = config.costs[0] || {};
  const canAfford = hasResources(gameState.resources, cost);
  const hasPrereq = checkPrerequisites(building.id, gameState);
  const canBuild = canAfford && hasPrereq;
  
  return (
    <div 
      className={`building-card ${canBuild ? '' : 'disabled'}`}
      onClick={canBuild ? onClick : undefined}
    >
      <div className="building-card-header">
        <BuildingSprite
          buildingId={building.id}
          level={1}
          icon={config.icon}
          className="building-card-icon"
        />
        <div>
          <div className="building-card-name">{t(`buildings.items.${building.id}.name`, config.name)}</div>
          <div className="building-card-description">{t(`buildings.items.${building.id}.description`, config.description)}</div>
        </div>
      </div>
      
      <div className="building-card-cost">
        {Object.keys(cost).map(resource => (
          <div key={resource} className="cost-item">
            <span className="cost-icon">{getResourceIcon(resource)}</span>
            <span className={gameState.resources[resource] >= cost[resource] ? '' : 'insufficient'}>
              {cost[resource]}
            </span>
          </div>
        ))}
      </div>
      
      {!hasPrereq && (
        <div className="building-card-error">{t('buildings.prerequisitesNotMet')}</div>
      )}
    </div>
  );
}

function getResourceIcon(resource) {
  const icons = {
    gold: '💰',
    wood: '🪵',
    rum: '🍺',
    stone: '🪨',
    food: '🍖',
    crew: '👥',
    cannons: '💣',
  };
  return icons[resource] || '📦';
}


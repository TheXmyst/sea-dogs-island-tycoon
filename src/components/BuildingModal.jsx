import React, { useEffect, useState } from 'react';
import { getBuildingConfig } from '../config/buildings';
import { hasResources } from '../utils/gameState';
import { getBuildingTechnologyBonus } from '../utils/technologyBuffs';
import './BuildingModal.css';

export default function BuildingModal({ building, gameState, onClose, onUpgrade }) {
  const config = getBuildingConfig(building.type);
  if (!config) return null;
  
  const [timer, setTimer] = useState(null);
  
  useEffect(() => {
    if (!building.isConstructing) return;
    
    const timerData = gameState.timers.buildings[building.id];
    if (!timerData) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, timerData.endTime - now);
      setTimer(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [building, gameState.timers]);
  
  const currentLevel = building.level;
  const maxLevel = config.maxLevel;
  const canUpgrade = currentLevel < maxLevel && !building.isConstructing;
  
  // For level 0 buildings under construction, show no production
  const baseProduction = currentLevel > 0 ? (config.production[currentLevel - 1] || {}) : {};
  const nextBaseProduction = canUpgrade && currentLevel > 0 ? config.production[currentLevel] : null;
  
  // Apply technology bonuses
  const techBonus = getBuildingTechnologyBonus(building.type, gameState);
  
  // Calculate production with technology bonus
  const production = {};
  Object.keys(baseProduction).forEach(resource => {
    const baseValue = baseProduction[resource];
    production[resource] = Math.floor(baseValue * (1 + techBonus.production));
  });
  
  const nextProduction = nextBaseProduction ? {} : null;
  if (nextBaseProduction) {
    Object.keys(nextBaseProduction).forEach(resource => {
      const baseValue = nextBaseProduction[resource];
      nextProduction[resource] = Math.floor(baseValue * (1 + techBonus.production));
    });
  }
  
  const upgradeCost = canUpgrade && currentLevel > 0 ? config.costs[currentLevel] : null;
  const canAffordUpgrade = upgradeCost ? hasResources(gameState.resources, upgradeCost) : false;
  
  const buildTime = canUpgrade ? config.buildTimes[currentLevel] : null;
  const timerData = gameState.timers.buildings[building.id];
  const progress = timerData && building.isConstructing 
    ? Math.max(0, Math.min(100, ((timerData.endTime - Date.now()) / (timerData.endTime - timerData.startTime)) * 100))
    : null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{config.icon} {config.name}</h2>
            <p className="modal-level">Level {currentLevel} / {maxLevel}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">{config.description}</p>
          
          {building.isConstructing && progress !== null && (
            <div className="construction-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
              <div className="progress-text">
                {Math.ceil((timer || 0) / 1000)}s remaining
              </div>
            </div>
          )}
          
          <div className="modal-section">
            <h3>Current Production</h3>
            <div className="production-list">
              {Object.keys(production).length > 0 ? (
                <>
                  {Object.keys(production).map(resource => {
                    const baseValue = baseProduction[resource] || 0;
                    const bonusValue = production[resource] - baseValue;
                    const bonusPercentage = baseValue > 0 ? Math.round((bonusValue / baseValue) * 100) : 0;
                    return (
                      <div key={resource} className="production-item">
                        <span>{getResourceIcon(resource)}</span>
                        <span>
                          {production[resource]} / tick
                          {bonusValue > 0 && (
                            <span className="tech-bonus" title={`Base: ${baseValue} + Tech bonus: +${bonusValue} (+${bonusPercentage}%)`}>
                              {' '}(+{bonusValue} tech)
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {techBonus.production > 0 && (
                    <div className="tech-bonus-info">
                      ⚡ Technology bonus: +{Math.round(techBonus.production * 100)}% production
                    </div>
                  )}
                </>
              ) : (
                <span className="no-production">No production</span>
              )}
            </div>
          </div>
          
          {canUpgrade && (
            <div className="modal-section">
              <h3>Upgrade to Level {currentLevel + 1}</h3>
              
              {nextProduction && Object.keys(nextProduction).length > 0 && (
                <div className="upgrade-preview">
                  <div className="upgrade-production">
                    <span>New Production:</span>
                    {Object.keys(nextProduction).map(resource => {
                      const nextBaseValue = nextBaseProduction[resource] || 0;
                      const nextBonusValue = nextProduction[resource] - nextBaseValue;
                      const nextBonusPercentage = nextBaseValue > 0 ? Math.round((nextBonusValue / nextBaseValue) * 100) : 0;
                      return (
                        <div key={resource} className="production-item">
                          <span>{getResourceIcon(resource)}</span>
                          <span>
                            {nextProduction[resource]} / tick
                            {nextBonusValue > 0 && (
                              <span className="tech-bonus" title={`Base: ${nextBaseValue} + Tech bonus: +${nextBonusValue} (+${nextBonusPercentage}%)`}>
                                {' '}(+{nextBonusValue} tech)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="upgrade-cost">
                <span>Cost:</span>
                {Object.keys(upgradeCost).map(resource => (
                  <div key={resource} className={`cost-item ${gameState.resources[resource] >= upgradeCost[resource] ? '' : 'insufficient'}`}>
                    <span>{getResourceIcon(resource)}</span>
                    <span>{upgradeCost[resource]}</span>
                  </div>
                ))}
              </div>
              
              {buildTime && (
                <div className="build-time">
                  Build Time: {formatTime(buildTime)}
                </div>
              )}
              
              <button
                className="upgrade-button"
                onClick={() => {
                  onUpgrade(building.id);
                  onClose();
                }}
                disabled={!canAffordUpgrade || building.isConstructing}
              >
                Upgrade
              </button>
            </div>
          )}
          
          {!canUpgrade && (
            <div className="modal-section">
              <p className="max-level">Building is at maximum level!</p>
            </div>
          )}
        </div>
      </div>
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

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}


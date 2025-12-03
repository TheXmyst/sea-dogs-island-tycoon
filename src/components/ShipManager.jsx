import React, { useState, useEffect } from 'react';
import { SHIPS, getShipConfig, calculateRepairCost } from '../config/ships';
import { hasResources, deductResources, addResources } from '../utils/gameState';
import { useTranslation } from '../i18n/LanguageContext';
import './ShipManager.css';

export default function ShipManager({ gameState, onBuildShip, onRepairShip, onSelectShip }) {
  const { t } = useTranslation();
  const [selectedShipType, setSelectedShipType] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  
  const availableShips = Object.values(SHIPS);
  const playerShips = gameState.ships || [];
  
  const canBuildShip = (shipType) => {
    const config = getShipConfig(shipType);
    if (!config) return false;
    
    // Check if dock is built
    const dock = gameState.buildings.find(b => b.type === 'dock' && !b.isConstructing);
    if (!dock) return false;
    
    return hasResources(gameState.resources, config.cost);
  };
  
  const handleBuildShip = (shipType) => {
    if (canBuildShip(shipType)) {
      onBuildShip(shipType);
    }
  };
  
  const handleRepairShip = (ship) => {
    const config = getShipConfig(ship.type);
    if (!config) return;
    
    const repairCost = calculateRepairCost(ship, config);
    if (hasResources(gameState.resources, repairCost)) {
      onRepairShip(ship.id, repairCost);
    }
  };
  
  return (
    <div className="ship-manager">
      <div className="ship-manager-header">
        <h2>⚓ {t('ships.fleetManagement')}</h2>
        <p>{t('ships.buildAndManage')}</p>
      </div>
      
      {gameState.buildings.find(b => b.type === 'dock' && !b.isConstructing) ? (
        <>
          <div className="ship-build-section">
            <h3>{t('ships.buildNewShip')}</h3>
            <div className="ship-list">
              {availableShips.map(ship => {
                const canBuild = canBuildShip(ship.id);
                const timer = gameState.timers.ships[`building_${ship.id}`];
                const isBuilding = timer && timer.endTime > Date.now();
                
                return (
                  <div key={ship.id} className={`ship-card ${canBuild && !isBuilding ? '' : 'disabled'}`}>
                    <div className="ship-card-header">
                      <span className="ship-icon">{ship.icon}</span>
                      <div>
                        <div className="ship-name">{t(`ships.items.${ship.id}.name`, ship.name)}</div>
                        <div className="ship-description">{t(`ships.items.${ship.id}.description`, ship.description)}</div>
                      </div>
                    </div>
                    
                    <div className="ship-stats">
                      <div className="stat-item">
                        <span>⚡ {t('ships.speed')}:</span>
                        <span>{ship.stats.speed}</span>
                      </div>
                      <div className="stat-item">
                        <span>❤️ {t('ships.health')}:</span>
                        <span>{ship.stats.hp}</span>
                      </div>
                      <div className="stat-item">
                        <span>⚔️ {t('ships.attack')}:</span>
                        <span>{ship.stats.attack}</span>
                      </div>
                      <div className="stat-item">
                        <span>🛡️ {t('ships.defense')}:</span>
                        <span>{ship.stats.defense}</span>
                      </div>
                    </div>
                    
                    <div className="ship-cost">
                      {Object.keys(ship.cost).map(resource => (
                        <div key={resource} className={`cost-item ${gameState.resources[resource] >= ship.cost[resource] ? '' : 'insufficient'}`}>
                          <span>{getResourceIcon(resource)}</span>
                          <span>{ship.cost[resource]}</span>
                        </div>
                      ))}
                    </div>
                    
                    {isBuilding && (
                      <div className="ship-building-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${Math.max(0, Math.min(100, ((timer.endTime - Date.now()) / (timer.endTime - timer.startTime)) * 100))}%` 
                            }}
                          />
                        </div>
                        <div className="progress-text">
                          {t('buildings.constructing')} {Math.ceil((timer.endTime - Date.now()) / 1000)}s
                        </div>
                      </div>
                    )}
                    
                    <button
                      className="build-ship-button"
                      onClick={() => handleBuildShip(ship.id)}
                      disabled={!canBuild || isBuilding}
                    >
                      {isBuilding ? t('buildings.constructing') : t('ships.buildShip')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="ship-fleet-section">
            <h3>{t('ships.yourFleet')} ({playerShips.length})</h3>
            {playerShips.length === 0 ? (
              <div className="no-ships">{t('ships.noShips')}</div>
            ) : (
              <div className="fleet-list">
                {playerShips.map(ship => {
                  const config = getShipConfig(ship.type);
                  const hpPercent = (ship.hp / ship.maxHp) * 100;
                  const needsRepair = ship.hp < ship.maxHp;
                  const repairCost = needsRepair ? calculateRepairCost(ship, config) : null;
                  const canRepair = repairCost && hasResources(gameState.resources, repairCost);
                  
                  return (
                    <div 
                      key={ship.id} 
                      className={`fleet-ship-card ${selectedShip?.id === ship.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedShip(ship);
                        onSelectShip(ship);
                      }}
                    >
                      <div className="fleet-ship-header">
                        <span className="ship-icon">{config.icon}</span>
                        <div>
                          <div className="ship-name">{t(`ships.items.${ship.type}.name`, config.name)}</div>
                          <div className="ship-id">ID: {ship.id.slice(0, 8)}</div>
                        </div>
                      </div>
                      
                      <div className="ship-hp-bar">
                        <div className="hp-bar-fill" style={{ width: `${hpPercent}%` }} />
                        <div className="hp-bar-text">
                          {Math.ceil(ship.hp)} / {ship.maxHp} {t('ships.health')}
                        </div>
                      </div>
                      
                      {needsRepair && (
                        <div className="ship-repair-section">
                          <div className="repair-cost">
                            {t('ships.repairCost')}:
                            {Object.keys(repairCost).map(resource => (
                              <span key={resource} className={canRepair ? '' : 'insufficient'}>
                                {getResourceIcon(resource)} {repairCost[resource]}
                              </span>
                            ))}
                          </div>
                          <button
                            className="repair-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRepairShip(ship);
                            }}
                            disabled={!canRepair}
                          >
                            {t('ships.repairShip')}
                          </button>
                        </div>
                      )}
                      
                      {ship.hp === ship.maxHp && (
                        <div className="ship-ready">{t('ships.readyForBattle')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="dock-required">
          <p>{t('ships.dockRequired')}</p>
          <p>{t('ships.upgradeTownHall')}</p>
        </div>
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


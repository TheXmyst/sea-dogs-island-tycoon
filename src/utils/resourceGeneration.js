/**
 * Passive resource generation system
 * Ticks every 5-10 seconds
 */

import { applyProductionBonus } from './captainBuffs';
import { applyTechnologyProductionBonus } from './technologyBuffs';

const TICK_INTERVAL = 8000; // 8 seconds

/**
 * Process resource generation from buildings
 */
export function processResourceGeneration(gameState, buildingsConfig) {
  const now = Date.now();
  const timeSinceLastUpdate = (now - gameState.lastUpdate) / 1000; // seconds
  const ticks = Math.floor(timeSinceLastUpdate / (TICK_INTERVAL / 1000));
  
  if (ticks === 0) return gameState;
  
  const newResources = { ...gameState.resources };
  
  // Process each building's production
  gameState.buildings.forEach(building => {
    if (building.isConstructing) return;
    
    const config = buildingsConfig[building.type.toUpperCase().replace(/-/g, '_')];
    if (!config || !config.production) return;
    
    const baseProduction = config.production[building.level - 1] || {};
    
    // Apply captain buffs and technology bonuses to production
    const production = {};
    Object.keys(baseProduction).forEach(resource => {
      let value = baseProduction[resource];
      // Apply technology bonus first
      value = applyTechnologyProductionBonus(value, building.type, gameState);
      // Then apply captain buffs
      value = applyProductionBonus(value, gameState);
      production[resource] = value;
    });
    
    // Apply production for each tick
    for (let i = 0; i < ticks; i++) {
      Object.keys(production).forEach(resource => {
        newResources[resource] = (newResources[resource] || 0) + (production[resource] || 0);
      });
    }
  });
  
  return {
    ...gameState,
    resources: newResources,
    lastUpdate: now,
  };
}

/**
 * Get time until next resource tick
 */
export function getTimeUntilNextTick(gameState) {
  const now = Date.now();
  const timeSinceLastUpdate = (now - gameState.lastUpdate) / 1000;
  const timeUntilNextTick = (TICK_INTERVAL / 1000) - (timeSinceLastUpdate % (TICK_INTERVAL / 1000));
  return Math.max(0, timeUntilNextTick);
}


/**
 * Captain buffs integration system
 * Applies captain bonuses to gameplay mechanics
 */

import { getCaptainConfig } from '../config/captains';

/**
 * Calculate total buffs from all active captains
 */
export function calculateTotalBuffs(gameState) {
  const captains = gameState.captains || [];
  const totalBuffs = {
    shipAttack: 0,
    shipDefense: 0,
    shipHP: 0,
    shipSpeed: 0,
    buildTimeReduction: 0,
    resourceProduction: 0,
    storageBonus: 0,
    lootBonus: 0,
    missionSpeed: 0,
  };
  
  captains.forEach(captain => {
    const config = getCaptainConfig(captain.id);
    if (!config) return;
    
    // Calculate level multiplier
    const levelMultiplier = 1 + (captain.level - 1) * 0.05;
    
    // Apply buffs
    Object.keys(config.buffs).forEach(buffKey => {
      if (totalBuffs.hasOwnProperty(buffKey)) {
        totalBuffs[buffKey] += config.buffs[buffKey] * levelMultiplier;
      }
    });
  });
  
  return totalBuffs;
}

/**
 * Apply build time reduction from captains
 */
export function applyBuildTimeReduction(baseTime, gameState) {
  const buffs = calculateTotalBuffs(gameState);
  const reduction = buffs.buildTimeReduction;
  return Math.max(1, Math.floor(baseTime * (1 - reduction)));
}

/**
 * Apply resource production bonus from captains
 */
export function applyProductionBonus(baseProduction, gameState) {
  const buffs = calculateTotalBuffs(gameState);
  const bonus = buffs.resourceProduction;
  return Math.floor(baseProduction * (1 + bonus));
}

/**
 * Apply ship stat bonuses from captains
 */
import { getShipTechnologyBonus } from './technologyBuffs';

export function applyShipBuffs(baseStats, gameState) {
  const buffs = calculateTotalBuffs(gameState);
  
  // Apply technology bonuses
  const techBonus = getShipTechnologyBonus(gameState);
  
  return {
    attack: Math.floor(baseStats.attack * (1 + buffs.shipAttack + techBonus.attack)),
    defense: Math.floor(baseStats.defense * (1 + buffs.shipDefense + techBonus.defense)),
    hp: Math.floor(baseStats.hp * (1 + buffs.shipHP)),
    maxHp: Math.floor(baseStats.maxHp * (1 + buffs.shipHP)),
    speed: Math.floor(baseStats.speed * (1 + buffs.shipSpeed + techBonus.speed)),
  };
}

/**
 * Apply loot bonus from captains
 */
export function applyLootBonus(baseLoot, gameState) {
  const buffs = calculateTotalBuffs(gameState);
  const bonus = buffs.lootBonus;
  const bonusLoot = {};
  
  Object.keys(baseLoot).forEach(resource => {
    bonusLoot[resource] = Math.floor(baseLoot[resource] * (1 + bonus));
  });
  
  return bonusLoot;
}


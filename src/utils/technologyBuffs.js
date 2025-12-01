/**
 * Technology buffs system
 * Applies technology effects to buildings, ships, and loot
 * Now supports technology levels
 */

import { TECHNOLOGIES, getTechnologyLevel } from '../config/technology';
import { calculateTechEffectForLevel } from './levelScaling';

/**
 * Get technology bonus for a specific building
 * @param {string} buildingType - Building type (e.g., 'gold_mine')
 * @param {object} gameState - Game state (contains researchedTechnologies)
 * @returns {object} Bonus object with production multiplier
 */
export function getBuildingTechnologyBonus(buildingType, gameState) {
  let productionBonus = 0;
  const researchedTechnologies = gameState.researchedTechnologies || [];
  
  Object.values(TECHNOLOGIES).forEach(tech => {
    if (!tech.effects || !tech.effects.buildingBonus) return;
    
    const buildingBonus = tech.effects.buildingBonus[buildingType];
    if (buildingBonus && buildingBonus.production) {
      // Get technology level
      const techEntry = researchedTechnologies.find(t => 
        (typeof t === 'string' ? t === tech.id : t.id === tech.id)
      );
      const level = techEntry ? (typeof techEntry === 'string' ? 1 : (techEntry.level || 1)) : 0;
      
      if (level > 0) {
        // Calculate bonus based on level
        const baseBonus = buildingBonus.production;
        const perLevelBonus = 0.05; // 5% per level
        const totalBonus = calculateTechEffectForLevel(level, baseBonus, perLevelBonus);
        productionBonus += totalBonus;
      }
    }
  });
  
  return {
    production: productionBonus,
  };
}

/**
 * Get technology bonus for ships
 * @param {object} gameState - Game state (contains researchedTechnologies)
 * @returns {object} Bonus object with attack, defense, speed multipliers
 */
export function getShipTechnologyBonus(gameState) {
  let attackBonus = 0;
  let defenseBonus = 0;
  let speedBonus = 0;
  const researchedTechnologies = gameState.researchedTechnologies || [];
  
  Object.values(TECHNOLOGIES).forEach(tech => {
    if (!tech.effects || !tech.effects.shipBonus) return;
    
    // Get technology level
    const techEntry = researchedTechnologies.find(t => 
      (typeof t === 'string' ? t === tech.id : t.id === tech.id)
    );
    const level = techEntry ? (typeof techEntry === 'string' ? 1 : (techEntry.level || 1)) : 0;
    
    if (level > 0) {
      if (tech.effects.shipBonus.attack) {
        const baseBonus = tech.effects.shipBonus.attack;
        const perLevelBonus = 0.02; // 2% per level
        attackBonus += calculateTechEffectForLevel(level, baseBonus, perLevelBonus);
      }
      if (tech.effects.shipBonus.defense) {
        const baseBonus = tech.effects.shipBonus.defense;
        const perLevelBonus = 0.02; // 2% per level
        defenseBonus += calculateTechEffectForLevel(level, baseBonus, perLevelBonus);
      }
      if (tech.effects.shipBonus.speed) {
        const baseBonus = tech.effects.shipBonus.speed;
        const perLevelBonus = 0.03; // 3% per level
        speedBonus += calculateTechEffectForLevel(level, baseBonus, perLevelBonus);
      }
    }
  });
  
  return {
    attack: attackBonus,
    defense: defenseBonus,
    speed: speedBonus,
  };
}

/**
 * Get technology loot bonus
 * @param {object} gameState - Game state (contains researchedTechnologies)
 * @returns {number} Loot bonus multiplier (e.g., 0.20 for 20%)
 */
export function getLootTechnologyBonus(gameState) {
  let lootBonus = 0;
  const researchedTechnologies = gameState.researchedTechnologies || [];
  
  Object.values(TECHNOLOGIES).forEach(tech => {
    if (!tech.effects || !tech.effects.lootBonus) return;
    
    // Get technology level
    const techEntry = researchedTechnologies.find(t => 
      (typeof t === 'string' ? t === tech.id : t.id === tech.id)
    );
    const level = techEntry ? (typeof techEntry === 'string' ? 1 : (techEntry.level || 1)) : 0;
    
    if (level > 0) {
      const baseBonus = tech.effects.lootBonus;
      const perLevelBonus = 0.04; // 4% per level
      lootBonus += calculateTechEffectForLevel(level, baseBonus, perLevelBonus);
    }
  });
  
  return lootBonus;
}

/**
 * Apply technology bonus to production value
 * @param {number} baseProduction - Base production value
 * @param {string} buildingType - Building type
 * @param {object} gameState - Game state
 * @returns {number} Production with technology bonus applied
 */
export function applyTechnologyProductionBonus(baseProduction, buildingType, gameState) {
  const bonus = getBuildingTechnologyBonus(buildingType, gameState);
  return Math.floor(baseProduction * (1 + bonus.production));
}


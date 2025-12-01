/**
 * Level scaling utilities
 * Generates costs, timers, and effects that scale with level
 */

/**
 * Calculate build/research time for a given level
 * Early levels: seconds, mid levels: minutes, high levels: hours
 * @param {number} level - Current level (1-based)
 * @param {number} baseTime - Base time in seconds for level 1
 * @returns {number} Time in seconds
 */
export function calculateTimeForLevel(level, baseTime = 30) {
  if (level === 1) return baseTime; // Level 1: base time (e.g., 30 seconds)
  if (level <= 5) return baseTime * level; // Levels 2-5: linear (30s, 60s, 90s, 120s, 150s)
  if (level <= 10) return baseTime * 5 + (level - 5) * baseTime * 2; // Levels 6-10: faster growth (200s, 240s, 280s, 320s, 360s)
  if (level <= 20) return baseTime * 15 + (level - 10) * baseTime * 5; // Levels 11-20: minutes (410s, 460s, ... ~10-15 min)
  if (level <= 30) return baseTime * 65 + (level - 20) * baseTime * 10; // Levels 21-30: hours (715s, 815s, ... ~1-2 hours)
  
  // Beyond level 30: exponential growth
  return baseTime * 165 + Math.pow(level - 30, 1.5) * baseTime * 20;
}

/**
 * Calculate cost for a given level
 * @param {number} level - Current level (1-based)
 * @param {object} baseCost - Base cost object (e.g., { gold: 100, wood: 50 })
 * @param {number} multiplier - Cost multiplier per level (default: 1.5)
 * @returns {object} Cost object for this level
 */
export function calculateCostForLevel(level, baseCost, multiplier = 1.5) {
  const costMultiplier = Math.pow(multiplier, level - 1);
  const cost = {};
  
  Object.keys(baseCost).forEach(resource => {
    cost[resource] = Math.floor(baseCost[resource] * costMultiplier);
  });
  
  return cost;
}

/**
 * Calculate production for a given level
 * @param {number} level - Current level (1-based)
 * @param {object} baseProduction - Base production object (e.g., { gold: 5 })
 * @param {number} multiplier - Production multiplier per level (default: 1.3)
 * @returns {object} Production object for this level
 */
export function calculateProductionForLevel(level, baseProduction, multiplier = 1.3) {
  const productionMultiplier = Math.pow(multiplier, level - 1);
  const production = {};
  
  Object.keys(baseProduction).forEach(resource => {
    production[resource] = Math.floor(baseProduction[resource] * productionMultiplier);
  });
  
  return production;
}

/**
 * Calculate technology effect bonus for a given level
 * @param {number} level - Current technology level (1-based)
 * @param {number} baseBonus - Base bonus (e.g., 0.25 for 25%)
 * @param {number} perLevelBonus - Additional bonus per level (default: 0.05 for 5% per level)
 * @returns {number} Total bonus multiplier
 */
export function calculateTechEffectForLevel(level, baseBonus, perLevelBonus = 0.05) {
  return baseBonus + (level - 1) * perLevelBonus;
}

/**
 * Generate costs array for levels 1 to maxLevel
 * @param {number} maxLevel - Maximum level
 * @param {object} baseCost - Base cost for level 1
 * @param {number} multiplier - Cost multiplier per level
 * @returns {Array} Array of cost objects
 */
export function generateCostsArray(maxLevel, baseCost, multiplier = 1.5) {
  const costs = [];
  for (let level = 1; level <= maxLevel; level++) {
    costs.push(calculateCostForLevel(level, baseCost, multiplier));
  }
  return costs;
}

/**
 * Generate build times array for levels 1 to maxLevel
 * @param {number} maxLevel - Maximum level
 * @param {number} baseTime - Base time in seconds for level 1
 * @returns {Array} Array of times in seconds
 */
export function generateBuildTimesArray(maxLevel, baseTime = 30) {
  const times = [];
  for (let level = 1; level <= maxLevel; level++) {
    times.push(calculateTimeForLevel(level, baseTime));
  }
  return times;
}

/**
 * Generate production array for levels 1 to maxLevel
 * @param {number} maxLevel - Maximum level
 * @param {object} baseProduction - Base production for level 1
 * @param {number} multiplier - Production multiplier per level
 * @returns {Array} Array of production objects
 */
export function generateProductionArray(maxLevel, baseProduction, multiplier = 1.3) {
  const production = [];
  for (let level = 1; level <= maxLevel; level++) {
    production.push(calculateProductionForLevel(level, baseProduction, multiplier));
  }
  return production;
}


/**
 * Technology/Research Tree
 * Unlocks new buildings, ships, and abilities
 * Technologies now support levels (up to maxLevel)
 */

import { calculateCostForLevel, calculateTimeForLevel } from '../utils/levelScaling';

export const TECH_BRANCH = {
  ECONOMY: 'economy',
  MILITARY: 'military',
  EXPLORATION: 'exploration',
};

/**
 * Technology definitions
 */
export const TECHNOLOGIES = {
  // Economy Branch
  ADVANCED_MINING: {
    id: 'advanced_mining',
    name: 'Advanced Mining',
    description: 'Increases gold mine production. Each level adds 5% bonus.',
    branch: TECH_BRANCH.ECONOMY,
    icon: '⛏️',
    maxLevel: 10,
    baseCost: {
      gold: 500,
      stone: 200,
    },
    baseResearchTime: 30, // seconds for level 1
    prerequisites: [],
    unlocks: [],
    effects: {
      buildingBonus: {
        gold_mine: {
          production: 0.25, // Base 25%, +5% per level
        },
      },
    },
  },
  LUMBER_EFFICIENCY: {
    id: 'lumber_efficiency',
    name: 'Lumber Efficiency',
    description: 'Increases lumber mill production. Each level adds 5% bonus.',
    branch: TECH_BRANCH.ECONOMY,
    icon: '🪵',
    maxLevel: 10,
    baseCost: {
      gold: 400,
      wood: 300,
    },
    baseResearchTime: 30,
    prerequisites: [],
    unlocks: [],
    effects: {
      buildingBonus: {
        lumber_mill: {
          production: 0.25, // Base 25%, +5% per level
        },
      },
    },
  },
  SHIPBUILDING: {
    id: 'shipbuilding',
    name: 'Shipbuilding',
    description: 'Unlocks the ability to build ships. Level 1 unlocks dock.',
    branch: TECH_BRANCH.ECONOMY,
    icon: '⚓',
    maxLevel: 10,
    baseCost: {
      gold: 1000,
      wood: 500,
      stone: 300,
    },
    baseResearchTime: 60, // 1 minute for level 1
    prerequisites: [],
    unlocks: ['dock'], // Unlocked at level 1
    effects: {},
  },
  ADVANCED_SHIPBUILDING: {
    id: 'advanced_shipbuilding',
    name: 'Advanced Shipbuilding',
    description: 'Unlocks Brigantine and Galleon construction. Level 1 unlocks ships.',
    branch: TECH_BRANCH.ECONOMY,
    icon: '🚢',
    maxLevel: 10,
    baseCost: {
      gold: 2000,
      wood: 1000,
      stone: 500,
    },
    baseResearchTime: 120, // 2 minutes for level 1
    prerequisites: ['shipbuilding'],
    unlocks: ['brigantine', 'galleon'], // Unlocked at level 1
    effects: {},
  },
  
  // Military Branch
  COMBAT_TACTICS: {
    id: 'combat_tactics',
    name: 'Combat Tactics',
    description: 'Increases ship attack. Each level adds 2% bonus.',
    branch: TECH_BRANCH.MILITARY,
    icon: '⚔️',
    maxLevel: 10,
    baseCost: {
      gold: 600,
      food: 200,
    },
    baseResearchTime: 30,
    prerequisites: [],
    unlocks: [],
    effects: {
      shipBonus: {
        attack: 0.10, // Base 10%, +2% per level
      },
    },
  },
  NAVAL_DEFENSE: {
    id: 'naval_defense',
    name: 'Naval Defense',
    description: 'Increases ship defense. Each level adds 2% bonus.',
    branch: TECH_BRANCH.MILITARY,
    icon: '🛡️',
    maxLevel: 10,
    baseCost: {
      gold: 600,
      stone: 200,
    },
    baseResearchTime: 30,
    prerequisites: [],
    unlocks: [],
    effects: {
      shipBonus: {
        defense: 0.10, // Base 10%, +2% per level
      },
    },
  },
  CREW_TRAINING: {
    id: 'crew_training',
    name: 'Crew Training',
    description: 'Unlocks specialized crew recruitment. Level 1 unlocks crew types.',
    branch: TECH_BRANCH.MILITARY,
    icon: '👥',
    maxLevel: 10,
    baseCost: {
      gold: 800,
      rum: 300,
      food: 200,
    },
    baseResearchTime: 60,
    prerequisites: [],
    unlocks: ['specialized_crew'], // Unlocked at level 1
    effects: {},
  },
  CANNON_MASTERY: {
    id: 'cannon_mastery',
    name: 'Cannon Mastery',
    description: 'Unlocks cannon production and increases ship firepower. Each level adds 3% attack.',
    branch: TECH_BRANCH.MILITARY,
    icon: '💣',
    maxLevel: 10,
    baseCost: {
      gold: 1500,
      stone: 500,
      wood: 300,
    },
    baseResearchTime: 120,
    prerequisites: ['combat_tactics'],
    unlocks: ['cannon_production'], // Unlocked at level 1
    effects: {
      shipBonus: {
        attack: 0.15, // Base 15%, +3% per level
      },
    },
  },
  
  // Exploration Branch
  NAVIGATION: {
    id: 'navigation',
    name: 'Navigation',
    description: 'Increases ship speed. Each level adds 3% bonus.',
    branch: TECH_BRANCH.EXPLORATION,
    icon: '🧭',
    maxLevel: 10,
    baseCost: {
      gold: 500,
      wood: 300,
    },
    baseResearchTime: 30,
    prerequisites: [],
    unlocks: [],
    effects: {
      shipBonus: {
        speed: 0.15, // Base 15%, +3% per level
      },
    },
  },
  TREASURE_HUNTING: {
    id: 'treasure_hunting',
    name: 'Treasure Hunting',
    description: 'Increases loot rewards from battles. Each level adds 4% bonus.',
    branch: TECH_BRANCH.EXPLORATION,
    icon: '🗺️',
    maxLevel: 10,
    baseCost: {
      gold: 700,
      rum: 200,
    },
    baseResearchTime: 30,
    prerequisites: [],
    unlocks: [],
    effects: {
      lootBonus: 0.20, // Base 20%, +4% per level
    },
  },
  EXPEDITION_LEADERSHIP: {
    id: 'expedition_leadership',
    name: 'Expedition Leadership',
    description: 'Unlocks advanced exploration missions. Level 1 unlocks missions.',
    branch: TECH_BRANCH.EXPLORATION,
    icon: '🏴‍☠️',
    maxLevel: 10,
    baseCost: {
      gold: 1200,
      food: 300,
      rum: 250,
    },
    baseResearchTime: 180, // 3 minutes for level 1
    prerequisites: ['navigation', 'treasure_hunting'],
    unlocks: ['advanced_missions'], // Unlocked at level 1
    effects: {},
  },
};

/**
 * Get technology config by ID
 */
export function getTechnologyConfig(techId) {
  return TECHNOLOGIES[techId.toUpperCase().replace(/-/g, '_')] || null;
}

/**
 * Get cost for a technology at a specific level
 * @param {string} techId - Technology ID
 * @param {number} level - Technology level (1-based)
 * @returns {object|null} Cost object or null if invalid
 */
export function getTechnologyCost(techId, level) {
  const tech = getTechnologyConfig(techId);
  if (!tech || !tech.baseCost) return null;
  
  return calculateCostForLevel(level, tech.baseCost, 1.5);
}

/**
 * Get research time for a technology at a specific level
 * @param {string} techId - Technology ID
 * @param {number} level - Technology level (1-based)
 * @returns {number|null} Research time in seconds or null if invalid
 */
export function getTechnologyResearchTime(techId, level) {
  const tech = getTechnologyConfig(techId);
  if (!tech || !tech.baseResearchTime) return null;
  
  return calculateTimeForLevel(level, tech.baseResearchTime);
}

/**
 * Get technology level from gameState
 * @param {string} techId - Technology ID
 * @param {object} gameState - Game state
 * @returns {number} Technology level (0 if not researched)
 */
export function getTechnologyLevel(techId, gameState) {
  const researched = gameState.researchedTechnologies || [];
  const techEntry = researched.find(t => 
    (typeof t === 'string' ? t === techId : t.id === techId)
  );
  
  if (!techEntry) return 0;
  if (typeof techEntry === 'string') return 1; // Legacy: just ID means level 1
  return techEntry.level || 1;
}

/**
 * Check if technology is researched (at any level)
 * @param {string} techId - Technology ID
 * @param {object} gameState - Game state
 * @returns {boolean}
 */
export function isTechnologyResearched(techId, gameState) {
  return getTechnologyLevel(techId, gameState) > 0;
}

/**
 * Get technologies by branch
 */
export function getTechnologiesByBranch(branch) {
  return Object.values(TECHNOLOGIES).filter(tech => tech.branch === branch);
}

/**
 * Check if technology prerequisites are met
 * For level 1: checks if prerequisites are researched
 * For higher levels: only requires the tech itself to be at previous level
 */
export function checkTechPrerequisites(techId, gameState, targetLevel = null) {
  const tech = getTechnologyConfig(techId);
  if (!tech) return false;
  
  const currentLevel = getTechnologyLevel(techId, gameState);
  const level = targetLevel || (currentLevel === 0 ? 1 : currentLevel + 1);
  
  // For level 1, check prerequisites
  if (level === 1 && tech.prerequisites.length > 0) {
    return tech.prerequisites.every(prereqId => isTechnologyResearched(prereqId, gameState));
  }
  
  // For higher levels, only need previous level
  if (level > 1) {
    return currentLevel >= (level - 1);
  }
  
  return true;
}

/**
 * Get available technologies (prerequisites met, can be researched or upgraded)
 */
export function getAvailableTechnologies(gameState) {
  return Object.values(TECHNOLOGIES).filter(tech => {
    return checkTechPrerequisites(tech.id, gameState);
  });
}


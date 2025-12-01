/**
 * Building configuration data
 * Each building supports: cost, timer, level-based production, prerequisites
 * All buildings now support up to level 30
 */

import { TECHNOLOGIES } from './technology';
import { generateCostsArray, generateBuildTimesArray, generateProductionArray } from '../utils/levelScaling';

export const BUILDINGS = {
  TOWN_HALL: {
    id: 'town_hall',
    name: 'Town Hall',
    description: 'The heart of your island. Unlocks new buildings and provides island-wide bonuses.',
    icon: '🏛️',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 0, wood: 0, stone: 0 }, 1.5).map((cost, index) => 
      index === 0 ? { gold: 0, wood: 0, stone: 0 } : cost
    ),
    buildTimes: generateBuildTimesArray(30, 30).map((time, index) => index === 0 ? 0 : time),
    production: generateProductionArray(30, { gold: 0 }, 1.3).map((prod, index) => 
      index === 0 ? { gold: 0 } : prod
    ),
    prerequisites: [],
    unlocks: ['gold_mine', 'lumber_mill', 'quarry', 'distillery', 'tavern', 'dock'],
    gridSize: { width: 2, height: 2 },
  },
  GOLD_MINE: {
    id: 'gold_mine',
    name: 'Gold Mine',
    description: 'Extracts precious gold from the island. Higher levels yield more gold.',
    icon: '⛏️',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 100, wood: 50, stone: 25 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 20),
    production: generateProductionArray(30, { gold: 5 }, 1.3),
    prerequisites: [{ building: 'town_hall', level: 1 }],
    unlocks: [],
    gridSize: { width: 1, height: 1 },
  },
  LUMBER_MILL: {
    id: 'lumber_mill',
    name: 'Lumber Mill',
    description: 'Processes trees into usable wood for construction.',
    icon: '🪵',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 80, wood: 0, stone: 20 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 15),
    production: generateProductionArray(30, { wood: 3 }, 1.3),
    prerequisites: [{ building: 'town_hall', level: 1 }],
    unlocks: [],
    gridSize: { width: 1, height: 1 },
  },
  QUARRY: {
    id: 'quarry',
    name: 'Quarry',
    description: 'Extracts stone from the island bedrock.',
    icon: '🪨',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 90, wood: 40, stone: 0 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 18),
    production: generateProductionArray(30, { stone: 2 }, 1.3),
    prerequisites: [{ building: 'town_hall', level: 1 }],
    unlocks: [],
    gridSize: { width: 1, height: 1 },
  },
  DISTILLERY: {
    id: 'distillery',
    name: 'Distillery',
    description: 'Brews fine rum for your crew and trade.',
    icon: '🍺',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 120, wood: 60, food: 20 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 25),
    production: generateProductionArray(30, { rum: 2 }, 1.3),
    prerequisites: [{ building: 'town_hall', level: 1 }],
    unlocks: [],
    gridSize: { width: 1, height: 1 },
  },
  TAVERN: {
    id: 'tavern',
    name: 'Tavern',
    description: 'Attracts new crew members to join your cause.',
    icon: '🍻',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 150, wood: 80, rum: 20 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 30),
    production: generateProductionArray(30, { crew: 1 }, 1.3),
    prerequisites: [{ building: 'town_hall', level: 1 }],
    unlocks: [],
    gridSize: { width: 1, height: 1 },
  },
  DOCK: {
    id: 'dock',
    name: 'Dock',
    description: 'Build and repair ships. Unlocks your fleet capabilities.',
    icon: '⚓',
    maxLevel: 30,
    costs: generateCostsArray(30, { gold: 200, wood: 150, stone: 100 }, 1.5),
    buildTimes: generateBuildTimesArray(30, 60),
    production: [],
    prerequisites: [{ building: 'town_hall', level: 2 }],
    unlocks: ['ship_building'],
    gridSize: { width: 2, height: 1 },
  },
};

/**
 * Get building config by ID
 */
export function getBuildingConfig(buildingId) {
  return BUILDINGS[buildingId.toUpperCase().replace(/-/g, '_')] || null;
}

/**
 * Check if building prerequisites are met
 * Checks both building prerequisites and technology unlocks
 */
export function checkPrerequisites(buildingId, gameState) {
  const config = getBuildingConfig(buildingId);
  if (!config) return false;

  // Check if unlocked by technology (takes priority - bypasses building prerequisites)
  const researchedTechnologies = gameState.researchedTechnologies || [];
  const isUnlockedByTech = Object.values(TECHNOLOGIES).some(tech => {
    if (!tech.unlocks || !tech.unlocks.includes(buildingId)) return false;
    
    // Check if technology is researched (at least level 1)
    const techEntry = researchedTechnologies.find(t => 
      (typeof t === 'string' ? t === tech.id : t.id === tech.id)
    );
    if (!techEntry) return false;
    
    // Get technology level
    const techLevel = typeof techEntry === 'string' ? 1 : (techEntry.level || 1);
    
    // For dock, require shipbuilding level 1 minimum
    if (buildingId === 'dock' && tech.id === 'shipbuilding') {
      return techLevel >= 1;
    }
    
    // For other buildings, any level is fine
    return techLevel >= 1;
  });

  // If unlocked by tech, only require Town Hall to exist (no level requirement)
  if (isUnlockedByTech) {
    const townHall = gameState.buildings.find(b => b.type === 'town_hall');
    return !!townHall; // Just need Town Hall to exist, any level
  }

  // Check if unlocked by another building
  const isUnlockedByBuilding = gameState.buildings.some(b => {
    const buildingConfig = getBuildingConfig(b.type);
    return buildingConfig && buildingConfig.unlocks && buildingConfig.unlocks.includes(buildingId);
  });

  // If unlocked by building, check prerequisites
  if (isUnlockedByBuilding) {
    if (config.prerequisites.length === 0) return true;
    return config.prerequisites.every(req => {
      const building = gameState.buildings.find(b => b.type === req.building);
      return building && building.level >= req.level;
    });
  }

  // If no unlock requirement, check prerequisites only
  if (config.prerequisites.length === 0) {
    // Default: allow if Town Hall exists
    const townHall = gameState.buildings.find(b => b.type === 'town_hall');
    return !!townHall;
  }

  // Check building prerequisites
  return config.prerequisites.every(req => {
    const building = gameState.buildings.find(b => b.type === req.building);
    return building && building.level >= req.level;
  });
}


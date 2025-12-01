/**
 * Real-time game progress calculation (MMO style)
 * Calculates resource generation and timers server-side
 * Works even when player is offline
 */

// Building production rates (per 8 seconds)
const BUILDING_PRODUCTION = {
  TOWN_HALL: {
    1: { gold: 10 },
    2: { gold: 20 },
    3: { gold: 40 },
  },
  GOLD_MINE: {
    1: { gold: 15 },
    2: { gold: 30 },
    3: { gold: 60 },
  },
  LUMBER_MILL: {
    1: { wood: 12 },
    2: { wood: 24 },
    3: { wood: 48 },
  },
  DISTILLERY: {
    1: { rum: 8 },
    2: { rum: 16 },
    3: { rum: 32 },
  },
  QUARRY: {
    1: { stone: 10 },
    2: { stone: 20 },
    3: { stone: 40 },
  },
  TAVERN: {
    1: { food: 5 },
    2: { food: 10 },
    3: { food: 20 },
  },
};

const TICK_INTERVAL = 8000; // 8 seconds

/**
 * Calculate resource generation based on buildings and time elapsed
 */
function calculateResourceGeneration(buildings, resources, timeElapsedMs) {
  const ticks = Math.floor(timeElapsedMs / TICK_INTERVAL);
  if (ticks === 0) return resources;
  
  const newResources = { ...resources };
  
  buildings.forEach(building => {
    if (building.isConstructing) return;
    
    const buildingKey = building.type.toUpperCase().replace(/-/g, '_');
    const production = BUILDING_PRODUCTION[buildingKey]?.[building.level];
    
    if (!production) return;
    
    // Apply production for each tick
    for (let i = 0; i < ticks; i++) {
      Object.keys(production).forEach(resource => {
        newResources[resource] = (newResources[resource] || 0) + (production[resource] || 0);
      });
    }
  });
  
  return newResources;
}

/**
 * Process building construction timers
 */
function processBuildingTimers(buildings, timers, now) {
  const updatedBuildings = [...buildings];
  const updatedTimers = { ...timers };
  let changed = false;
  
  Object.keys(updatedTimers).forEach(buildingId => {
    const timer = updatedTimers[buildingId];
    if (!timer || !timer.endTime) return;
    
    const building = updatedBuildings.find(b => b.id === buildingId);
    if (!building || !building.isConstructing) {
      delete updatedTimers[buildingId];
      return;
    }
    
    if (timer.endTime <= now) {
      // Construction complete
      const buildingIndex = updatedBuildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        updatedBuildings[buildingIndex] = {
          ...updatedBuildings[buildingIndex],
          isConstructing: false,
          level: updatedBuildings[buildingIndex].level + (updatedBuildings[buildingIndex].level === 0 ? 1 : 0),
        };
        changed = true;
        delete updatedTimers[buildingId];
      }
    }
  });
  
  return { buildings: updatedBuildings, timers: updatedTimers, changed };
}

/**
 * Process ship construction timers
 */
function processShipTimers(ships, timers, now) {
  const updatedShips = [...ships];
  const updatedTimers = { ...timers };
  let changed = false;
  
  Object.keys(updatedTimers).forEach(timerKey => {
    const timer = updatedTimers[timerKey];
    if (!timer || !timer.endTime || timer.completed) return;
    
    if (timer.endTime <= now) {
      // Ship construction complete - create new ship
      const shipType = timerKey.replace('building_', '');
      const newShip = {
        id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: shipType,
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        speed: 10,
      };
      updatedShips.push(newShip);
      changed = true;
      delete updatedTimers[timerKey];
    }
  });
  
  return { ships: updatedShips, timers: updatedTimers, changed };
}

/**
 * Process technology research timers
 */
function processTechnologyTimers(researchedTechnologies, technologyTimers, now) {
  const updatedTechnologies = [...researchedTechnologies];
  const updatedTimers = { ...technologyTimers };
  let changed = false;
  
  Object.keys(updatedTimers).forEach(timerKey => {
    const timer = updatedTimers[timerKey];
    if (!timer || !timer.endTime || timer.completed) return;
    
    if (timer.endTime <= now) {
      // Research complete
      const lastUnderscore = timerKey.lastIndexOf('_');
      if (lastUnderscore === -1) return;
      
      const techId = timerKey.substring(0, lastUnderscore);
      const level = parseInt(timerKey.substring(lastUnderscore + 1)) || 1;
      
      let techIndex = updatedTechnologies.findIndex(t => 
        (typeof t === 'string' ? t === techId : t.id === techId)
      );
      
      if (techIndex === -1) {
        updatedTechnologies.push({ id: techId, level });
      } else {
        const existing = updatedTechnologies[techIndex];
        updatedTechnologies[techIndex] = typeof existing === 'string' 
          ? { id: techId, level }
          : { ...existing, level };
      }
      changed = true;
      delete updatedTimers[timerKey];
    }
  });
  
  return { technologies: updatedTechnologies, timers: updatedTimers, changed };
}

/**
 * Calculate all game progress since lastUpdate
 * This is the main function that processes everything server-side
 */
export function calculateGameProgress(gameState) {
  if (!gameState || !gameState.lastUpdate) {
    return gameState;
  }
  
  const now = Date.now();
  const timeElapsed = now - gameState.lastUpdate;
  
  // If less than 1 second, no progress to calculate
  if (timeElapsed < 1000) {
    return gameState;
  }
  
  console.log(`⏱️ Calculating server-side progress: ${Math.floor(timeElapsed / 1000)}s elapsed`);
  
  let updatedState = { ...gameState };
  
  // 1. Calculate resource generation
  updatedState.resources = calculateResourceGeneration(
    updatedState.buildings || [],
    updatedState.resources || {},
    timeElapsed
  );
  
  // 2. Process building timers
  const buildingResult = processBuildingTimers(
    updatedState.buildings || [],
    updatedState.timers?.buildings || {},
    now
  );
  updatedState.buildings = buildingResult.buildings;
  updatedState.timers = {
    ...updatedState.timers,
    buildings: buildingResult.timers,
  };
  
  // 3. Process ship timers
  const shipResult = processShipTimers(
    updatedState.ships || [],
    updatedState.timers?.ships || {},
    now
  );
  updatedState.ships = shipResult.ships;
  updatedState.timers = {
    ...updatedState.timers,
    ships: shipResult.timers,
  };
  
  // 4. Process technology timers
  const techResult = processTechnologyTimers(
    updatedState.researchedTechnologies || [],
    updatedState.technologyTimers || {},
    now
  );
  updatedState.researchedTechnologies = techResult.technologies;
  updatedState.technologyTimers = techResult.timers;
  
  // 5. Update lastUpdate to now
  updatedState.lastUpdate = now;
  
  return updatedState;
}


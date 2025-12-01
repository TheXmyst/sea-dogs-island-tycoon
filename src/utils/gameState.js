/**
 * Game state management and localStorage persistence
 */

const STORAGE_KEY_PREFIX = 'seaDogsGameState_';

/**
 * Get storage key for a specific user
 */
function getStorageKey(userId = null) {
  if (userId) {
    return `${STORAGE_KEY_PREFIX}${userId}`;
  }
  return `${STORAGE_KEY_PREFIX}guest`;
}

/**
 * Initial game state
 */
export function getInitialGameState() {
  return {
    resources: {
      gold: 1000,
      wood: 500,
      rum: 100,
      stone: 200,
      food: 50,
      crew: 20,
      cannons: 0,
      diamonds: 100, // Premium currency - starting bonus
      fragments: 0, // For captain recruitment
    },
    buildings: [
      {
        id: 'town_hall_1',
        type: 'town_hall',
        level: 1,
        x: 5, // Use position from BUILDING_POSITIONS
        y: 2, // Use position from BUILDING_POSITIONS
        completedAt: Date.now(),
        isConstructing: false,
      },
    ],
    ships: [],
    captains: [], // Collected captains
    captainSkins: {}, // Map of captainId -> array of skinIds
    activeSkins: {}, // Map of captainId -> activeSkinId
    crew: [], // Specialized crew members
    researchedTechnologies: [], // Researched techs: [{ id: 'tech_id', level: 1 }] or legacy: ['tech_id']
    technologyTimers: {}, // Research timers: { 'tech_id_level': { startTime, endTime, remaining } }
    gachaPity: {
      pulls: 0, // Legacy: kept for backward compatibility
      epicPulls: 0, // Pulls since last Epic
      legendaryPulls: 0, // Pulls since last Legendary
      guaranteedEpicAt: 50, // Guaranteed Epic at this pull count
      guaranteedLegendaryAt: 100, // Guaranteed Legendary at this pull count
    },
    eventProgress: {}, // Track event completion
    timers: {
      buildings: {},
      ships: {},
    },
    lastUpdate: Date.now(),
    version: 4, // Increment version for migration (v4: technology levels)
  };
}

/**
 * Load game state from localStorage
 * @param {string|null} userId - User ID for multi-user support
 */
export function loadGameState(userId = null) {
  try {
    const storageKey = getStorageKey(userId);
    const saved = localStorage.getItem(storageKey);
    if (!saved) return getInitialGameState();
    
    const state = JSON.parse(saved);
    
    // Migrate old save files to new version
    if (!state.version || state.version < 2) {
      // Add new fields for version 2
      state.resources = {
        ...getInitialGameState().resources,
        ...state.resources,
        diamonds: state.resources.diamonds || 100,
        fragments: state.resources.fragments || 0,
      };
      state.captains = state.captains || [];
      state.captainSkins = state.captainSkins || {};
      state.activeSkins = state.activeSkins || {};
      state.crew = state.crew || [];
      state.researchedTechnologies = state.researchedTechnologies || [];
      state.technologyTimers = state.technologyTimers || {};
      state.gachaPity = state.gachaPity || getInitialGameState().gachaPity;
      state.eventProgress = state.eventProgress || {};
      state.version = 3; // Increment for new features
    }
    
    // Migrate to version 4: Convert technology IDs to objects with levels
    if (!state.version || state.version < 4) {
      if (Array.isArray(state.researchedTechnologies)) {
        state.researchedTechnologies = state.researchedTechnologies.map(tech => {
          if (typeof tech === 'string') {
            // Legacy format: just ID, convert to object with level 1
            return { id: tech, level: 1 };
          }
          // Already in new format
          return tech;
        });
      }
      
      // Migrate technology timers from old format (techId) to new format (techId_level)
      if (state.technologyTimers) {
        const newTimers = {};
        Object.keys(state.technologyTimers).forEach(timerKey => {
          const timer = state.technologyTimers[timerKey];
          // If timer key doesn't contain underscore, it's old format
          if (!timerKey.includes('_')) {
            // Assume it's for level 1
            newTimers[`${timerKey}_1`] = timer;
          } else {
            newTimers[timerKey] = timer;
          }
        });
        state.technologyTimers = newTimers;
      }
      
      state.version = 4;
    }
    
    // Restore timers - calculate remaining time
    const now = Date.now();
    Object.keys(state.timers.buildings || {}).forEach(buildingId => {
      const timer = state.timers.buildings[buildingId];
      if (timer.endTime > now) {
        timer.remaining = timer.endTime - now;
      } else {
        timer.remaining = 0;
        timer.completed = true;
      }
    });
    
    Object.keys(state.timers.ships || {}).forEach(shipId => {
      const timer = state.timers.ships[shipId];
      if (timer.endTime > now) {
        timer.remaining = timer.endTime - now;
      } else {
        timer.remaining = 0;
        timer.completed = true;
      }
    });
    
    // Restore technology timers
    Object.keys(state.technologyTimers || {}).forEach(timerKey => {
      const timer = state.technologyTimers[timerKey];
      if (timer && timer.endTime > now) {
        timer.remaining = timer.endTime - now;
      } else if (timer) {
        timer.remaining = 0;
        timer.completed = true;
      }
    });
    
    // Preserve lastUpdate from saved state (critical for offline progress)
    // Only set to now if it doesn't exist (new game)
    if (!state.lastUpdate) {
      state.lastUpdate = Date.now();
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return getInitialGameState();
  }
}

/**
 * Save game state to localStorage
 * @param {object} gameState - Game state to save
 * @param {string|null} userId - User ID for multi-user support
 */
export function saveGameState(gameState, userId = null) {
  try {
    const storageKey = getStorageKey(userId);
    const stateToSave = {
      ...gameState,
      // Preserve lastUpdate if it exists, otherwise set to now
      // This is critical for offline progress calculation
      lastUpdate: gameState.lastUpdate || Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

/**
 * Check if player has enough resources
 */
export function hasResources(resources, costs) {
  return Object.keys(costs).every(resource => {
    return (resources[resource] || 0) >= costs[resource];
  });
}

/**
 * Deduct resources
 */
export function deductResources(resources, costs) {
  const newResources = { ...resources };
  Object.keys(costs).forEach(resource => {
    newResources[resource] = (newResources[resource] || 0) - costs[resource];
  });
  return newResources;
}

/**
 * Add resources
 */
export function addResources(resources, rewards) {
  const newResources = { ...resources };
  Object.keys(rewards).forEach(resource => {
    newResources[resource] = (newResources[resource] || 0) + (rewards[resource] || 0);
  });
  return newResources;
}


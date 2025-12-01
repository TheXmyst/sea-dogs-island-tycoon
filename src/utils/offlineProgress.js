/**
 * Offline progress system for MMO
 * Processes timers and resource generation that occurred while player was offline
 */

import { processResourceGeneration } from './resourceGeneration';
import { getBuildingConfig } from '../config/buildings';
import { getShipConfig } from '../config/ships';
import { applyShipBuffs } from './captainBuffs';
import { BUILDINGS } from '../config/buildings';

/**
 * Process all offline progress (timers, resources, etc.)
 * This is called when the game loads to catch up on time that passed while offline
 */
export function processOfflineProgress(gameState) {
  if (!gameState || !gameState.lastUpdate) {
    return gameState;
  }

  const now = Date.now();
  const timeSinceLastUpdate = now - gameState.lastUpdate;
  
  // If less than 1 second passed, no need to process
  if (timeSinceLastUpdate < 1000) {
    return gameState;
  }

  console.log(`⏱️ Processing offline progress: ${Math.floor(timeSinceLastUpdate / 1000)}s elapsed`);

  let newState = { ...gameState };
  
  // 1. Process resource generation for offline time
  newState = processResourceGeneration(newState, BUILDINGS);
  
  // 2. Process building construction timers
  const updatedBuildings = [...(newState.buildings || [])];
  const updatedBuildingTimers = { ...(newState.timers?.buildings || {}) };
  let buildingsChanged = false;
  
  console.log(`🔍 Checking ${Object.keys(updatedBuildingTimers).length} building timers...`);
  console.log(`📋 Building timers:`, Object.keys(updatedBuildingTimers).map(id => {
    const timer = updatedBuildingTimers[id];
    return `${id}: endTime=${timer?.endTime ? new Date(timer.endTime).toISOString() : 'MISSING'}`;
  }));
  Object.keys(updatedBuildingTimers).forEach(buildingId => {
    const timer = updatedBuildingTimers[buildingId];
    if (!timer) {
      console.warn(`⚠️ Timer for building ${buildingId} is null/undefined`);
      return;
    }
    
    if (!timer.endTime) {
      console.warn(`⚠️ Timer for building ${buildingId} missing endTime:`, timer);
      // Try to reconstruct endTime from remaining if startTime exists
      if (timer.startTime && timer.remaining) {
        timer.endTime = timer.startTime + timer.remaining;
        console.log(`🔧 Reconstructed endTime for ${buildingId}: ${new Date(timer.endTime).toISOString()}`);
      } else {
        return;
      }
    }
    
    const building = updatedBuildings.find(b => b.id === buildingId);
    if (!building) {
      console.warn(`⚠️ Building ${buildingId} not found in buildings array`);
      return;
    }
    
    if (!building.isConstructing) {
      // Building is not constructing, remove timer if it exists
      console.log(`🧹 Removing timer for non-constructing building ${buildingId}`);
      delete updatedBuildingTimers[buildingId];
      return;
    }
    
    // Check if construction is complete
    const timeRemaining = timer.endTime - now;
    console.log(`⏱️ Building ${buildingId}: ${Math.floor(timeRemaining / 1000)}s remaining (endTime: ${new Date(timer.endTime).toISOString()}, now: ${new Date(now).toISOString()})`);
    
    if (timer.endTime <= now) {
      const config = getBuildingConfig(building.type);
      if (config) {
        const buildingIndex = updatedBuildings.findIndex(b => b.id === buildingId);
        if (buildingIndex !== -1) {
          updatedBuildings[buildingIndex] = {
            ...updatedBuildings[buildingIndex],
            isConstructing: false,
            level: updatedBuildings[buildingIndex].level + (updatedBuildings[buildingIndex].level === 0 ? 1 : 0),
          };
          buildingsChanged = true;
          // Remove completed timer
          delete updatedBuildingTimers[buildingId];
        }
      }
    }
  });
  
  // 3. Process ship construction timers
  const updatedShips = [...(newState.ships || [])];
  const updatedShipTimers = { ...(newState.timers?.ships || {}) };
  let shipsChanged = false;
  
  Object.keys(updatedShipTimers).forEach(shipTimerKey => {
    const timer = updatedShipTimers[shipTimerKey];
    if (!timer || !timer.endTime || timer.completed) return;
    
    // Check if ship construction is complete
    if (timer.endTime <= now) {
      const shipType = shipTimerKey.replace('building_', '');
      const config = getShipConfig(shipType);
      if (config) {
        // Apply captain buffs to ship stats
        const buffedStats = applyShipBuffs(config.stats, newState);
        const newShip = {
          id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: shipType,
          hp: buffedStats.hp,
          maxHp: buffedStats.maxHp,
          attack: buffedStats.attack,
          defense: buffedStats.defense,
          speed: buffedStats.speed,
        };
        updatedShips.push(newShip);
        shipsChanged = true;
        // Mark timer as completed and remove it
        delete updatedShipTimers[shipTimerKey];
      }
    }
  });
  
  // 4. Process technology research timers
  const updatedTechnologies = [...(newState.researchedTechnologies || [])];
  const updatedTechnologyTimers = { ...(newState.technologyTimers || {}) };
  let technologiesChanged = false;
  
  Object.keys(updatedTechnologyTimers).forEach(timerKey => {
    const timer = updatedTechnologyTimers[timerKey];
    if (!timer || !timer.endTime || timer.completed) return;
    
    // Check if research is complete
    if (timer.endTime <= now) {
      // Parse techId and level from timerKey (format: "techId_level")
      const lastUnderscore = timerKey.lastIndexOf('_');
      if (lastUnderscore === -1) {
        console.warn('Invalid timerKey format:', timerKey);
        return;
      }
      const techId = timerKey.substring(0, lastUnderscore);
      const levelStr = timerKey.substring(lastUnderscore + 1);
      const level = parseInt(levelStr) || 1;
      
      // Find existing tech entry or create new one
      let techEntryIndex = updatedTechnologies.findIndex(t => 
        (typeof t === 'string' ? t === techId : t.id === techId)
      );
      
      if (techEntryIndex === -1) {
        // New research
        updatedTechnologies.push({ id: techId, level: level });
        technologiesChanged = true;
      } else {
        // Upgrade existing
        const existingEntry = updatedTechnologies[techEntryIndex];
        if (typeof existingEntry === 'string') {
          // Legacy format, convert to object
          updatedTechnologies[techEntryIndex] = { id: techId, level: level };
        } else {
          // Update level
          updatedTechnologies[techEntryIndex] = { ...existingEntry, level: level };
        }
        technologiesChanged = true;
      }
      
      // Remove completed timer
      delete updatedTechnologyTimers[timerKey];
    }
  });
  
  // Update state with all changes
  newState = {
    ...newState,
    buildings: updatedBuildings,
    ships: updatedShips,
    researchedTechnologies: updatedTechnologies,
    timers: {
      ...newState.timers,
      buildings: updatedBuildingTimers,
      ships: updatedShipTimers,
    },
    technologyTimers: updatedTechnologyTimers,
    lastUpdate: now, // Update timestamp
  };
  
  if (buildingsChanged || shipsChanged || technologiesChanged) {
    console.log('✅ Offline progress processed:', {
      buildings: buildingsChanged ? 'completed' : 'none',
      ships: shipsChanged ? 'completed' : 'none',
      technologies: technologiesChanged ? 'completed' : 'none',
      timeElapsed: `${Math.floor(timeSinceLastUpdate / 1000)}s`,
    });
  } else {
    console.log('ℹ️ No offline progress to process (timers still running)');
  }
  
  // CRITICAL: Update lastUpdate to NOW after processing offline progress
  // This prevents re-processing the same offline time multiple times
  newState.lastUpdate = now;
  console.log(`⏱️ Updated lastUpdate to: ${new Date(now).toISOString()}`);
  
  return newState;
}


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadGameState, saveGameState, deductResources, addResources, hasResources, getInitialGameState } from './utils/gameState';
import { processResourceGeneration, getTimeUntilNextTick } from './utils/resourceGeneration';
// Removed processOfflineProgress - server now calculates all progress (MMO mode)
import { applyBuildTimeReduction, applyShipBuffs, applyLootBonus } from './utils/captainBuffs';
import { BUILDINGS, getBuildingConfig, checkPrerequisites } from './config/buildings';
import { SHIPS, getShipConfig } from './config/ships';
import { authAPI, gameAPI } from './services/api';
import ResourceHUD from './components/ResourceHUD';
import UserInfo from './components/UserInfo';
import IslandView from './components/IslandView';
import ShipManager from './components/ShipManager';
import CaptainManager from './components/CaptainManager';
import GachaSystem from './components/GachaSystem';
import BattleSystem from './components/BattleSystem';
import EventSystem from './components/EventSystem';
import TechnologyTree from './components/TechnologyTree';
import CrewRecruitment from './components/CrewRecruitment';
import Navigation from './components/Navigation';
import ToastNotification from './components/ToastNotification';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import SystemLog from './components/SystemLog';
import DevTools from './components/DevTools';
import { setNotificationCallback, showSuccess, showError, showInfo } from './utils/notifications';
import './App.css';

const TABS = {
  ISLAND: 'island',
  FLEET: 'fleet',
  TECHNOLOGY: 'technology',
  CREW: 'crew',
  CAPTAINS: 'captains',
  RECRUITMENT: 'recruitment',
  EVENTS: 'events',
  BATTLE: 'battle',
  ALLIANCE: 'alliance',
  LEADERBOARD: 'leaderboard',
  SYSTEM: 'system',
};

export default function App() {
  // Initialize with empty state - will be loaded after auth check
  const [gameState, setGameState] = useState(() => getInitialGameState());
  const [currentTab, setCurrentTab] = useState(TABS.ISLAND);
  const [selectedShip, setSelectedShip] = useState(null);
  const [nextTickTime, setNextTickTime] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(() => !authAPI.isAuthenticated());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authAPI.isAuthenticated());
  const [userId, setUserId] = useState(() => authAPI.getUserId());
  const [username, setUsername] = useState(() => authAPI.getUsername());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const audioRef = useRef(null);
  const hasLoadedFromServerRef = useRef(false); // Track if we've already loaded from server
  
  // Setup notification callback - only show one toast at a time
  useEffect(() => {
    setNotificationCallback((notification) => {
      // Replace current toast instead of adding to array
      setCurrentToast({ ...notification, id: Date.now() });
    });
  }, []);

  // Music player - continues playing on specific tabs
  // Tabs where music continues: Island, Fleet, Tech, Crew, Captains, Event, Alliance, Leaderboard, System
  // Tabs where music stops: Battle, Recruitment
  useEffect(() => {
    if (!isAuthenticated) return; // Don't play music if not authenticated
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Tabs where music should play
    const musicTabs = [
      TABS.ISLAND,
      TABS.FLEET,
      TABS.TECHNOLOGY,
      TABS.CREW,
      TABS.CAPTAINS,
      TABS.EVENTS,
      TABS.ALLIANCE,
      TABS.LEADERBOARD,
      TABS.SYSTEM,
    ];
    
    const shouldPlay = musicTabs.includes(currentTab);
    
    if (shouldPlay) {
      // Play music
      audio.volume = 0.3; // 30% volume
      audio.loop = true;
      
      // Try to play (may fail due to browser autoplay policies)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was prevented, user will need to interact first
          console.log('Audio autoplay prevented:', error);
        });
      }
    } else {
      // Pause music on Battle and Recruitment tabs
      audio.pause();
      // Don't reset currentTime so it can resume from where it stopped if needed
    }
  }, [currentTab, isAuthenticated]);

  // Process resource generation and timers
  useEffect(() => {
    if (!isAuthenticated && !userId) return; // Don't process if not initialized
    
    const interval = setInterval(() => {
      try {
        setGameState(prevState => {
          let newState = processResourceGeneration(prevState, BUILDINGS);
          
          // Process building timers
          const now = Date.now();
          const updatedBuildings = (newState.buildings || []).map(building => {
            const timer = newState.timers?.buildings?.[building.id];
            if (timer && building.isConstructing && timer.endTime <= now) {
              // Construction complete
              const config = getBuildingConfig(building.type);
              if (config) {
                showSuccess(`${config.name} construction completed!`);
              }
              return {
                ...building,
                isConstructing: false,
                level: building.level + (building.level === 0 ? 1 : 0), // Handle initial construction
              };
            }
            return building;
          });
          
          // Process ship timers
          const updatedShips = [...(newState.ships || [])];
          Object.keys(newState.timers?.ships || {}).forEach(shipTimerKey => {
            const timer = newState.timers.ships[shipTimerKey];
            if (timer && timer.endTime <= now && !timer.completed) {
              // Ship construction complete
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
                timer.completed = true;
                showSuccess(`${config.name} construction completed!`);
              }
            }
          });
          
          // Process technology timers
          const updatedTechnologies = [...(newState.researchedTechnologies || [])];
          const updatedTechnologyTimers = { ...(newState.technologyTimers || {}) };
          let technologiesChanged = false;
          
          Object.keys(updatedTechnologyTimers).forEach(timerKey => {
            const timer = updatedTechnologyTimers[timerKey];
            if (timer && timer.endTime <= now && !timer.completed) {
              // Parse techId and level from timerKey (format: "techId_level")
              // Use lastIndexOf to handle techIds that contain underscores
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
                showSuccess(`Technology research completed: Level ${level}!`);
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
                showSuccess(`Technology upgraded to Level ${level}!`);
                technologiesChanged = true;
              }
              
              // Mark timer as completed and remove it
              timer.completed = true;
              delete updatedTechnologyTimers[timerKey];
            }
          });
          
          newState = {
            ...newState,
            buildings: updatedBuildings,
            ships: updatedShips,
            researchedTechnologies: updatedTechnologies,
            technologyTimers: updatedTechnologyTimers,
          };
          
          saveGameState(newState, userId);
          return newState;
        });
        
        setNextTickTime(getTimeUntilNextTick(gameState));
      } catch (error) {
        console.error('Error in game loop:', error);
        setError(error.message);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [gameState, userId, isAuthenticated]);

  // Save game state to backend (REAL-TIME for MMO)
  const saveToBackend = useCallback(async (stateToSave, immediate = false) => {
    if (!isAuthenticated || !userId || !stateToSave || !stateToSave.version) {
      return;
    }
    
    // If already syncing and not immediate, queue it
    if (isSyncing && !immediate) {
      // Will be saved by the periodic save or next immediate save
      return;
    }
    
    try {
      setIsSyncing(true);
      const result = await gameAPI.saveGameState(userId, stateToSave);
      if (result && result.success) {
        console.log('✅ Game state saved to server (real-time):', {
          buildings: stateToSave.buildings?.length || 0,
          ships: stateToSave.ships?.length || 0,
          captains: stateToSave.captains?.length || 0,
          captainSkins: Object.keys(stateToSave.captainSkins || {}).length,
          activeSkins: Object.keys(stateToSave.activeSkins || {}).length,
          crew: stateToSave.crew?.length || 0,
          technologies: stateToSave.researchedTechnologies?.length || 0,
        });
      } else {
        console.warn('⚠️ Server save returned unsuccessful:', result);
      }
    } catch (error) {
      console.error('❌ Failed to sync to backend:', error);
      // Don't show error to user - offline mode is fine
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, userId, isSyncing]);

  // Save game state to localStorage immediately (always)
  // BUT: Don't update lastUpdate here - it should only be updated when processing offline progress
  useEffect(() => {
    if (!gameState || !gameState.version) return;
    // Always save to localStorage immediately for offline play (per user)
    // Preserve lastUpdate from gameState (don't overwrite it)
    saveGameState(gameState, userId);
  }, [gameState, userId]);

  // Periodic save to backend (every 30 seconds) - ensures data is saved even if user closes browser
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    
    const interval = setInterval(() => {
      if (gameState && gameState.version && !isSyncing) {
        console.log('💾 Periodic save to server...');
        saveToBackend(gameState);
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated, userId, gameState, isSyncing, saveToBackend]);

  // Save before page unload (when user closes tab/browser)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && userId && gameState && gameState.version) {
        // Use sendBeacon for reliable save on page close
        try {
          // Save COMPLETE game state - include ALL fields
          const stateToSave = {
            resources: gameState.resources,
            buildings: gameState.buildings,
            ships: gameState.ships,
            captains: gameState.captains,
            captainSkins: gameState.captainSkins || {},
            activeSkins: gameState.activeSkins || {},
            crew: gameState.crew,
            researchedTechnologies: gameState.researchedTechnologies,
            technologyTimers: gameState.technologyTimers,
            gachaPity: gameState.gachaPity,
            eventProgress: gameState.eventProgress,
            timers: gameState.timers,
            version: gameState.version,
            lastUpdate: gameState.lastUpdate || Date.now(),
          };
          
          // Save to localStorage immediately (synchronous)
          saveGameState(gameState, userId);
          
          // Try to save to backend synchronously (blocking)
          // This ensures the save completes before page closes
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const url = `${apiUrl}/api/game/save/${userId}`;
          
          // Use synchronous XMLHttpRequest for beforeunload (more reliable than sendBeacon for POST)
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, false); // false = synchronous
          xhr.setRequestHeader('Content-Type', 'application/json');
          try {
            xhr.send(JSON.stringify(stateToSave));
            if (xhr.status === 200) {
              console.log('✅ Game state saved on page unload');
            }
          } catch (e) {
            // Ignore errors - page is closing anyway
          }
        } catch (error) {
          console.error('❌ Failed to save on page unload:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, userId, gameState]);
  
  // Load game state from backend on page refresh (if already authenticated)
  useEffect(() => {
    const loadGameData = async () => {
      // Only load once per session - use ref to prevent multiple loads
      if (hasLoadedFromServerRef.current) {
        return;
      }
      
      if (isAuthenticated && userId) {
        // Mark as loading to prevent duplicate loads
        hasLoadedFromServerRef.current = true;
        
        // This looks like initial state, try to load from server
        try {
          console.log('🔄 Loading game state from server on page refresh...');
          const serverState = await gameAPI.loadGameState(userId);
          if (serverState && serverState.success) {
            // Server has ALL data, use it directly
            const defaultState = getInitialGameState();
            const mergedState = {
              ...defaultState,
              ...serverState,
              buildings: serverState.buildings || defaultState.buildings || [],
              ships: serverState.ships || defaultState.ships || [],
              captains: serverState.captains || defaultState.captains || [],
              captainSkins: serverState.captainSkins || defaultState.captainSkins || {},
              activeSkins: serverState.activeSkins || defaultState.activeSkins || {},
              crew: serverState.crew || defaultState.crew || [],
              researchedTechnologies: serverState.researchedTechnologies || defaultState.researchedTechnologies || [],
              technologyTimers: serverState.technologyTimers || defaultState.technologyTimers || {},
              timers: serverState.timers || defaultState.timers || { buildings: {}, ships: {} },
              resources: serverState.resources || defaultState.resources || {},
              gachaPity: serverState.gachaPity || defaultState.gachaPity || {},
              eventProgress: serverState.eventProgress || defaultState.eventProgress || {},
              version: serverState.version || defaultState.version || 4,
              lastUpdate: serverState.lastUpdate || gameState.lastUpdate || Date.now(), // Keep server's lastUpdate to calculate offline time
            };
            console.log('✅ Loaded game state from server on page refresh:', {
              buildings: mergedState.buildings.length,
              ships: mergedState.ships.length,
              captains: mergedState.captains.length,
              captainSkins: Object.keys(mergedState.captainSkins || {}).length,
              activeSkins: Object.keys(mergedState.activeSkins || {}).length,
              crew: mergedState.crew.length,
              technologies: mergedState.researchedTechnologies.length,
            });
            
            // Server already calculated progress - use it directly (MMO: server calculates everything)
            console.log('✅ Using server-calculated state (MMO mode)');
            setGameState(mergedState);
            saveGameState(mergedState, userId);
          } else {
            // Server state not available, reset flag to allow retry
            hasLoadedFromServerRef.current = false;
          }
        } catch (error) {
          console.warn('⚠️ Failed to load from backend on refresh, using local save:', error);
          // Reset flag on error to allow retry
          hasLoadedFromServerRef.current = false;
          // Fallback to local storage for this user (server will calculate progress on next connection)
          const localState = loadGameState(userId);
          if (localState && localState.version) {
            console.log('⚠️ Using local state - server will calculate progress on next connection');
            setGameState(localState);
            saveGameState(localState, userId);
            if (isAuthenticated && userId) {
              saveToBackend(localState, true);
            }
          } else {
            setGameState(localState);
          }
        }
      } else if (!isAuthenticated) {
        // Not authenticated - require login for MMO mode
        console.log('⚠️ Not authenticated - MMO mode requires login');
        setShowAuthModal(true);
      }
    };
    
    // Only run once on mount or when auth state changes
    // Only run if authenticated and haven't loaded yet
    if (isAuthenticated && userId && !hasLoadedFromServerRef.current) {
      loadGameData();
    }
  }, [isAuthenticated, userId]); // Remove gameState and saveToBackend from dependencies to prevent loops

  const handleBuild = useCallback((buildingType, x, y) => {
    const config = getBuildingConfig(buildingType);
    if (!config) return;
    
    // Check if this building type is already built (only one per type)
    const alreadyBuilt = gameState.buildings.some(b => b.type === buildingType);
    if (alreadyBuilt) {
      showError(`${config.name} is already built!`);
      return;
    }
    
    // Check if there's already a building under construction
    const hasConstructionInProgress = gameState.buildings.some(b => b.isConstructing);
    if (hasConstructionInProgress) {
      showError('You can only construct one building at a time!');
      return;
    }
    
    if (!checkPrerequisites(buildingType, gameState)) {
      showError('Prerequisites not met!');
      return;
    }
    
    const cost = config.costs[0];
    if (!hasResources(gameState.resources, cost)) {
      showError('Insufficient resources!');
      return;
    }
    
    let buildTime = config.buildTimes[0] * 1000; // Convert to milliseconds
    buildTime = applyBuildTimeReduction(buildTime, gameState); // Apply captain buffs
    const now = Date.now();
    const endTime = now + buildTime;
    
    const newBuilding = {
      id: `${buildingType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: buildingType,
      level: 0, // Will become 1 when construction completes
      x,
      y,
      isConstructing: true,
      completedAt: endTime,
    };
    
    setGameState(prevState => {
      const newState = {
        ...prevState,
        resources: deductResources(prevState.resources, cost),
        buildings: [...prevState.buildings, newBuilding],
        timers: {
          ...prevState.timers,
          buildings: {
            ...prevState.timers.buildings,
            [newBuilding.id]: {
              startTime: now,
              endTime: endTime,
              remaining: buildTime,
            },
          },
        },
        lastUpdate: prevState.lastUpdate || Date.now(), // Preserve lastUpdate
      };
      console.log(`🏗️ Building timer created: ${newBuilding.id}, endTime: ${new Date(endTime).toISOString()}, remaining: ${Math.floor(buildTime / 1000)}s`);
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [gameState, userId, isAuthenticated, saveToBackend]);

  const handleUpgrade = useCallback((buildingId) => {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) return;
    
    const config = getBuildingConfig(building.type);
    if (!config) return;
    
    if (building.level >= config.maxLevel) {
      showError('Building is at maximum level!');
      return;
    }
    
    if (building.isConstructing) {
      showError('Building is still under construction!');
      return;
    }
    
    // Check if there's already a building under construction
    const hasConstructionInProgress = gameState.buildings.some(b => b.id !== buildingId && b.isConstructing);
    if (hasConstructionInProgress) {
      showError('You can only construct one building at a time!');
      return;
    }
    
    const cost = config.costs[building.level];
    if (!hasResources(gameState.resources, cost)) {
      showError('Insufficient resources!');
      return;
    }
    
    let buildTime = config.buildTimes[building.level] * 1000;
    buildTime = applyBuildTimeReduction(buildTime, gameState); // Apply captain buffs
    const now = Date.now();
    const endTime = now + buildTime;
    
    setGameState(prevState => {
      const newState = {
        ...prevState,
        resources: deductResources(prevState.resources, cost),
        buildings: prevState.buildings.map(b =>
          b.id === buildingId
            ? { ...b, isConstructing: true, level: b.level + 1 }
            : b
        ),
        timers: {
          ...prevState.timers,
          buildings: {
            ...prevState.timers.buildings,
            [buildingId]: {
              startTime: now,
              endTime: endTime,
              remaining: buildTime,
            },
          },
        },
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [gameState, userId, isAuthenticated, saveToBackend]);

  const handleBuildShip = useCallback((shipType) => {
    const config = getShipConfig(shipType);
    if (!config) return;
    
    // Check if dock exists
    const dock = gameState.buildings.find(b => b.type === 'dock' && !b.isConstructing);
    if (!dock) {
      showError('You need to build a Dock first!');
      return;
    }
    
    if (!hasResources(gameState.resources, config.cost)) {
      showError('Insufficient resources!');
      return;
    }
    
    const buildTime = config.buildTime * 1000;
    const now = Date.now();
    const endTime = now + buildTime;
    const timerKey = `building_${shipType}`;
    
    setGameState(prevState => {
      const newState = {
        ...prevState,
        resources: deductResources(prevState.resources, config.cost),
        timers: {
          ...prevState.timers,
          ships: {
            ...prevState.timers.ships,
            [timerKey]: {
              startTime: now,
              endTime: endTime,
              remaining: buildTime,
              completed: false,
            },
          },
        },
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [gameState, userId, isAuthenticated, saveToBackend]);

  const handleRepairShip = useCallback((shipId, repairCost) => {
    setGameState(prevState => {
      const ship = prevState.ships.find(s => s.id === shipId);
      if (!ship) return prevState;
      
      const config = getShipConfig(ship.type);
      if (!config) return prevState;
      
      const newState = {
        ...prevState,
        resources: deductResources(prevState.resources, repairCost),
        ships: prevState.ships.map(s =>
          s.id === shipId
            ? { ...s, hp: s.maxHp }
            : s
        ),
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleBattleComplete = useCallback((result, eventProgress) => {
    if (result.won && result.rewards) {
      // Apply captain loot bonus
      const bonusLoot = applyLootBonus(result.rewards, gameState);
      
      setGameState(prevState => {
        const newState = {
          ...prevState,
          resources: addResources(prevState.resources, bonusLoot),
          ships: prevState.ships.map(ship =>
            ship.id === selectedShip?.id
              ? { ...ship, hp: result.finalPlayerHp }
              : ship
          ),
          eventProgress: eventProgress || prevState.eventProgress,
        };
        // REAL-TIME SAVE: Save immediately (MMO requirement)
        saveGameState(newState, userId);
        if (isAuthenticated && userId) {
          saveToBackend(newState, true);
        }
        return newState;
      });
      
      // Update selected ship
      if (selectedShip) {
        setSelectedShip({
          ...selectedShip,
          hp: result.finalPlayerHp,
        });
      }
      
      // Show loot notification
      const lootText = Object.keys(bonusLoot).map(r => `${r}: +${bonusLoot[r]}`).join(', ');
      showSuccess(`Victory! Rewards: ${lootText}`);
    }
  }, [selectedShip, gameState, userId, isAuthenticated, saveToBackend]);

  const handleGachaPull = useCallback((pullResult) => {
    console.log('🎰 Gacha pull result:', {
      captains: pullResult.captains?.length || 0,
      resources: pullResult.resources,
      gachaPity: pullResult.gachaPity,
    });
    setGameState(prevState => {
      const newState = {
        ...prevState,
        ...pullResult,
        // Ensure captains array is properly set
        captains: pullResult.captains || prevState.captains || [],
      };
      console.log('💾 Saving gacha result to backend:', {
        captains: newState.captains?.length || 0,
        captainIds: newState.captains?.map(c => c.id) || [],
      });
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleUpdateCaptain = useCallback((updatedCaptain) => {
    setGameState(prevState => {
      const newState = {
        ...prevState,
        captains: prevState.captains.map(c =>
          c.id === updatedCaptain.id ? updatedCaptain : c
        ),
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleEquipSkin = useCallback((captainId, skinId) => {
    setGameState(prevState => {
      const newState = {
        ...prevState,
        activeSkins: {
          ...prevState.activeSkins,
          [captainId]: skinId,
        },
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleEventComplete = useCallback((eventData) => {
    setGameState(prevState => {
      const newState = {
        ...prevState,
        ...eventData,
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleResearchComplete = useCallback((researchData) => {
    setGameState(prevState => {
      const timerKey = `${researchData.techId}_${researchData.level || 1}`;
      const newState = {
        ...prevState,
        resources: deductResources(prevState.resources, researchData.cost),
        technologyTimers: {
          ...prevState.technologyTimers,
          [timerKey]: researchData.timer,
        },
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleRecruitCrew = useCallback((crewData) => {
    setGameState(prevState => {
      const newState = {
        ...prevState,
        ...crewData,
      };
      // REAL-TIME SAVE: Save immediately (MMO requirement)
      saveGameState(newState, userId);
      if (isAuthenticated && userId) {
        saveToBackend(newState, true);
      }
      return newState;
    });
  }, [userId, isAuthenticated, saveToBackend]);

  const handleLogin = useCallback(async ({ username, password }) => {
    setIsLoadingAuth(true);
    try {
      const response = await authAPI.login(username, password);
      if (response && response.success) {
        setIsAuthenticated(true);
        setUserId(response.id);
        setUsername(response.username);
        setShowAuthModal(false);
        showSuccess(`Welcome back, ${response.username}!`);
        
        // Load complete game state from server for this user
        try {
          const serverState = await gameAPI.loadGameState(response.id);
          if (serverState && serverState.success) {
            // Server now has ALL data, use it directly
            const defaultState = getInitialGameState();
            const mergedState = {
              ...defaultState, // Start with defaults
              ...serverState, // Override with server data
              // Ensure all required fields exist with proper defaults
              buildings: serverState.buildings || defaultState.buildings || [],
              ships: serverState.ships || defaultState.ships || [],
              captains: serverState.captains || defaultState.captains || [],
              captainSkins: serverState.captainSkins || defaultState.captainSkins || {},
              activeSkins: serverState.activeSkins || defaultState.activeSkins || {},
              crew: serverState.crew || defaultState.crew || [],
              researchedTechnologies: serverState.researchedTechnologies || defaultState.researchedTechnologies || [],
              technologyTimers: serverState.technologyTimers || defaultState.technologyTimers || {},
              timers: serverState.timers || defaultState.timers || { buildings: {}, ships: {} },
              resources: serverState.resources || defaultState.resources || {},
              gachaPity: serverState.gachaPity || defaultState.gachaPity || {},
              eventProgress: serverState.eventProgress || defaultState.eventProgress || {},
              version: serverState.version || defaultState.version || 4,
              lastUpdate: serverState.lastUpdate || Date.now(), // Keep server's lastUpdate to calculate offline time
            };
            
            console.log('📥 Merged state from server:', {
              buildings: mergedState.buildings.length,
              ships: mergedState.ships.length,
              captains: mergedState.captains.length,
              captainSkins: Object.keys(mergedState.captainSkins || {}).length,
              activeSkins: Object.keys(mergedState.activeSkins || {}).length,
              crew: mergedState.crew.length,
              technologies: mergedState.researchedTechnologies.length,
            });
            console.log('Loaded game state from server:', {
              buildings: mergedState.buildings.length,
              buildingsList: mergedState.buildings.map(b => `${b.type} Lv.${b.level}${b.isConstructing ? ' (constructing)' : ''}`),
              lastUpdate: new Date(serverState.lastUpdate || Date.now()).toISOString(),
            });
            
            // Verify Town Hall exists
            const townHall = mergedState.buildings.find(b => b.type === 'town_hall');
            if (!townHall) {
              console.error('❌ Town Hall missing from loaded state! Adding it...');
              mergedState.buildings.push({
                id: 'town_hall_1',
                type: 'town_hall',
                level: 1,
                x: 5,
                y: 2,
                completedAt: Date.now(),
                isConstructing: false,
              });
            } else {
              console.log('✅ Town Hall found:', { level: townHall.level, isConstructing: townHall.isConstructing, x: townHall.x, y: townHall.y });
            }
            
            // Server already calculated progress - use it directly (MMO: server calculates everything)
            console.log('✅ Using server-calculated state (MMO mode)');
            setGameState(mergedState);
            // Save merged state to local storage as backup
            saveGameState(mergedState, response.id);
            
            showSuccess('Game state loaded from server!');
          } else {
            // No server state, try local state for this user (server will calculate progress on next connection)
            console.warn('No server state found, loading from localStorage');
            const localState = loadGameState(response.id);
            if (localState && localState.version) {
              setGameState(localState);
              // Try to save local state to server (server will calculate progress)
              try {
                await gameAPI.saveGameState(response.id, localState);
              } catch (saveError) {
                console.warn('Failed to save local state to server:', saveError);
              }
            } else {
              setGameState(localState);
            }
          }
        } catch (error) {
          console.error('Failed to load from server:', error);
          // Fallback to local state (server will calculate progress on next connection)
          const localState = loadGameState(response.id);
          if (localState && localState.version) {
            console.log('⚠️ Using local state - server will calculate progress on next connection');
            setGameState(localState);
            // Save state (server will calculate progress)
            saveGameState(localState, userId);
            if (isAuthenticated && userId) {
              saveToBackend(localState, true);
            }
          } else {
            setGameState(localState);
          }
          showError('Failed to load from server, using local backup');
        }
      } else {
        throw new Error(response?.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const handleRegister = useCallback(async ({ username, password, email }) => {
    setIsLoadingAuth(true);
    try {
      const response = await authAPI.register(username, password, email);
      if (response && response.success) {
        setIsAuthenticated(true);
        setUserId(response.id);
        setUsername(response.username);
        setShowAuthModal(false);
        showSuccess(`Welcome to Sea Dogs, ${response.username}!`);
        
        // Create fresh initial state for new user (don't merge with old data)
        const newGameState = {
          ...getInitialGameState(),
          resources: response.resources || getInitialGameState().resources,
          gachaPity: response.gachaPity || getInitialGameState().gachaPity,
          eventProgress: response.eventProgress || getInitialGameState().eventProgress,
        };
        setGameState(newGameState);
        // Save to local storage for this user
        saveGameState(newGameState, response.id);
      } else {
        throw new Error(response?.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    // Save current state to server before logging out
    if (isAuthenticated && userId && gameState) {
      try {
        await gameAPI.saveGameState(userId, gameState);
        console.log('✅ Game state saved before logout');
      } catch (error) {
        console.error('❌ Failed to save before logout:', error);
      }
    }
    
    authAPI.logout();
    setIsAuthenticated(false);
    setUserId(null);
    setUsername(null);
    // Reset to initial state
    setGameState(getInitialGameState());
    setShowAuthModal(true);
    // Reset the load flag so we can load again on next login
    hasLoadedFromServerRef.current = false;
    showSuccess('Logged out successfully');
  }, [isAuthenticated, userId, gameState]);

  const renderTabContent = () => {
    switch (currentTab) {
      case TABS.ISLAND:
        return (
          <IslandView
            gameState={gameState}
            onBuild={handleBuild}
            onUpgrade={handleUpgrade}
          />
        );
      case TABS.FLEET:
        return (
          <ShipManager
            gameState={gameState}
            onBuildShip={handleBuildShip}
            onRepairShip={handleRepairShip}
            onSelectShip={setSelectedShip}
          />
        );
      case TABS.TECHNOLOGY:
        return (
          <TechnologyTree
            gameState={gameState}
            onResearchComplete={handleResearchComplete}
          />
        );
      case TABS.CREW:
        return (
          <CrewRecruitment
            gameState={gameState}
            onRecruitCrew={handleRecruitCrew}
          />
        );
      case TABS.CAPTAINS:
        return (
          <CaptainManager
            gameState={gameState}
            onUpdateCaptain={handleUpdateCaptain}
            onEquipSkin={handleEquipSkin}
          />
        );
      case TABS.RECRUITMENT:
        return (
          <GachaSystem
            gameState={gameState}
            onPullComplete={handleGachaPull}
          />
        );
      case TABS.EVENTS:
        return (
          <EventSystem
            gameState={gameState}
            onEventComplete={handleEventComplete}
          />
        );
      case TABS.BATTLE:
        return (
          <BattleSystem
            gameState={gameState}
            selectedShip={selectedShip}
            onBattleComplete={handleBattleComplete}
          />
        );
      case TABS.ALLIANCE:
        return (
          <div className="stub-content">
            <h2>🤝 Alliances</h2>
            <p>Form alliances with other players to strengthen your position!</p>
            <p className="coming-soon">Coming soon...</p>
          </div>
        );
      case TABS.LEADERBOARD:
        return <Leaderboard />;
      case TABS.SYSTEM:
        return <SystemLog />;
      default:
        return null;
    }
  };

  // If not authenticated, show only auth modal (blocking)
  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="auth-required-overlay">
          <div className="auth-required-content">
            <h1>🏴‍☠️ Sea Dogs: Island Tycoon</h1>
            <p className="welcome-message">Welcome, Captain! Create an account to start your adventure.</p>
            <p className="sub-message">Join thousands of pirates in this epic island-building strategy game!</p>
          </div>
        </div>
        <AuthModal
          onLogin={handleLogin}
          onRegister={handleRegister}
          onClose={() => {}} // Cannot close - must authenticate
          canClose={false}
        />
        {/* Toast Notifications - Single toast at a time */}
        <div className="toast-container">
          {currentToast && (
            <ToastNotification
              key={currentToast.id}
              message={currentToast.message}
              type={currentToast.type}
              duration={currentToast.duration || 5000}
              onClose={() => setCurrentToast(null)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ResourceHUD resources={gameState.resources} />
      <UserInfo 
        username={username} 
        isSyncing={isSyncing} 
        onLogout={handleLogout} 
      />
      
      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <main className="app-main">
        {renderTabContent()}
      </main>
      
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      
      {/* Dev Tools - Access with Ctrl+Shift+D */}
      {isAuthenticated && (
        <DevTools
          gameState={gameState}
          onAddResources={(resources) => {
            setGameState(prevState => ({
              ...prevState,
              resources: addResources(prevState.resources, resources),
            }));
            showSuccess('Resources added!');
          }}
          onAddDiamonds={(amount) => {
            setGameState(prevState => ({
              ...prevState,
              resources: {
                ...prevState.resources,
                diamonds: (prevState.resources.diamonds || 0) + amount,
              },
            }));
            showSuccess(`${amount} Diamonds added!`);
          }}
          onCompleteBuildings={() => {
            const now = Date.now();
            setGameState(prevState => ({
              ...prevState,
              buildings: prevState.buildings.map(b => ({
                ...b,
                isConstructing: false,
                level: b.level === 0 ? 1 : b.level,
              })),
              timers: {
                ...prevState.timers,
                buildings: {},
              },
            }));
            showSuccess('All buildings completed!');
          }}
          onCompleteResearch={() => {
            const now = Date.now();
            setGameState(prevState => ({
              ...prevState,
              technologyTimers: {},
            }));
            showSuccess('All research completed!');
          }}
        />
      )}
      
      {/* Toast Notifications - Single toast at a time */}
      <div className="toast-container">
        {currentToast && (
          <ToastNotification
            key={currentToast.id}
            message={currentToast.message}
            type={currentToast.type}
            duration={currentToast.duration || 5000}
            onClose={() => setCurrentToast(null)}
          />
        )}
      </div>
      
      {/* Background music - plays on multiple tabs */}
      {isAuthenticated && (
        <audio
          ref={audioRef}
          src="/music/island-theme.mp3"
          preload="auto"
          loop
        />
      )}
    </div>
  );
}


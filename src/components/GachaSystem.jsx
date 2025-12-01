import React, { useState } from 'react';
import { performGachaPull, CAPTAIN_RARITY } from '../config/captains';
import { hasResources, deductResources } from '../utils/gameState';
import './GachaSystem.css';

const PULL_COST_DIAMONDS = 100;
const PULL_COST_FRAGMENTS = 10;

const MULTI_PULL_COUNT = 10;
const MULTI_PULL_COST_DIAMONDS = PULL_COST_DIAMONDS * MULTI_PULL_COUNT;

export default function GachaSystem({ gameState, onPullComplete }) {
  const [pulling, setPulling] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [multiPullResults, setMultiPullResults] = useState(null);
  const [showMultiResult, setShowMultiResult] = useState(false);
  
  const canPullWithDiamonds = gameState.resources.diamonds >= PULL_COST_DIAMONDS;
  const canPullWithFragments = gameState.resources.fragments >= PULL_COST_FRAGMENTS;
  const canMultiPull = gameState.resources.diamonds >= MULTI_PULL_COST_DIAMONDS;
  
  const handlePull = (useFragments = false) => {
    const cost = useFragments 
      ? { fragments: PULL_COST_FRAGMENTS }
      : { diamonds: PULL_COST_DIAMONDS };
    
    if (!hasResources(gameState.resources, cost)) {
      alert('Insufficient resources!');
      return;
    }
    
    setPulling(true);
    
    // Simulate gacha animation delay
    setTimeout(() => {
      let result;
      try {
        result = performGachaPull(gameState);
        
        // Safety check
        if (!result || !result.captain) {
          console.error('Gacha pull returned invalid result:', result);
          alert('Error: Failed to pull captain. Please try again.');
          setPulling(false);
          return;
        }
      } catch (error) {
        console.error('Error during gacha pull:', error);
        alert('Error: Failed to pull captain. ' + error.message);
        setPulling(false);
        return;
      }
      
      // Check if captain already owned
      const alreadyOwned = (gameState.captains || []).some(c => c.id === result.captain.id);
      
      // Deduct cost
      const newResources = deductResources(gameState.resources, cost);
      
      // Update game state
      const currentCaptains = gameState.captains || [];
      const newCaptains = alreadyOwned 
        ? currentCaptains.map(c => 
            c.id === result.captain.id 
              ? { ...c, xp: (c.xp || 0) + 50 } // Duplicate = XP bonus
              : c
          )
        : [...currentCaptains, {
            id: result.captain.id,
            rarity: result.captain.rarity,
            role: result.captain.role,
            level: result.captain.baseStats.level,
            xp: result.captain.baseStats.xp,
            xpToNext: result.captain.baseStats.xpToNext,
            obtainedAt: Date.now(),
          }];
      
      const currentPity = gameState.gachaPity || { 
        pulls: 0, 
        epicPulls: 0, 
        legendaryPulls: 0, 
        guaranteedEpicAt: 50, 
        guaranteedLegendaryAt: 100 
      };
      const newGachaPity = {
        ...currentPity,
        pulls: result.newPityPulls || result.newEpicPulls || 0, // Backward compatibility
        epicPulls: result.newEpicPulls !== undefined ? result.newEpicPulls : currentPity.epicPulls || 0,
        legendaryPulls: result.newLegendaryPulls !== undefined ? result.newLegendaryPulls : currentPity.legendaryPulls || 0,
      };
      
      onPullComplete({
        resources: newResources,
        captains: newCaptains,
        gachaPity: newGachaPity,
        result: {
          ...result,
          duplicate: alreadyOwned,
        },
      });
      
      setLastResult({
        ...result,
        duplicate: alreadyOwned,
      });
      setShowResult(true);
      setPulling(false);
    }, 2000);
  };
  
  const handleMultiPull = () => {
    if (!canMultiPull) {
      alert(`Insufficient diamonds! Need ${MULTI_PULL_COST_DIAMONDS} diamonds for 10 pulls.`);
      return;
    }
    
    setPulling(true);
    
    // Simulate gacha animation delay
    setTimeout(() => {
      const results = [];
      let currentGameState = { ...gameState };
      let totalCost = { diamonds: 0 };
      
      // Perform 10 pulls
      for (let i = 0; i < MULTI_PULL_COUNT; i++) {
        try {
          const result = performGachaPull(currentGameState);
          
          if (!result || !result.captain) {
            console.error(`Pull ${i + 1} returned invalid result:`, result);
            continue;
          }
          
          // Check if captain already owned
          const alreadyOwned = (currentGameState.captains || []).some(c => c.id === result.captain.id);
          
          // Update current game state for next pull (for pity system)
          const currentPity = currentGameState.gachaPity || { 
            pulls: 0, 
            epicPulls: 0, 
            legendaryPulls: 0, 
            guaranteedEpicAt: 50, 
            guaranteedLegendaryAt: 100 
          };
          currentGameState = {
            ...currentGameState,
            gachaPity: {
              ...currentPity,
              pulls: result.newPityPulls || result.newEpicPulls || 0, // Backward compatibility
              epicPulls: result.newEpicPulls !== undefined ? result.newEpicPulls : currentPity.epicPulls || 0,
              legendaryPulls: result.newLegendaryPulls !== undefined ? result.newLegendaryPulls : currentPity.legendaryPulls || 0,
            },
          };
          
          results.push({
            ...result,
            duplicate: alreadyOwned,
            pullNumber: i + 1,
          });
          
          totalCost.diamonds += PULL_COST_DIAMONDS;
        } catch (error) {
          console.error(`Error during pull ${i + 1}:`, error);
        }
      }
      
      if (results.length === 0) {
        alert('Error: Failed to perform pulls. Please try again.');
        setPulling(false);
        return;
      }
      
      // Process all results and update game state
      let newCaptains = [...(gameState.captains || [])];
      const newCaptainsMap = new Map();
      
      // First, create a map of existing captains
      newCaptains.forEach(c => newCaptainsMap.set(c.id, { ...c }));
      
      // Process each result
      results.forEach(result => {
        const captainId = result.captain.id;
        const existing = newCaptainsMap.get(captainId);
        
        if (existing) {
          // Duplicate: add XP
          newCaptainsMap.set(captainId, {
            ...existing,
            xp: (existing.xp || 0) + 50,
          });
        } else {
          // New captain
          newCaptainsMap.set(captainId, {
            id: result.captain.id,
            rarity: result.captain.rarity,
            role: result.captain.role,
            level: result.captain.baseStats.level,
            xp: result.captain.baseStats.xp,
            xpToNext: result.captain.baseStats.xpToNext,
            obtainedAt: Date.now(),
          });
        }
      });
      
      newCaptains = Array.from(newCaptainsMap.values());
      
      // Get final pity state (from last pull)
      const finalPityState = results.length > 0 
        ? currentGameState.gachaPity 
        : gameState.gachaPity;
      
      const finalPity = {
        ...finalPityState,
        pulls: finalPityState.pulls || finalPityState.epicPulls || 0, // Backward compatibility
        epicPulls: finalPityState.epicPulls !== undefined ? finalPityState.epicPulls : finalPityState.pulls || 0,
        legendaryPulls: finalPityState.legendaryPulls !== undefined ? finalPityState.legendaryPulls : finalPityState.pulls || 0,
      };
      
      // Deduct total cost
      const newResources = deductResources(gameState.resources, totalCost);
      
      // Update game state
      onPullComplete({
        resources: newResources,
        captains: newCaptains,
        gachaPity: finalPity,
      });
      
      setMultiPullResults(results);
      setShowMultiResult(true);
      setPulling(false);
    }, 2000);
  };
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case CAPTAIN_RARITY.COMMON: return '#95a5a6';
      case CAPTAIN_RARITY.RARE: return '#3498db';
      case CAPTAIN_RARITY.EPIC: return '#9b59b6';
      case CAPTAIN_RARITY.LEGENDARY: return '#f39c12';
      default: return '#ffffff';
    }
  };
  
  const getRarityName = (rarity) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };
  
  // Get pity progress (use separate counters if available, fallback to legacy)
  const gachaPity = gameState.gachaPity || { 
    pulls: 0, 
    epicPulls: 0, 
    legendaryPulls: 0, 
    guaranteedEpicAt: 50, 
    guaranteedLegendaryAt: 100 
  };
  const epicPulls = gachaPity.epicPulls !== undefined ? gachaPity.epicPulls : gachaPity.pulls || 0;
  const legendaryPulls = gachaPity.legendaryPulls !== undefined ? gachaPity.legendaryPulls : gachaPity.pulls || 0;
  const nextEpicAt = gachaPity.guaranteedEpicAt || 50;
  const nextLegendaryAt = gachaPity.guaranteedLegendaryAt || 100;
  
  return (
    <div className="gacha-system">
      <div className="gacha-header">
        <h2>🎰 Captain Recruitment</h2>
        <p>Recruit powerful captains to join your crew!</p>
      </div>
      
      <div className="gacha-pity-info">
        <h3>Pity System</h3>
        <div className="pity-bars">
          <div className="pity-bar">
            <div className="pity-label">Epic Guarantee</div>
            <div className="pity-progress-bar">
            <div 
              className="pity-progress-fill"
              style={{ 
                width: `${Math.min(100, (epicPulls / nextEpicAt) * 100)}%`,
                background: '#9b59b6',
              }}
            />
          </div>
          <div className="pity-text">
            {epicPulls} / {nextEpicAt} pulls
          </div>
        </div>
        <div className="pity-bar">
          <div className="pity-label">Legendary Guarantee</div>
          <div className="pity-progress-bar">
            <div 
              className="pity-progress-fill"
              style={{ 
                width: `${Math.min(100, (legendaryPulls / nextLegendaryAt) * 100)}%`,
                background: '#f39c12',
              }}
            />
          </div>
          <div className="pity-text">
            {legendaryPulls} / {nextLegendaryAt} pulls
          </div>
          </div>
        </div>
      </div>
      
      <div className="gacha-pull-section">
        <div className="pull-options">
          <div className="pull-option">
            <h3>Single Pull</h3>
            <div className="pull-cost">
              <span>💎 {PULL_COST_DIAMONDS}</span>
              <span>or</span>
              <span>🎫 {PULL_COST_FRAGMENTS}</span>
            </div>
            <div className="pull-buttons">
              <button
                className="pull-button diamonds"
                onClick={() => handlePull(false)}
                disabled={!canPullWithDiamonds || pulling}
              >
                {pulling ? 'Pulling...' : `Pull with 💎 ${PULL_COST_DIAMONDS}`}
              </button>
              <button
                className="pull-button fragments"
                onClick={() => handlePull(true)}
                disabled={!canPullWithFragments || pulling}
              >
                {pulling ? 'Pulling...' : `Pull with 🎫 ${PULL_COST_FRAGMENTS}`}
              </button>
            </div>
          </div>
          
          <div className="pull-option">
            <h3>10x Pull</h3>
            <div className="pull-cost">
              <span>💎 {MULTI_PULL_COST_DIAMONDS}</span>
              <span className="multi-pull-bonus">(Save time!)</span>
            </div>
            <div className="pull-buttons">
              <button
                className="pull-button multi-pull"
                onClick={handleMultiPull}
                disabled={!canMultiPull || pulling}
              >
                {pulling ? 'Pulling...' : `10x Pull with 💎 ${MULTI_PULL_COST_DIAMONDS}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showResult && lastResult && (
        <div className="gacha-result-overlay" onClick={() => setShowResult(false)}>
          <div className="gacha-result-modal" onClick={e => e.stopPropagation()}>
            <div 
              className="result-header"
              style={{ 
                background: `linear-gradient(135deg, ${getRarityColor(lastResult.captain.rarity)}22, ${getRarityColor(lastResult.captain.rarity)}44)`,
                borderColor: getRarityColor(lastResult.captain.rarity),
              }}
            >
              <h2>
                {lastResult.duplicate ? '⭐ Duplicate!' : '🎉 New Captain!'}
              </h2>
              <div className="rarity-badge" style={{ background: getRarityColor(lastResult.captain.rarity) }}>
                {getRarityName(lastResult.captain.rarity)}
              </div>
            </div>
            
            <div className="result-body">
              <div className="captain-portrait-large">
                {lastResult.captain.portrait.startsWith('/') ? (
                  <img 
                    src={lastResult.captain.portrait} 
                    alt={lastResult.captain.name}
                    className="captain-portrait-image-gacha"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{lastResult.captain.portrait}</span>
                )}
              </div>
              <h3>{lastResult.captain.name}</h3>
              <p className="captain-description">{lastResult.captain.description}</p>
              <p className="captain-role">Role: {lastResult.captain.role}</p>
              
              {lastResult.duplicate && (
                <div className="duplicate-bonus">
                  <p>⭐ You already own this captain!</p>
                  <p>+50 XP bonus applied</p>
                </div>
              )}
              
              <div className="captain-buffs">
                <h4>Buffs:</h4>
                {Object.keys(lastResult.captain.buffs).map(buff => (
                  <div key={buff} className="buff-item">
                    <span>{buff.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span>+{Math.round(lastResult.captain.buffs[buff] * 100)}%</span>
                  </div>
                ))}
              </div>
              
              <button className="close-result-button" onClick={() => setShowResult(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showMultiResult && multiPullResults && (
        <div className="gacha-result-overlay" onClick={() => setShowMultiResult(false)}>
          <div className="gacha-multi-result-modal" onClick={e => e.stopPropagation()}>
            <div className="multi-result-header">
              <h2>🎉 10x Pull Results</h2>
              <button className="close-multi-button" onClick={() => setShowMultiResult(false)}>×</button>
            </div>
            
            <div className="multi-result-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">New Captains:</span>
                  <span className="stat-value">
                    {multiPullResults.filter(r => !r.duplicate).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Duplicates:</span>
                  <span className="stat-value">
                    {multiPullResults.filter(r => r.duplicate).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Legendary:</span>
                  <span className="stat-value legendary">
                    {multiPullResults.filter(r => r.captain.rarity === CAPTAIN_RARITY.LEGENDARY).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Epic:</span>
                  <span className="stat-value epic">
                    {multiPullResults.filter(r => r.captain.rarity === CAPTAIN_RARITY.EPIC).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="multi-result-list">
              <h3>All Results</h3>
              <div className="results-grid">
                {multiPullResults.map((result, index) => (
                  <div 
                    key={index}
                    className="multi-result-item"
                    style={{ 
                      borderColor: getRarityColor(result.captain.rarity),
                      background: `linear-gradient(135deg, ${getRarityColor(result.captain.rarity)}22, ${getRarityColor(result.captain.rarity)}11)`,
                    }}
                  >
                    <div className="result-item-header">
                      <span className="pull-number">#{result.pullNumber}</span>
                      {result.duplicate && <span className="duplicate-badge">⭐ Duplicate</span>}
                    </div>
                    <div className="result-item-portrait">
                      {result.captain.portrait.startsWith('/') ? (
                        <img 
                          src={result.captain.portrait} 
                          alt={result.captain.name}
                          className="result-item-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="result-item-emoji">{result.captain.portrait}</span>
                      )}
                    </div>
                    <div className="result-item-name">{result.captain.name}</div>
                    <div 
                      className="result-item-rarity"
                      style={{ color: getRarityColor(result.captain.rarity) }}
                    >
                      {getRarityName(result.captain.rarity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="close-result-button" onClick={() => setShowMultiResult(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


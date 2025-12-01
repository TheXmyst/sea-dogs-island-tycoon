import React, { useState } from 'react';
import { PVE_BATTLES, calculateBattle } from '../config/pveBattles';
import { recordBattleForEvents } from '../config/events';
import { applyShipBuffs } from '../utils/captainBuffs';
import { addResources } from '../utils/gameState';
import './BattleSystem.css';

export default function BattleSystem({ gameState, selectedShip, onBattleComplete }) {
  const [currentBattle, setCurrentBattle] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [isBattling, setIsBattling] = useState(false);
  
  const availableBattles = PVE_BATTLES.filter(battle => {
    // Check if player has required level (based on Town Hall level)
    const townHall = gameState.buildings.find(b => b.type === 'town_hall');
    const playerLevel = townHall ? townHall.level : 1;
    return playerLevel >= battle.requiredLevel;
  });
  
  const handleStartBattle = (battle) => {
    if (!selectedShip) {
      alert('Please select a ship first!');
      return;
    }
    
    if (selectedShip.hp <= 0) {
      alert('Your ship needs to be repaired before battle!');
      return;
    }
    
    setIsBattling(true);
    setCurrentBattle(battle);
    setBattleResult(null);
    
    // Simulate battle (could add animation delay here)
    setTimeout(() => {
      // Apply captain buffs to ship stats for battle
      const buffedShip = {
        ...selectedShip,
        ...applyShipBuffs({
          attack: selectedShip.attack,
          defense: selectedShip.defense,
          hp: selectedShip.hp,
          maxHp: selectedShip.maxHp,
          speed: selectedShip.speed,
        }, gameState),
      };
      
      const result = calculateBattle(buffedShip, battle, gameState);
      setBattleResult(result);
      setIsBattling(false);
      
      if (result.won && result.rewards) {
        // Record battle for events
        const newEventProgress = recordBattleForEvents(battle.id, gameState);
        onBattleComplete(result, newEventProgress);
      }
    }, 1500);
  };
  
  const handleCloseResult = () => {
    setCurrentBattle(null);
    setBattleResult(null);
  };
  
  return (
    <div className="battle-system">
      <div className="battle-header">
        <h2>⚔️ Battle Arena</h2>
        <p>Challenge enemy camps and claim their loot!</p>
        {selectedShip && (
          <div className="selected-ship-info">
            Selected: {selectedShip.type} ({Math.ceil(selectedShip.hp)}/{selectedShip.maxHp} HP)
          </div>
        )}
        {!selectedShip && (
          <div className="no-ship-warning">
            ⚠️ Select a ship from the Fleet tab to engage in battle
          </div>
        )}
      </div>
      
      <div className="battle-list">
        {availableBattles.map(battle => {
          const canBattle = selectedShip && selectedShip.hp > 0 && !isBattling;
          
          return (
            <div key={battle.id} className={`battle-card ${canBattle ? '' : 'disabled'}`}>
              <div className="battle-card-header">
                <div>
                  <h3>{battle.name}</h3>
                  <p className="battle-description">{battle.description}</p>
                </div>
                <div className={`difficulty-badge difficulty-${battle.difficulty}`}>
                  {battle.difficulty.toUpperCase()}
                </div>
              </div>
              
              <div className="battle-enemy-stats">
                <h4>Enemy Stats</h4>
                <div className="enemy-stats-grid">
                  <div className="stat-item">
                    <span>❤️ HP:</span>
                    <span>{battle.enemyStats.hp}</span>
                  </div>
                  <div className="stat-item">
                    <span>⚔️ Attack:</span>
                    <span>{battle.enemyStats.attack}</span>
                  </div>
                  <div className="stat-item">
                    <span>🛡️ Defense:</span>
                    <span>{battle.enemyStats.defense}</span>
                  </div>
                </div>
              </div>
              
              <div className="battle-rewards">
                <h4>Rewards</h4>
                <div className="rewards-list">
                  {Object.keys(battle.rewards).map(resource => (
                    <div key={resource} className="reward-item">
                      <span>{getResourceIcon(resource)}</span>
                      <span>{battle.rewards[resource]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                className="battle-button"
                onClick={() => handleStartBattle(battle)}
                disabled={!canBattle}
              >
                {isBattling && currentBattle?.id === battle.id ? 'Battling...' : 'Attack!'}
              </button>
            </div>
          );
        })}
      </div>
      
      {battleResult && currentBattle && (
        <div className="battle-result-overlay" onClick={handleCloseResult}>
          <div className="battle-result-modal" onClick={e => e.stopPropagation()}>
            <div className={`result-header ${battleResult.won ? 'victory' : 'defeat'}`}>
              <h2>{battleResult.won ? '🏆 Victory!' : '💀 Defeat'}</h2>
            </div>
            
            <div className="result-body">
              {battleResult.won ? (
                <>
                  <p>You have successfully defeated the {currentBattle.name}!</p>
                  <div className="result-rewards">
                    <h3>Rewards:</h3>
                    <div className="rewards-list">
                      {Object.keys(battleResult.rewards).map(resource => (
                        <div key={resource} className="reward-item">
                          <span>{getResourceIcon(resource)}</span>
                          <span>+{battleResult.rewards[resource]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="result-ship-damage">
                    <p>Your ship took damage: {Math.ceil(selectedShip.hp - battleResult.finalPlayerHp)} HP</p>
                    <p>Remaining HP: {Math.ceil(battleResult.finalPlayerHp)} / {selectedShip.maxHp}</p>
                  </div>
                </>
              ) : (
                <>
                  <p>Your ship was defeated by the {currentBattle.name}!</p>
                  <p>Repair your ship and try again with a stronger vessel.</p>
                </>
              )}
              
              <button className="close-result-button" onClick={handleCloseResult}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getResourceIcon(resource) {
  const icons = {
    gold: '💰',
    wood: '🪵',
    rum: '🍺',
    stone: '🪨',
    food: '🍖',
    crew: '👥',
    cannons: '💣',
  };
  return icons[resource] || '📦';
}


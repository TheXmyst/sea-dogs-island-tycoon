import React, { useState } from 'react';
import { getActiveEvents, checkEventProgress, claimEventRewards } from '../config/events';
import { addResources } from '../utils/gameState';
import { showSuccess, showError, showInfo } from '../utils/notifications';
import './EventSystem.css';

export default function EventSystem({ gameState, onEventComplete }) {
  const [claiming, setClaiming] = useState({});
  
  const activeEvents = getActiveEvents();
  
  const handleClaimRewards = (eventId) => {
    setClaiming({ ...claiming, [eventId]: true });
    
    const result = claimEventRewards(eventId, gameState);
    
    if (result?.error) {
      showError(result.error);
      setClaiming({ ...claiming, [eventId]: false });
      return;
    }
    
    if (result?.rewards) {
      // Add resources
      const newResources = addResources(gameState.resources, result.rewards);
      
      // Add skins if any
      const newSkins = { ...(gameState.captainSkins || {}) };
      if (result.rewards.skins) {
        result.rewards.skins.forEach(skinId => {
          // Add skin to first captain (or all if applicable)
          const firstCaptain = gameState.captains[0];
          if (firstCaptain) {
            if (!newSkins[firstCaptain.id]) {
              newSkins[firstCaptain.id] = [];
            }
            if (!newSkins[firstCaptain.id].includes(skinId)) {
              newSkins[firstCaptain.id].push(skinId);
            }
          }
        });
      }
      
      onEventComplete({
        resources: newResources,
        captainSkins: newSkins,
        eventProgress: result.eventProgress,
      });
      
      const rewardText = Object.keys(result.rewards)
        .filter(k => k !== 'skins')
        .map(r => `${r}: +${result.rewards[r]}`)
        .join(', ');
      const skinText = result.rewards.skins ? ` + ${result.rewards.skins.length} skin(s)` : '';
      showSuccess(`Event rewards claimed! ${rewardText}${skinText}`);
    }
    
    setClaiming({ ...claiming, [eventId]: false });
  };
  
  const getEventTypeColor = (type) => {
    switch (type) {
      case 'daily': return '#3498db';
      case 'weekly': return '#9b59b6';
      case 'limited': return '#e74c3c';
      case 'raid': return '#f39c12';
      default: return '#95a5a6';
    }
  };
  
  if (activeEvents.length === 0) {
    return (
      <div className="event-system">
        <div className="no-events">
          <h2>📅 Events & Raids</h2>
          <p>No active events at the moment.</p>
          <p>Check back later for special events and rewards!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="event-system">
      <div className="event-header">
        <h2>📅 Events & Raids</h2>
        <p>Complete special challenges to earn exclusive rewards!</p>
      </div>
      
      <div className="events-list">
        {activeEvents.map(event => {
          const progress = checkEventProgress(event.id, gameState);
          const canClaim = progress?.isComplete && !claiming[event.id];
          const eventData = (gameState.eventProgress || {})[event.id] || {};
          const isOnCooldown = event.repeatable && eventData.lastClaimed && 
            (Date.now() - eventData.lastClaimed) < event.cooldown;
          
          return (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <div>
                  <h3>{event.name}</h3>
                  <p className="event-description">{event.description}</p>
                </div>
                <div 
                  className="event-type-badge"
                  style={{ background: getEventTypeColor(event.type) }}
                >
                  {event.type.toUpperCase()}
                </div>
              </div>
              
              <div className="event-requirements">
                <h4>Requirements:</h4>
                <ul>
                  {event.requirements.battles.map((req, idx) => {
                    const battleProgress = (progress?.battles && progress.battles[req.battleId]) || 0;
                    return (
                      <li key={idx}>
                        Defeat {req.battleId.replace('camp_', 'Camp ')}: {battleProgress} / {req.count}
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {progress && (
                <div className="event-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {progress.completed} / {progress.total} completed
                  </div>
                </div>
              )}
              
              <div className="event-rewards">
                <h4>Rewards:</h4>
                <div className="rewards-list">
                  {Object.keys(event.rewards).filter(k => k !== 'skins').map(resource => (
                    <div key={resource} className="reward-item">
                      <span>{getResourceIcon(resource)}</span>
                      <span>{event.rewards[resource]}</span>
                    </div>
                  ))}
                  {event.rewards.skins && (
                    <div className="reward-item">
                      <span>✨</span>
                      <span>{event.rewards.skins.length} Skin(s)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {isOnCooldown && (
                <div className="event-cooldown">
                  Cooldown: {Math.ceil((event.cooldown - (Date.now() - eventData.lastClaimed)) / 3600000)}h remaining
                </div>
              )}
              
              <button
                className="claim-button"
                onClick={() => handleClaimRewards(event.id)}
                disabled={!canClaim || isOnCooldown || claiming[event.id]}
              >
                {claiming[event.id] ? 'Claiming...' : canClaim ? 'Claim Rewards' : 'In Progress'}
              </button>
            </div>
          );
        })}
      </div>
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
    diamonds: '💎',
    fragments: '🎫',
  };
  return icons[resource] || '📦';
}


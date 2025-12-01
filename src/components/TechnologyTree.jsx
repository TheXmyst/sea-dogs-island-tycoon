import React, { useState } from 'react';
import { TECHNOLOGIES, getTechnologyConfig, getTechnologiesByBranch, getAvailableTechnologies, checkTechPrerequisites, TECH_BRANCH, getTechnologyLevel, getTechnologyCost, getTechnologyResearchTime, isTechnologyResearched } from '../config/technology';
import { hasResources, deductResources } from '../utils/gameState';
import { showSuccess, showError } from '../utils/notifications';
import './TechnologyTree.css';

export default function TechnologyTree({ gameState, onResearchComplete }) {
  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(TECH_BRANCH.ECONOMY);
  
  const researched = gameState.researchedTechnologies || [];
  const availableTechs = getAvailableTechnologies(gameState);
  const branchTechs = getTechnologiesByBranch(selectedBranch);
  
  const handleStartResearch = (techId, level = null) => {
    const tech = getTechnologyConfig(techId);
    if (!tech) return;
    
    // Determine target level
    const currentLevel = getTechnologyLevel(techId, gameState);
    const targetLevel = level || (currentLevel === 0 ? 1 : currentLevel + 1);
    
    if (targetLevel > (tech.maxLevel || 10)) {
      showError('Technology is at maximum level!');
      return;
    }
    
    if (!checkTechPrerequisites(techId, gameState)) {
      showError('Prerequisites not met!');
      return;
    }
    
    // Get cost and time for target level
    const cost = getTechnologyCost(techId, targetLevel);
    const researchTime = getTechnologyResearchTime(techId, targetLevel);
    
    if (!cost || !researchTime) {
      showError('Invalid technology level!');
      return;
    }
    
    if (!hasResources(gameState.resources, cost)) {
      showError('Insufficient resources!');
      return;
    }
    
    // Check if there's already a research in progress (any technology)
    const hasResearchInProgress = Object.keys(gameState.technologyTimers || {}).some(key => {
      const timer = gameState.technologyTimers[key];
      return timer && timer.endTime > Date.now();
    });
    if (hasResearchInProgress) {
      showError('You can only research one technology at a time!');
      return;
    }
    
    // Check if already researching this specific level
    const timerKey = `${techId}_${targetLevel}`;
    const timer = gameState.technologyTimers?.[timerKey];
    if (timer && timer.endTime > Date.now()) {
      showError('Research already in progress!');
      return;
    }
    
    const researchTimeMs = researchTime * 1000; // Convert to ms
    const now = Date.now();
    const endTime = now + researchTimeMs;
    
    onResearchComplete({
      techId,
      level: targetLevel,
      cost: cost,
      timer: {
        startTime: now,
        endTime: endTime,
        remaining: researchTimeMs,
      },
    });
    
    showSuccess(`Research started: ${tech.name} Level ${targetLevel}`);
  };
  
  const getBranchColor = (branch) => {
    switch (branch) {
      case TECH_BRANCH.ECONOMY: return '#2ecc71';
      case TECH_BRANCH.MILITARY: return '#e74c3c';
      case TECH_BRANCH.EXPLORATION: return '#3498db';
      default: return '#95a5a6';
    }
  };
  
  const getTechLevel = (techId) => getTechnologyLevel(techId, gameState);
  const isResearched = (techId) => isTechnologyResearched(techId, gameState);
  const isResearching = (techId) => {
    const currentLevel = getTechLevel(techId);
    const nextLevel = currentLevel + 1;
    const tech = getTechnologyConfig(techId);
    if (!tech || nextLevel > (tech.maxLevel || 10)) return false;
    
    const timerKey = `${techId}_${nextLevel}`;
    const timer = gameState.technologyTimers?.[timerKey];
    return timer && timer.endTime > Date.now();
  };
  const canResearch = (techId) => {
    return availableTechs.some(t => t.id === techId);
  };
  
  return (
    <div className="technology-tree">
      <div className="tech-header">
        <h2>🔬 Technology Tree</h2>
        <p>Research new technologies to unlock buildings, ships, and bonuses</p>
      </div>
      
      <div className="tech-branches">
        {Object.values(TECH_BRANCH).map(branch => (
          <button
            key={branch}
            className={`branch-button ${selectedBranch === branch ? 'active' : ''}`}
            onClick={() => setSelectedBranch(branch)}
            style={{
              '--branch-color': getBranchColor(branch),
            }}
          >
            {branch.charAt(0).toUpperCase() + branch.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="tech-list">
        {branchTechs.map(tech => {
          const techLevel = getTechLevel(tech.id);
          const isResearchedTech = isResearched(tech.id);
          const isResearchingTech = isResearching(tech.id);
          const canResearchTech = availableTechs.some(t => t.id === tech.id);
          const nextLevel = techLevel + 1;
          const timerKey = `${tech.id}_${nextLevel}`;
          const timer = gameState.technologyTimers?.[timerKey];
          const progress = timer && isResearchingTech
            ? Math.max(0, Math.min(100, ((timer.endTime - Date.now()) / (timer.endTime - timer.startTime)) * 100))
            : null;
          
          // Get cost for next level
          const nextLevelCost = nextLevel <= (tech.maxLevel || 10) ? getTechnologyCost(tech.id, nextLevel) : null;
          
          return (
            <div 
              key={tech.id} 
              className={`tech-card ${isResearchedTech ? 'researched' : ''} ${canResearchTech ? '' : 'locked'}`}
              onClick={() => setSelectedTech(tech)}
            >
              <div className="tech-card-header">
                <div className="tech-icon">{tech.icon}</div>
                <div>
                  <h3>{tech.name}</h3>
                  <p className="tech-description">{tech.description}</p>
                  {isResearchedTech && (
                    <p className="tech-level">Level {techLevel} / {tech.maxLevel || 10}</p>
                  )}
                </div>
                {isResearchedTech && <div className="tech-badge researched">Lv.{techLevel}</div>}
                {isResearchingTech && <div className="tech-badge researching">Researching Lv.{nextLevel}...</div>}
              </div>
              
              {isResearchingTech && progress !== null && (
                <div className="tech-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${100 - progress}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {Math.ceil((timer.endTime - Date.now()) / 1000)}s remaining
                  </div>
                </div>
              )}
              
              {nextLevelCost && (
                <div className="tech-cost">
                  <div className="cost-label">Level {nextLevel} Cost:</div>
                  {Object.keys(nextLevelCost).map(resource => (
                    <div key={resource} className={`cost-item ${gameState.resources[resource] >= nextLevelCost[resource] ? '' : 'insufficient'}`}>
                      <span>{getResourceIcon(resource)}</span>
                      <span>{nextLevelCost[resource]}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {tech.prerequisites.length > 0 && (
                <div className="tech-prerequisites">
                  <span>Requires: </span>
                  {tech.prerequisites.map((prereqId, idx) => {
                    const prereq = getTechnologyConfig(prereqId);
                    return (
                      <span key={prereqId} className={researched.includes(prereqId) ? 'met' : 'unmet'}>
                        {prereq?.name || prereqId}
                        {idx < tech.prerequisites.length - 1 && ', '}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {(!isResearchedTech || (techLevel < (tech.maxLevel || 10))) && !isResearchingTech && (
                <button
                  className="research-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartResearch(tech.id, nextLevel);
                  }}
                  disabled={!canResearchTech || !nextLevelCost}
                >
                  {canResearchTech && nextLevelCost ? (isResearchedTech ? `Upgrade to Lv.${nextLevel}` : 'Research Lv.1') : 'Locked'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedTech && (
        <div className="tech-detail-modal" onClick={() => setSelectedTech(null)}>
          <div className="tech-detail-content" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <button className="close-button" onClick={() => setSelectedTech(null)}>×</button>
              <div className="detail-icon">{selectedTech.icon}</div>
              <h2>{selectedTech.name}</h2>
              <p>{selectedTech.description}</p>
            </div>
            
            <div className="detail-body">
              <div className="detail-section">
                <h3>Current Status</h3>
                <p>Level: {getTechLevel(selectedTech.id)} / {selectedTech.maxLevel || 10}</p>
                {isResearched(selectedTech.id) && (
                  <p className="tech-level-info">✓ Researched</p>
                )}
              </div>
              
              <div className="detail-section">
                <h3>Effects (Current Level {getTechLevel(selectedTech.id) || 0})</h3>
                {selectedTech.effects?.buildingBonus && (
                  <div>
                    <strong>Building Bonuses:</strong>
                    {Object.keys(selectedTech.effects.buildingBonus).map(buildingId => {
                      const currentLevel = getTechLevel(selectedTech.id) || 0;
                      if (currentLevel === 0) return null;
                      const baseBonus = selectedTech.effects.buildingBonus[buildingId].production;
                      const perLevelBonus = 0.05;
                      const totalBonus = baseBonus + (currentLevel - 1) * perLevelBonus;
                      return (
                        <div key={buildingId}>
                          {buildingId}: +{Math.round(totalBonus * 100)}% production (Base: +{Math.round(baseBonus * 100)}%, +{Math.round(perLevelBonus * 100)}% per level)
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedTech.effects?.shipBonus && (
                  <div>
                    <strong>Ship Bonuses:</strong>
                    {Object.keys(selectedTech.effects.shipBonus).map(bonus => {
                      const currentLevel = getTechLevel(selectedTech.id) || 0;
                      if (currentLevel === 0) return null;
                      const baseBonus = selectedTech.effects.shipBonus[bonus];
                      const perLevelBonus = bonus === 'speed' ? 0.03 : 0.02;
                      const totalBonus = baseBonus + (currentLevel - 1) * perLevelBonus;
                      return (
                        <div key={bonus}>
                          {bonus}: +{Math.round(totalBonus * 100)}% (Base: +{Math.round(baseBonus * 100)}%, +{Math.round(perLevelBonus * 100)}% per level)
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedTech.effects?.lootBonus && (
                  <div>
                    <strong>Loot Bonus:</strong> 
                    {(() => {
                      const currentLevel = getTechLevel(selectedTech.id) || 0;
                      if (currentLevel === 0) return ' Not researched';
                      const baseBonus = selectedTech.effects.lootBonus;
                      const perLevelBonus = 0.04;
                      const totalBonus = baseBonus + (currentLevel - 1) * perLevelBonus;
                      return ` +${Math.round(totalBonus * 100)}% (Base: +${Math.round(baseBonus * 100)}%, +${Math.round(perLevelBonus * 100)}% per level)`;
                    })()}
                  </div>
                )}
                {selectedTech.unlocks && selectedTech.unlocks.length > 0 && (
                  <div>
                    <strong>Unlocks:</strong> {selectedTech.unlocks.join(', ')} (at Level 1)
                  </div>
                )}
              </div>
              
              {getTechLevel(selectedTech.id) < (selectedTech.maxLevel || 10) && (
                <div className="detail-section">
                  <h3>Next Level ({getTechLevel(selectedTech.id) + 1})</h3>
                  {(() => {
                    const nextLevel = getTechLevel(selectedTech.id) + 1;
                    const nextCost = getTechnologyCost(selectedTech.id, nextLevel);
                    const nextTime = getTechnologyResearchTime(selectedTech.id, nextLevel);
                    return (
                      <>
                        {nextCost && (
                          <div>
                            <strong>Cost:</strong>
                            {Object.keys(nextCost).map(resource => (
                              <span key={resource} style={{ marginLeft: '8px' }}>
                                {getResourceIcon(resource)} {nextCost[resource]}
                              </span>
                            ))}
                          </div>
                        )}
                        {nextTime && (
                          <div>
                            <strong>Research Time:</strong> {formatTime(nextTime)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
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

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}


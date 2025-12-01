import React, { useState } from 'react';
import { CREW_TYPES, getCrewTypeConfig, CREW_TYPE } from '../config/crew';
import { hasResources, deductResources } from '../utils/gameState';
import { showSuccess, showError } from '../utils/notifications';
import './CrewRecruitment.css';

export default function CrewRecruitment({ gameState, onRecruitCrew }) {
  const [recruiting, setRecruiting] = useState({});
  
  const crew = gameState.crew || [];
  const researched = gameState.researchedTechnologies || [];
  const hasCrewTraining = researched.includes('crew_training');
  
  const handleRecruit = (crewTypeId, count = 1) => {
    const config = getCrewTypeConfig(crewTypeId);
    if (!config) return;
    
    if (!hasCrewTraining) {
      showError('Research "Crew Training" technology first!');
      return;
    }
    
    const totalCost = {
      gold: config.cost.gold * count,
      rum: config.cost.rum * count,
    };
    
    if (!hasResources(gameState.resources, totalCost)) {
      showError('Insufficient resources!');
      return;
    }
    
    setRecruiting({ ...recruiting, [crewTypeId]: true });
    
    // Simulate recruitment delay
    setTimeout(() => {
      const newCrew = [];
      for (let i = 0; i < count; i++) {
        newCrew.push({
          id: `crew_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
          type: crewTypeId,
          recruitedAt: Date.now(),
        });
      }
      
      onRecruitCrew({
        crew: [...crew, ...newCrew],
        resources: deductResources(gameState.resources, totalCost),
      });
      
      showSuccess(`Recruited ${count} ${config.name}${count > 1 ? 's' : ''}!`);
      setRecruiting({ ...recruiting, [crewTypeId]: false });
    }, 500);
  };
  
  const getCrewCount = (type) => {
    return crew.filter(c => c.type === type).length;
  };
  
  if (!hasCrewTraining) {
    return (
      <div className="crew-recruitment">
        <div className="tech-required">
          <h2>👥 Crew Recruitment</h2>
          <p>Research "Crew Training" technology to unlock specialized crew recruitment.</p>
          <p>Go to the Technology Tree to research it!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="crew-recruitment">
      <div className="crew-header">
        <h2>👥 Crew Recruitment</h2>
        <p>Recruit specialized crew members to enhance your ships</p>
      </div>
      
      <div className="crew-stats">
        <div className="stat-card">
          <div className="stat-label">Total Crew</div>
          <div className="stat-value">{crew.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Warriors</div>
          <div className="stat-value">{getCrewCount(CREW_TYPE.WARRIOR)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Archers</div>
          <div className="stat-value">{getCrewCount(CREW_TYPE.ARCHER)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hunters</div>
          <div className="stat-value">{getCrewCount(CREW_TYPE.HUNTER)}</div>
        </div>
      </div>
      
      <div className="crew-types">
        {Object.values(CREW_TYPES).map(crewType => {
          const count = getCrewCount(crewType.id);
          const canRecruit = hasResources(gameState.resources, crewType.cost);
          const isRecruiting = recruiting[crewType.id];
          
          return (
            <div key={crewType.id} className="crew-card">
              <div className="crew-card-header">
                <div className="crew-icon">{crewType.icon}</div>
                <div>
                  <h3>{crewType.name}</h3>
                  <p className="crew-description">{crewType.description}</p>
                </div>
              </div>
              
              <div className="crew-stats-info">
                <h4>Individual Stats:</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span>⚔️ Attack:</span>
                    <span>{crewType.stats.attack}</span>
                  </div>
                  <div className="stat-item">
                    <span>🛡️ Defense:</span>
                    <span>{crewType.stats.defense}</span>
                  </div>
                  <div className="stat-item">
                    <span>❤️ HP:</span>
                    <span>{crewType.stats.hp}</span>
                  </div>
                </div>
              </div>
              
              <div className="crew-bonuses">
                <h4>Ship Bonuses (per crew member):</h4>
                <div className="bonuses-list">
                  {Object.keys(crewType.shipBonus).map(bonus => (
                    <div key={bonus} className="bonus-item">
                      {bonus.replace(/([A-Z])/g, ' $1').trim()}: +{Math.round(crewType.shipBonus[bonus] * 100)}%
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="crew-cost">
                <span>Cost:</span>
                {Object.keys(crewType.cost).map(resource => (
                  <div key={resource} className={`cost-item ${gameState.resources[resource] >= crewType.cost[resource] ? '' : 'insufficient'}`}>
                    <span>{getResourceIcon(resource)}</span>
                    <span>{crewType.cost[resource]}</span>
                  </div>
                ))}
              </div>
              
              <div className="crew-count">
                Owned: {count}
              </div>
              
              <div className="recruit-buttons">
                <button
                  className="recruit-button single"
                  onClick={() => handleRecruit(crewType.id, 1)}
                  disabled={!canRecruit || isRecruiting}
                >
                  {isRecruiting ? 'Recruiting...' : 'Recruit 1'}
                </button>
                <button
                  className="recruit-button multiple"
                  onClick={() => handleRecruit(crewType.id, 5)}
                  disabled={!hasResources(gameState.resources, {
                    gold: crewType.cost.gold * 5,
                    rum: crewType.cost.rum * 5,
                  }) || isRecruiting}
                >
                  {isRecruiting ? 'Recruiting...' : 'Recruit 5'}
                </button>
              </div>
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
  };
  return icons[resource] || '📦';
}


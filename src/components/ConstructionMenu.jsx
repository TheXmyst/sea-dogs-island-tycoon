import React, { useState } from 'react';
import { BUILDINGS, getBuildingConfig, checkPrerequisites } from '../config/buildings';
import { TECHNOLOGIES } from '../config/technology';
import BuildingCard from './BuildingCard';
import './ConstructionMenu.css';

export default function ConstructionMenu({ gameState, onSelectBuilding, isOpen, onClose }) {
  const [filter, setFilter] = useState('all'); // all, production, military, economy

  const availableBuildings = Object.values(BUILDINGS).filter(building => {
    // Check if already built
    const alreadyBuilt = gameState.buildings.some(b => b.type === building.id);
    if (alreadyBuilt) return false;
    
    // Use the same checkPrerequisites function that BuildingCard uses
    // This ensures consistency between ConstructionMenu and BuildingCard
    return checkPrerequisites(building.id, gameState);
  });

  const filteredBuildings = availableBuildings.filter(building => {
    if (filter === 'all') return true;
    // Simple categorization - can be improved
    if (filter === 'production') {
      return building.id.includes('mine') || building.id.includes('mill') || 
             building.id.includes('quarry') || building.id.includes('distillery');
    }
    if (filter === 'military') {
      return building.id.includes('dock') || building.id.includes('barracks');
    }
    if (filter === 'economy') {
      return building.id.includes('tavern') || building.id.includes('hall');
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="construction-menu-overlay" onClick={onClose}>
      <div className="construction-menu" onClick={(e) => e.stopPropagation()}>
        <div className="construction-menu-header">
          <h2>🏗️ Construction</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="construction-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'production' ? 'active' : ''}`}
            onClick={() => setFilter('production')}
          >
            ⛏️ Production
          </button>
          <button 
            className={`filter-btn ${filter === 'military' ? 'active' : ''}`}
            onClick={() => setFilter('military')}
          >
            ⚔️ Military
          </button>
          <button 
            className={`filter-btn ${filter === 'economy' ? 'active' : ''}`}
            onClick={() => setFilter('economy')}
          >
            💰 Economy
          </button>
        </div>

        <div className="construction-list">
          {filteredBuildings.length === 0 ? (
            <div className="no-buildings">
              <p>No buildings available</p>
              <p className="hint">Upgrade your Town Hall to unlock more buildings!</p>
            </div>
          ) : (
            filteredBuildings.map(building => (
              <BuildingCard
                key={building.id}
                building={building}
                onClick={() => {
                  onSelectBuilding(building.id);
                  onClose();
                }}
                gameState={gameState}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}


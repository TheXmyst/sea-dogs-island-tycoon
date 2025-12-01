import React, { useState } from 'react';
import { BUILDINGS, getBuildingConfig } from '../config/buildings';
import { TECHNOLOGIES } from '../config/technology';
import { getBuildingPosition, BUILDING_POSITIONS } from '../config/islandLayout';
import BuildingCard from './BuildingCard';
import BuildingModal from './BuildingModal';
import './BuildingGrid.css';

export default function BuildingGrid({ gameState, onBuild, onUpgrade }) {
  const [placingBuilding, setPlacingBuilding] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(true); // Assume image exists
  const [hoveredZone, setHoveredZone] = useState(null); // Track which zone is hovered

  const availableBuildings = Object.values(BUILDINGS).filter(building => {
    // Check if prerequisites are met
    const hasPrereq = building.prerequisites.length === 0 || 
      building.prerequisites.every(req => {
        const existing = gameState.buildings.find(b => b.type === req.building);
        return existing && existing.level >= req.level;
      });
    
    // Check if this building is unlocked
    // A building can be unlocked by:
    // 1. A technology that has this building in its unlocks list
    // 2. A building (like Town Hall) that has this building in its unlocks list
    const researched = gameState.researchedTechnologies || [];
    let isUnlocked = true; // Default to true (no unlock requirement)
    
    // Check if any technology unlocks this building
    const techThatUnlocks = Object.values(TECHNOLOGIES).find(tech => 
      tech.unlocks && tech.unlocks.includes(building.id)
    );
    
    // Check if any building unlocks this building
    const buildingThatUnlocks = gameState.buildings.find(b => {
      const config = getBuildingConfig(b.type);
      return config && config.unlocks && config.unlocks.includes(building.id);
    });
    
    // If a technology unlocks it, check if that tech is researched
    if (techThatUnlocks) {
      isUnlocked = researched.includes(techThatUnlocks.id);
    }
    // If a building unlocks it, it's automatically unlocked (building already exists)
    else if (buildingThatUnlocks) {
      isUnlocked = true; // Building unlocker exists, so it's unlocked
    }
    
    // Check if already built (for buildings that can only be built once)
    const alreadyBuilt = gameState.buildings.some(b => b.type === building.id);
    
    return hasPrereq && isUnlocked && !alreadyBuilt;
  });

  return (
    <div className="building-grid-container">
      <div className="building-panel">
        <h3>Available Buildings</h3>
        <div className="building-list">
          {availableBuildings.map(building => {
            const isPlacing = placingBuilding === building.id;
            
            return (
              <BuildingCard
                key={building.id}
                building={building}
                onClick={() => {
                  setPlacingBuilding(building.id);
                  // Highlight the zone when selecting a building
                  setHoveredZone(building.id);
                }}
                gameState={gameState}
                isSelected={isPlacing}
              />
            );
          })}
        </div>
      </div>
      
      <div className="grid-wrapper">
        <div 
          className="island-background"
          data-no-image={!imageLoaded}
        >
          {/* Test if image loads */}
          <img 
            src="/island-background.png" 
            alt="" 
            style={{ display: 'none' }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </div>
        
        {/* Building zones overlay - clickable areas on the island */}
        <div className="building-zones-overlay">
          {Object.entries(BUILDING_POSITIONS).map(([buildingType, position]) => {
            const building = gameState.buildings.find(b => b.type === buildingType);
            const config = getBuildingConfig(buildingType);
            const isHovered = hoveredZone === buildingType;
            const isPlacing = placingBuilding === buildingType;
            const isBuilt = !!building;
            
            return (
              <div
                key={buildingType}
                className={`building-zone ${isBuilt ? 'built' : ''} ${isHovered ? 'hovered' : ''} ${isPlacing ? 'placing' : ''}`}
                style={{
                  left: position.zone.left,
                  top: position.zone.top,
                  width: position.zone.width,
                  height: position.zone.height,
                }}
                onClick={() => {
                  if (placingBuilding === buildingType && !isBuilt) {
                    // Build at the predefined position
                    onBuild(buildingType, position.x, position.y);
                    setPlacingBuilding(null);
                    setHoveredZone(null);
                  } else if (isBuilt) {
                    // Show building details
                    setShowModal(building);
                  }
                }}
                onMouseEnter={() => setHoveredZone(buildingType)}
                onMouseLeave={() => setHoveredZone(null)}
                title={isBuilt ? `${config?.name} (Click to view)` : `${config?.name} - ${position.description}`}
              >
                {isBuilt && (
                  <div className="zone-building-indicator">
                    <div className="zone-building-icon">{config?.icon}</div>
                    <div className="zone-building-level">Lv.{building.level}</div>
                    {building.isConstructing && (
                      <div className="zone-construction-overlay">
                        <div className="zone-construction-text">Building...</div>
                      </div>
                    )}
                  </div>
                )}
                {isPlacing && !isBuilt && (
                  <div className="zone-placement-indicator">
                    <div className="zone-placement-icon">{config?.icon}</div>
                    <div className="zone-placement-text">Place here</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {showModal && (
        <BuildingModal
          building={showModal}
          gameState={gameState}
          onClose={() => setShowModal(null)}
          onUpgrade={onUpgrade}
        />
      )}
    </div>
  );
}

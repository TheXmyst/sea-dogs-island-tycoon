import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getBuildingPosition, BUILDING_POSITIONS } from '../config/islandLayout';
import { getBuildingConfig } from '../config/buildings';
import BuildingModal from './BuildingModal';
import ConstructionMenu from './ConstructionMenu';
import './IslandView.css';

export default function IslandView({ gameState, onBuild, onUpgrade, onOpenConstruction }) {
  const [placingBuilding, setPlacingBuilding] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showConstructionMenu, setShowConstructionMenu] = useState(false);
  
  // Drag/pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [islandPosition, setIslandPosition] = useState({ x: 0, y: 0 });
  const [islandScale, setIslandScale] = useState(1);
  const islandContainerRef = useRef(null);
  
  // Touch state for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [lastTouchDistance, setLastTouchDistance] = useState(null);

  const handleSelectBuilding = (buildingId) => {
    setPlacingBuilding(buildingId);
    setHoveredZone(buildingId);
  };

  // Drag/pan handlers
  const handleMouseDown = (e) => {
    // Don't start drag if clicking on a building zone, button, or modal
    if (
      e.target.closest('.building-zone') || 
      e.target.closest('.action-btn') ||
      e.target.closest('.building-modal') ||
      e.target.closest('.construction-menu')
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - islandPosition.x,
      y: e.clientY - islandPosition.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Calculate new position
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Get container dimensions
    const container = islandContainerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = containerRect.width;
      const viewportHeight = containerRect.height;
      
      // Island image is 16:9 aspect ratio
      // Container is 150% of viewport (width and height)
      const containerWidth = viewportWidth * 1.5;
      const containerHeight = viewportHeight * 1.5;
      
      // Calculate actual island size based on 16:9 ratio
      // Island takes up most of the container, let's say 70% of container width
      const islandDisplayWidth = containerWidth * 0.7 * islandScale;
      const islandDisplayHeight = islandDisplayWidth / (16/9); // 16:9 aspect ratio
      
      // Container offset: left: -25%, top: -25% means it starts at -25% of viewport
      const containerOffsetX = -viewportWidth * 0.25;
      const containerOffsetY = -viewportHeight * 0.25;
      
      // Calculate limits: island should stay within viewport bounds
      // The island center should not go beyond viewport edges
      const padding = 50; // Padding from edges
      
      // X limits: island center can move from (viewport left + island half-width) to (viewport right - island half-width)
      const minX = containerOffsetX + (islandDisplayWidth / 2) - padding;
      const maxX = containerOffsetX + viewportWidth - (islandDisplayWidth / 2) + padding;
      
      // Y limits: ensure island stays within vertical bounds
      // The island center Y position should be constrained
      const minY = containerOffsetY + (islandDisplayHeight / 2) - padding;
      const maxY = containerOffsetY + viewportHeight - (islandDisplayHeight / 2) + padding;
      
      // Only clamp if limits are valid (min < max)
      if (minX < maxX) {
        newX = Math.max(minX, Math.min(maxX, newX));
      }
      // ALWAYS clamp Y to prevent infinite vertical dragging
      // For 16:9 image, height should be smaller than viewport, so limits should be valid
      // Force clamp - if limits are invalid, use safe bounds
      const effectiveMinY = minY < maxY ? minY : (containerOffsetY + viewportHeight / 2 - islandDisplayHeight / 2);
      const effectiveMaxY = minY < maxY ? maxY : (containerOffsetY + viewportHeight / 2 + islandDisplayHeight / 2);
      newY = Math.max(effectiveMinY, Math.min(effectiveMaxY, newY));
    }
    
    setIslandPosition({
      x: newX,
      y: newY,
    });
  }, [isDragging, dragStart, islandScale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e) => {
    // Don't start drag if clicking on a building zone, button, or modal
    if (
      e.target.closest('.building-zone') || 
      e.target.closest('.action-btn') ||
      e.target.closest('.building-modal') ||
      e.target.closest('.construction-menu')
    ) {
      return;
    }

    if (e.touches.length === 1) {
      // Single touch - start pan
      const touch = e.touches[0];
      setIsDragging(true);
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setDragStart({
        x: touch.clientX - islandPosition.x,
        y: touch.clientY - islandPosition.y,
      });
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastTouchDistance(distance);
      setIsDragging(false);
    }
    e.preventDefault();
  }, [islandPosition]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging && touchStart) {
      // Single touch - pan
      const touch = e.touches[0];
      let newX = touch.clientX - dragStart.x;
      let newY = touch.clientY - dragStart.y;
      
      // Apply same clamping logic as mouse move
      const container = islandContainerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = containerRect.width;
        const viewportHeight = containerRect.height;
        const containerWidth = viewportWidth * 1.5;
        const islandDisplayWidth = containerWidth * 0.7 * islandScale;
        const islandDisplayHeight = islandDisplayWidth / (16/9);
        const containerOffsetX = -viewportWidth * 0.25;
        const containerOffsetY = -viewportHeight * 0.25;
        const padding = 50;
        const minX = containerOffsetX + (islandDisplayWidth / 2) - padding;
        const maxX = containerOffsetX + viewportWidth - (islandDisplayWidth / 2) + padding;
        const minY = containerOffsetY + (islandDisplayHeight / 2) - padding;
        const maxY = containerOffsetY + viewportHeight - (islandDisplayHeight / 2) + padding;
        
        if (minX < maxX) {
          newX = Math.max(minX, Math.min(maxX, newX));
        }
        const effectiveMinY = minY < maxY ? minY : (containerOffsetY + viewportHeight / 2 - islandDisplayHeight / 2);
        const effectiveMaxY = minY < maxY ? maxY : (containerOffsetY + viewportHeight / 2 + islandDisplayHeight / 2);
        newY = Math.max(effectiveMinY, Math.min(effectiveMaxY, newY));
      }
      
      setIslandPosition({ x: newX, y: newY });
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scaleChange = distance / lastTouchDistance;
      const newScale = Math.max(0.8, Math.min(1.5, islandScale * scaleChange));
      setIslandScale(newScale);
      setLastTouchDistance(distance);
      
      // Re-clamp position after zoom
      const container = islandContainerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = containerRect.width;
        const viewportHeight = containerRect.height;
        const containerWidth = viewportWidth * 1.5;
        const islandDisplayWidth = containerWidth * 0.7 * newScale;
        const islandDisplayHeight = islandDisplayWidth / (16/9);
        const containerOffsetX = -viewportWidth * 0.25;
        const containerOffsetY = -viewportHeight * 0.25;
        const padding = 50;
        const minX = containerOffsetX + (islandDisplayWidth / 2) - padding;
        const maxX = containerOffsetX + viewportWidth - (islandDisplayWidth / 2) + padding;
        const minY = containerOffsetY + (islandDisplayHeight / 2) - padding;
        const maxY = containerOffsetY + viewportHeight - (islandDisplayHeight / 2) + padding;
        
        setIslandPosition(prev => {
          let clampedX = prev.x;
          let clampedY = prev.y;
          if (minX < maxX) {
            clampedX = Math.max(minX, Math.min(maxX, prev.x));
          }
          if (minY < maxY) {
            clampedY = Math.max(minY, Math.min(maxY, prev.y));
          } else {
            const centerY = containerOffsetY + viewportHeight / 2;
            clampedY = Math.max(centerY - islandDisplayHeight / 2, Math.min(centerY + islandDisplayHeight / 2, prev.y));
          }
          return { x: clampedX, y: clampedY };
        });
      }
    }
    e.preventDefault();
  }, [isDragging, touchStart, dragStart, islandScale, lastTouchDistance]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouchStart(null);
    setLastTouchDistance(null);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.8, Math.min(1.5, islandScale * delta)); // Limit zoom range
    setIslandScale(newScale);
    
    // Re-clamp position after zoom to ensure island stays within bounds
    const container = islandContainerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = containerRect.width;
      const viewportHeight = containerRect.height;
      
      const containerWidth = viewportWidth * 1.5;
      const islandDisplayWidth = containerWidth * 0.7 * newScale;
      const islandDisplayHeight = islandDisplayWidth / (16/9);
      
      const containerOffsetX = -viewportWidth * 0.25;
      const containerOffsetY = -viewportHeight * 0.25;
      const padding = 50;
      
      const minX = containerOffsetX + (islandDisplayWidth / 2) - padding;
      const maxX = containerOffsetX + viewportWidth - (islandDisplayWidth / 2) + padding;
      const minY = containerOffsetY + (islandDisplayHeight / 2) - padding;
      const maxY = containerOffsetY + viewportHeight - (islandDisplayHeight / 2) + padding;
      
      setIslandPosition(prev => {
        let clampedX = prev.x;
        let clampedY = prev.y;
        
        if (minX < maxX) {
          clampedX = Math.max(minX, Math.min(maxX, prev.x));
        }
        // Always clamp Y if limits are valid
        if (minY < maxY) {
          clampedY = Math.max(minY, Math.min(maxY, prev.y));
        } else {
          // If limits are invalid, still try to keep island roughly centered vertically
          const centerY = containerOffsetY + viewportHeight / 2;
          clampedY = Math.max(centerY - islandDisplayHeight / 2, Math.min(centerY + islandDisplayHeight / 2, prev.y));
        }
        
        return { x: clampedX, y: clampedY };
      });
    }
  }, [islandScale]);
  
  // Reset island position to center
  const handleResetPosition = () => {
    setIslandPosition({ x: 0, y: 0 });
    setIslandScale(1);
  };

  // Cleanup event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Add wheel event listener with non-passive option
  useEffect(() => {
    const container = islandContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  return (
    <div className="island-view">

      {/* Island display - fullscreen */}
      <div 
        className="island-display"
        ref={islandContainerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <div 
          className="island-container"
          style={{
            transform: `translate(${islandPosition.x}px, ${islandPosition.y}px) scale(${islandScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div 
            className="island-background"
            data-no-image={!imageLoaded}
          >
            <img 
              src="/island-background.png" 
              alt="Pirate Island" 
              style={{ display: 'none' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
          </div>
          
          {/* Building zones overlay - moves with island */}
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
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag when clicking on zone
                  if (placingBuilding === buildingType && !isBuilt) {
                    onBuild(buildingType, position.x, position.y);
                    setPlacingBuilding(null);
                    setHoveredZone(null);
                  } else if (isBuilt) {
                    setShowModal(building);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on zones
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
      </div>

      {/* Action buttons bar - at bottom, semi-transparent */}
      <div className="island-action-bar">
        <button 
          className="action-btn construction-btn"
          onClick={() => setShowConstructionMenu(true)}
        >
          <span className="btn-icon">🏗️</span>
          <span className="btn-label">Build</span>
        </button>
        <button 
          className="action-btn upgrade-btn"
          onClick={() => {
            // Show upgrade info or open first building modal
            const firstBuilding = gameState.buildings[0];
            if (firstBuilding) {
              setShowModal(firstBuilding);
            }
          }}
        >
          <span className="btn-icon">⬆️</span>
          <span className="btn-label">Upgrade</span>
        </button>
        <button 
          className="action-btn reset-btn"
          onClick={handleResetPosition}
          title="Reset island position and zoom"
        >
          <span className="btn-icon">🎯</span>
          <span className="btn-label">Reset</span>
        </button>
      </div>

      {/* Construction Menu */}
      <ConstructionMenu
        gameState={gameState}
        onSelectBuilding={handleSelectBuilding}
        isOpen={showConstructionMenu}
        onClose={() => setShowConstructionMenu(false)}
      />

      {/* Building Modal */}
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


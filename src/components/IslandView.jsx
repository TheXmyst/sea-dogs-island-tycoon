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
  
  // Touch state for mobile - use refs for immediate access
  const touchStartRef = useRef(null);
  const lastTouchDistanceRef = useRef(null);
  const isDraggingTouchRef = useRef(false);

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

  // Calculate image dimensions and limits based on 5000x3500 (10:7 ratio)
  const getImageLimits = useCallback(() => {
    const container = islandContainerRef.current;
    if (!container) return null;
    
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = containerRect.width;
    const viewportHeight = containerRect.height;
    
    // Image dimensions: 5000x3500, ratio = 10:7 ≈ 1.42857
    const imageRatio = 5000 / 3500; // 1.42857
    const viewportRatio = viewportWidth / viewportHeight;
    
    // With background-size: cover, calculate actual displayed image size
    let displayedWidth, displayedHeight;
    if (viewportRatio > imageRatio) {
      // Viewport is wider than image ratio - height fills viewport
      displayedHeight = viewportHeight * islandScale;
      displayedWidth = displayedHeight * imageRatio;
    } else {
      // Viewport is taller than image ratio - width fills viewport
      displayedWidth = viewportWidth * islandScale;
      displayedHeight = displayedWidth / imageRatio;
    }
    
    // Calculate how much image extends beyond viewport
    const overflowX = Math.max(0, displayedWidth - viewportWidth);
    const overflowY = Math.max(0, displayedHeight - viewportHeight);
    
    // Limits for dragging: can't drag more than the overflow
    const minX = -overflowX / 2;
    const maxX = overflowX / 2;
    const minY = -overflowY / 2;
    const maxY = overflowY / 2;
    
    return {
      displayedWidth,
      displayedHeight,
      overflowX,
      overflowY,
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [islandScale]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Calculate new position
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Get limits and clamp position
    const limits = getImageLimits();
    if (limits) {
      newX = Math.max(limits.minX, Math.min(limits.maxX, newX));
      newY = Math.max(limits.minY, Math.min(limits.maxY, newY));
    }
    
    setIslandPosition({
      x: newX,
      y: newY,
    });
  }, [isDragging, dragStart, getImageLimits]);

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
      isDraggingTouchRef.current = true;
      setIsDragging(true);
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
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
      lastTouchDistanceRef.current = distance;
      isDraggingTouchRef.current = false;
      setIsDragging(false);
    }
    e.preventDefault();
  }, [islandPosition]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDraggingTouchRef.current && touchStartRef.current) {
      // Single touch - pan
      const touch = e.touches[0];
      let newX = touch.clientX - dragStart.x;
      let newY = touch.clientY - dragStart.y;
      
      // Apply same clamping logic as mouse move
      const limits = getImageLimits();
      if (limits) {
        newX = Math.max(limits.minX, Math.min(limits.maxX, newX));
        newY = Math.max(limits.minY, Math.min(limits.maxY, newY));
      }
      
      setIslandPosition({ x: newX, y: newY });
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scaleChange = distance / lastTouchDistanceRef.current;
      
      const container = islandContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = containerRect.width;
      const viewportHeight = containerRect.height;
      const imageRatio = 5000 / 3500;
      const maxScale = 3.0;
      const minScale = 1.0;
      
      const newScale = Math.max(minScale, Math.min(maxScale, islandScale * scaleChange));
      setIslandScale(newScale);
      lastTouchDistanceRef.current = distance;
      
      // Re-clamp position after zoom
      const viewportRatio = viewportWidth / viewportHeight;
      const newLimits = (() => {
        let displayedWidth, displayedHeight;
        if (viewportRatio > imageRatio) {
          displayedHeight = viewportHeight * newScale;
          displayedWidth = displayedHeight * imageRatio;
        } else {
          displayedWidth = viewportWidth * newScale;
          displayedHeight = displayedWidth / imageRatio;
        }
        
        const overflowX = Math.max(0, displayedWidth - viewportWidth);
        const overflowY = Math.max(0, displayedHeight - viewportHeight);
        
        return {
          minX: -overflowX / 2,
          maxX: overflowX / 2,
          minY: -overflowY / 2,
          maxY: overflowY / 2,
        };
      })();
      
      setIslandPosition(prev => ({
        x: Math.max(newLimits.minX, Math.min(newLimits.maxX, prev.x)),
        y: Math.max(newLimits.minY, Math.min(newLimits.maxY, prev.y)),
      }));
    }
    e.preventDefault();
  }, [dragStart, islandScale, getImageLimits]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingTouchRef.current = false;
    touchStartRef.current = null;
    lastTouchDistanceRef.current = null;
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    
    // Calculate new scale with limits
    const container = islandContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = containerRect.width;
    const viewportHeight = containerRect.height;
    const imageRatio = 5000 / 3500;
    const viewportRatio = viewportWidth / viewportHeight;
    
    // Calculate min/max scale based on viewport
    // Min scale: image should at least fill viewport (cover behavior)
    // Max scale: reasonable limit (e.g., 3x)
    let minScale = 1.0;
    if (viewportRatio > imageRatio) {
      // Viewport wider - height determines scale
      minScale = 1.0;
    } else {
      // Viewport taller - width determines scale
      minScale = 1.0;
    }
    const maxScale = 3.0;
    
    const newScale = Math.max(minScale, Math.min(maxScale, islandScale * delta));
    setIslandScale(newScale);
    
    // Re-clamp position after zoom
    const newLimits = (() => {
      let displayedWidth, displayedHeight;
      if (viewportRatio > imageRatio) {
        displayedHeight = viewportHeight * newScale;
        displayedWidth = displayedHeight * imageRatio;
      } else {
        displayedWidth = viewportWidth * newScale;
        displayedHeight = displayedWidth / imageRatio;
      }
      
      const overflowX = Math.max(0, displayedWidth - viewportWidth);
      const overflowY = Math.max(0, displayedHeight - viewportHeight);
      
      return {
        minX: -overflowX / 2,
        maxX: overflowX / 2,
        minY: -overflowY / 2,
        maxY: overflowY / 2,
      };
    })();
    
    setIslandPosition(prev => ({
      x: Math.max(newLimits.minX, Math.min(newLimits.maxX, prev.x)),
      y: Math.max(newLimits.minY, Math.min(newLimits.maxY, prev.y)),
    }));
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
              src="/island-background.jpg" 
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

      {/* Action buttons removed - using round buttons in navigation instead */}

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


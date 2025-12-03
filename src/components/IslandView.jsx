import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getBuildingPosition, BUILDING_POSITIONS } from '../config/islandLayout';
import { getBuildingConfig } from '../config/buildings';
import BuildingModal from './BuildingModal';
import ConstructionMenu from './ConstructionMenu';
import { debugAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import './IslandView.css';

export default function IslandView({ gameState, onBuild, onUpgrade, onOpenConstruction }) {
  const { t } = useTranslation();
  const [placingBuilding, setPlacingBuilding] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showConstructionMenu, setShowConstructionMenu] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [lastClickPos, setLastClickPos] = useState(null);
  const [captureMode, setCaptureMode] = useState(null); // 'current' or 'desired'
  const [currentPosition, setCurrentPosition] = useState(null);
  const [desiredPosition, setDesiredPosition] = useState(null);
  
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
    // Don't start drag if clicking on a building zone, button, modal, navigation, or resource bar
    if (
      e.target.closest('.building-zone') || 
      e.target.closest('.action-btn') ||
      e.target.closest('.building-modal') ||
      e.target.closest('.construction-menu') ||
      e.target.closest('.navigation') ||
      e.target.closest('.resource-hud') ||
      e.target.closest('.nav-item')
    ) {
      return;
    }
    
    // Helper function to calculate image coordinates from click
    const getImageCoordinates = (clientX, clientY) => {
      const container = islandContainerRef.current;
      if (!container) return null;
      
      const rect = container.getBoundingClientRect();
      const viewportWidth = rect.width;
      const viewportHeight = rect.height;
      const imageRatio = 5000 / 3500; // 10:7 ≈ 1.42857
      const viewportRatio = viewportWidth / viewportHeight;
      
      // Calculate actual displayed image dimensions with cover
      let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;
      if (viewportRatio > imageRatio) {
        displayedHeight = viewportHeight;
        displayedWidth = displayedHeight * imageRatio;
        offsetX = (viewportWidth - displayedWidth) / 2;
      } else {
        displayedWidth = viewportWidth;
        displayedHeight = displayedWidth / imageRatio;
        offsetY = (viewportHeight - displayedHeight) / 2;
      }
      
      // Calculate click position relative to the displayed image
      const clickX = clientX - rect.left - offsetX;
      const clickY = clientY - rect.top - offsetY;
      
      // Convert to percentage of displayed image
      let x = (clickX / displayedWidth) * 100;
      let y = (clickY / displayedHeight) * 100;
      
      // If capturing desired position for a zone, adjust to center the zone on the click point
      // Zones are positioned by their top-left corner, so we need to offset by half the zone size
      if (captureMode === 'desired' && currentPosition) {
        const position = BUILDING_POSITIONS[currentPosition.buildingType];
        if (position) {
          const zoneWidthPercent = parseFloat(position.zone.width);
          const zoneHeightPercent = parseFloat(position.zone.height);
          // Adjust to center the zone on the click point
          x = x - (zoneWidthPercent / 2);
          y = y - (zoneHeightPercent / 2);
        }
      }
      
      return { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) };
    };

    // Debug mode: show click coordinates or capture positions
    if (debugMode) {
      // If capturing desired position, save it
      if (captureMode === 'desired') {
        const coords = getImageCoordinates(e.clientX, e.clientY);
        if (coords) {
          setDesiredPosition(coords);
          setCaptureMode(null);
          console.log(`Desired position captured: left: ${coords.x}%, top: ${coords.y}%`);
        }
        e.preventDefault();
        return;
      }
      
      // Normal debug click - just show coordinates
      const coords = getImageCoordinates(e.clientX, e.clientY);
      if (coords) {
        setLastClickPos({ 
          x: coords.x.toFixed(2), 
          y: coords.y.toFixed(2)
        });
        console.log(`Click position (relative to image): left: ${coords.x}%, top: ${coords.y}%`);
      }
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    // Store the initial mouse position and current island position
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    e.preventDefault();
    e.stopPropagation();
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
    // The container itself is 100% of viewport, but the image inside scales
    let displayedWidth, displayedHeight;
    if (viewportRatio > imageRatio) {
      // Viewport is wider than image ratio - height fills viewport, width extends
      displayedHeight = viewportHeight * islandScale;
      displayedWidth = displayedHeight * imageRatio;
    } else {
      // Viewport is taller than image ratio - width fills viewport, height extends
      displayedWidth = viewportWidth * islandScale;
      displayedHeight = displayedWidth / imageRatio;
    }
    
    // Calculate how much image extends beyond viewport
    const overflowX = Math.max(0, displayedWidth - viewportWidth);
    const overflowY = Math.max(0, displayedHeight - viewportHeight);
    
    // Limits for dragging: can't drag more than the overflow
    // When there's no overflow, allow small movement for smooth UX
    const minX = overflowX > 0 ? -overflowX / 2 : -10;
    const maxX = overflowX > 0 ? overflowX / 2 : 10;
    const minY = overflowY > 0 ? -overflowY / 2 : -10;
    const maxY = overflowY > 0 ? overflowY / 2 : 10;
    
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
    
    // Calculate the delta (how much the mouse moved)
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Apply delta to current position
    let newX = islandPosition.x + deltaX;
    let newY = islandPosition.y + deltaY;
    
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
    
    // Update dragStart to current position for smooth continuous dragging
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  }, [isDragging, dragStart, islandPosition, getImageLimits]);

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
        x: touch.clientX,
        y: touch.clientY,
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
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      // Apply delta to current position
      let newX = islandPosition.x + deltaX;
      let newY = islandPosition.y + deltaY;
      
      // Apply same clamping logic as mouse move
      const limits = getImageLimits();
      if (limits) {
        newX = Math.max(limits.minX, Math.min(limits.maxX, newX));
        newY = Math.max(limits.minY, Math.min(limits.maxY, newY));
      }
      
      setIslandPosition({ x: newX, y: newY });
      
      // Update dragStart for smooth continuous dragging
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
      });
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

  // Debug mode toggle with Ctrl+Shift+A key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
      {/* Debug position panel */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#ffd700',
          padding: '16px',
          borderRadius: '8px',
          zIndex: 1000,
          border: '2px solid #ffd700',
          fontFamily: 'monospace',
          fontSize: '12px',
          minWidth: '280px',
          maxWidth: '320px'
        }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>🔧 Debug position</div>
          <div style={{ marginBottom: '8px', fontSize: '10px', color: '#aaa' }}>
            Press Ctrl+Shift+A to toggle
          </div>
          
          {/* Capture buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setCaptureMode('current');
                setCurrentPosition(null);
              }}
              style={{
                padding: '6px 12px',
                background: captureMode === 'current' ? '#ffd700' : 'rgba(212, 175, 55, 0.2)',
                color: captureMode === 'current' ? '#000' : '#ffd700',
                border: '1px solid #ffd700',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              {captureMode === 'current' ? '⏸ Click zone...' : '📍 Capturer position actuelle'}
            </button>
            <button
              onClick={() => {
                setCaptureMode('desired');
                setDesiredPosition(null);
              }}
              style={{
                padding: '6px 12px',
                background: captureMode === 'desired' ? '#4CAF50' : 'rgba(76, 175, 80, 0.2)',
                color: captureMode === 'desired' ? '#fff' : '#4CAF50',
                border: '1px solid #4CAF50',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              {captureMode === 'desired' ? '⏸ Click image...' : '🎯 Capturer position désirée'}
            </button>
          </div>
          
          {/* Current position */}
          {currentPosition && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Position actuelle ({currentPosition.buildingType}):</div>
              <div style={{ color: '#fff' }}>
                left: {currentPosition.x}%<br/>
                top: {currentPosition.y}%
              </div>
            </div>
          )}
          
          {/* Desired position */}
          {desiredPosition && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Position désirée:</div>
              <div style={{ color: '#fff' }}>
                left: {desiredPosition.x}%<br/>
                top: {desiredPosition.y}%
              </div>
            </div>
          )}
          
          {/* Error calculation */}
          {currentPosition && desiredPosition && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255, 100, 100, 0.2)', borderRadius: '4px', border: '1px solid #ff6464' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff6464' }}>Erreur:</div>
              <div style={{ color: '#fff' }}>
                Δleft: {(desiredPosition.x - currentPosition.x).toFixed(2)}%<br/>
                Δtop: {(desiredPosition.y - currentPosition.y).toFixed(2)}%
              </div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#4CAF50' }}>Coordonnées corrigées:</div>
                <div style={{ color: '#fff', fontSize: '11px' }}>
                  left: {desiredPosition.x}%<br/>
                  top: {desiredPosition.y}%
                </div>
                <button
                  onClick={async () => {
                    // Check if we're in production (deployed environment)
                    const isProduction = window.location.hostname !== 'localhost' && 
                                       window.location.hostname !== '127.0.0.1';
                    
                    const position = BUILDING_POSITIONS[currentPosition.buildingType];
                    const code = `  ${currentPosition.buildingType}: {\n    x: ${position.x},\n    y: ${position.y},\n    description: '${position.description}',\n    zone: {\n      left: '${desiredPosition.x}%',\n      top: '${desiredPosition.y}%',\n      width: '${position.zone.width}',\n      height: '${position.zone.height}',\n    },\n  },`;
                    
                    if (isProduction) {
                      // In production, copy to clipboard
                      navigator.clipboard.writeText(code).then(() => {
                        alert('✅ Code copié dans le presse-papier !\n\n📝 Étapes :\n1. Ouvrez src/config/islandLayout.js\n2. Trouvez la section ' + currentPosition.buildingType + '\n3. Collez le code copié\n4. Poussez sur Git');
                      });
                      return;
                    }
                    
                    // Try direct save in development
                    try {
                      await debugAPI.updateBuildingPosition(
                        currentPosition.buildingType,
                        `${desiredPosition.x}%`,
                        `${desiredPosition.y}%`
                      );
                      alert(`✅ Position sauvegardée pour ${currentPosition.buildingType} !\nRechargez la page pour voir les changements.`);
                      // Reset positions after saving
                      setCurrentPosition(null);
                      setDesiredPosition(null);
                    } catch (error) {
                      console.error('Erreur lors de la sauvegarde:', error);
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(code).then(() => {
                        alert(`❌ Erreur de sauvegarde: ${error.message}\n\n✅ Code copié dans le presse-papier.\nAssurez-vous que le backend est démarré (cd backend && npm run dev)`);
                      });
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  💾 Sauvegarder
                </button>
              </div>
            </div>
          )}
          
          {/* Last click */}
          {lastClickPos && !currentPosition && !desiredPosition && (
            <div style={{ marginTop: '12px', color: '#fff', fontSize: '11px' }}>
              Last click:<br/>
              left: {lastClickPos.x}%<br/>
              top: {lastClickPos.y}%
            </div>
          )}
        </div>
      )}

      {/* Construction button - top right corner */}
      <button
        className="construction-floating-btn"
        onClick={() => setShowConstructionMenu(true)}
        title="Construire un bâtiment"
      >
        <span className="construction-icon">🔨</span>
      </button>

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
            
            // Calculate zone position relative to the actual displayed image (with cover)
            const container = islandContainerRef.current;
            let zoneStyle = {
              left: position.zone.left,
              top: position.zone.top,
              width: position.zone.width,
              height: position.zone.height,
            };
            
            if (container) {
              const rect = container.getBoundingClientRect();
              const viewportWidth = rect.width;
              const viewportHeight = rect.height;
              const imageRatio = 5000 / 3500; // 10:7 ≈ 1.42857
              const viewportRatio = viewportWidth / viewportHeight;
              
              // Calculate actual displayed image dimensions with cover
              let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;
              if (viewportRatio > imageRatio) {
                // Viewport is wider - height fills viewport, width extends
                displayedHeight = viewportHeight;
                displayedWidth = displayedHeight * imageRatio;
                offsetX = (viewportWidth - displayedWidth) / 2;
              } else {
                // Viewport is taller - width fills viewport, height extends
                displayedWidth = viewportWidth;
                displayedHeight = displayedWidth / imageRatio;
                offsetY = (viewportHeight - displayedHeight) / 2;
              }
              
              // Convert percentage positions to pixels relative to displayed image, then back to percentage of container
              const zoneLeftPercent = parseFloat(position.zone.left);
              const zoneTopPercent = parseFloat(position.zone.top);
              
              // Position relative to displayed image
              const zoneLeftPx = (zoneLeftPercent / 100) * displayedWidth;
              const zoneTopPx = (zoneTopPercent / 100) * displayedHeight;
              
              // Convert to percentage of container
              zoneStyle = {
                left: `${((offsetX + zoneLeftPx) / viewportWidth) * 100}%`,
                top: `${((offsetY + zoneTopPx) / viewportHeight) * 100}%`,
                width: position.zone.width,
                height: position.zone.height,
              };
            }
            
            return (
              <div
                key={buildingType}
                className={`building-zone ${isBuilt ? 'built' : ''} ${isHovered ? 'hovered' : ''} ${isPlacing ? 'placing' : ''}`}
                style={zoneStyle}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on zones
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag when clicking on zone
                  
                  // Debug mode: capture current position
                  if (debugMode && captureMode === 'current') {
                    const container = islandContainerRef.current;
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      const viewportWidth = rect.width;
                      const viewportHeight = rect.height;
                      const imageRatio = 5000 / 3500;
                      const viewportRatio = viewportWidth / viewportHeight;
                      
                      let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;
                      if (viewportRatio > imageRatio) {
                        displayedHeight = viewportHeight;
                        displayedWidth = displayedHeight * imageRatio;
                        offsetX = (viewportWidth - displayedWidth) / 2;
                      } else {
                        displayedWidth = viewportWidth;
                        displayedHeight = displayedWidth / imageRatio;
                        offsetY = (viewportHeight - displayedHeight) / 2;
                      }
                      
                      // Get zone center position relative to displayed image
                      const zoneLeftPercent = parseFloat(position.zone.left);
                      const zoneTopPercent = parseFloat(position.zone.top);
                      const zoneLeftPx = (zoneLeftPercent / 100) * displayedWidth;
                      const zoneTopPx = (zoneTopPercent / 100) * displayedHeight;
                      
                      // Convert to percentage of displayed image
                      const x = (zoneLeftPx / displayedWidth) * 100;
                      const y = (zoneTopPx / displayedHeight) * 100;
                      
                      setCurrentPosition({ 
                        x: parseFloat(x.toFixed(2)), 
                        y: parseFloat(y.toFixed(2)),
                        buildingType 
                      });
                      setCaptureMode(null);
                      console.log(`Current position captured for ${buildingType}: left: ${x.toFixed(2)}%, top: ${y.toFixed(2)}%`);
                    }
                    return;
                  }
                  
                  if (placingBuilding === buildingType && !isBuilt) {
                    onBuild(buildingType, position.x, position.y);
                    setPlacingBuilding(null);
                    setHoveredZone(null);
                  } else if (isBuilt) {
                    setShowModal(building);
                  }
                }}
                onMouseEnter={() => setHoveredZone(buildingType)}
                onMouseLeave={() => setHoveredZone(null)}
                title={isBuilt ? `${t(`buildings.items.${buildingType}.name`, config?.name)} (${t('buildings.clickToView')})` : `${t(`buildings.items.${buildingType}.name`, config?.name)} - ${position.description}`}
              >
                {isBuilt && (
                  <div className="zone-building-indicator">
                    <div className="zone-building-icon">{config?.icon}</div>
                    <div className="zone-building-level">{t('buildings.level')}.{building.level}</div>
                    {building.isConstructing && (
                      <div className="zone-construction-overlay">
                        <div className="zone-construction-text">{t('buildings.constructing')}</div>
                      </div>
                    )}
                  </div>
                )}
                {isPlacing && !isBuilt && (
                  <div className="zone-placement-indicator">
                    <div className="zone-placement-icon">{config?.icon}</div>
                    <div className="zone-placement-text">{t('buildings.placeHere')}</div>
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


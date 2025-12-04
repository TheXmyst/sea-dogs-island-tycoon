import React, { useState, useEffect, useRef, useCallback } from 'react';
import { seaAPI } from '../services/api';
import AnimatedSea from './AnimatedSea';
import './SeaView.css';

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3; // Augmenté pour plus de zoom
const DEFAULT_ZOOM = 1.8; // Zoom par défaut plus fort

export default function SeaView({ gameState, userId, selectedShip, isActive = true }) {
  const [seaMap, setSeaMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerSeaId, setPlayerSeaId] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Calculate viewport dimensions
  const getViewportSize = useCallback(() => {
    if (!containerRef.current) {
      return { width: window.innerWidth, height: window.innerHeight - 100 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  // Clamp pan to stay within map boundaries
  const clampPan = useCallback((newPan, currentZoom) => {
    const viewport = getViewportSize();
    const scaledMapWidth = MAP_WIDTH * currentZoom;
    const scaledMapHeight = MAP_HEIGHT * currentZoom;
    
    const maxPanX = 0;
    const minPanX = viewport.width - scaledMapWidth;
    const maxPanY = 0;
    const minPanY = viewport.height - scaledMapHeight;
    
    return {
      x: Math.max(minPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(minPanY, Math.min(maxPanY, newPan.y)),
    };
  }, [getViewportSize]);

  // Désactiver le scroll de la page quand on est sur l'onglet Sea
  useEffect(() => {
    // Désactiver le scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Réactiver le scroll quand on quitte l'onglet
      document.body.style.overflow = '';
    };
  }, []);

  // Centrer sur l'île du joueur quand le composant est monté ou quand la position change
  const centerOnPlayerIsland = useCallback(() => {
    if (playerPosition && containerRef.current) {
      const viewport = getViewportSize();
      const centerPan = {
        x: -playerPosition.x * DEFAULT_ZOOM + viewport.width / 2,
        y: -playerPosition.y * DEFAULT_ZOOM + viewport.height / 2,
      };
      setPan(clampPan(centerPan, DEFAULT_ZOOM));
      setZoom(DEFAULT_ZOOM);
    }
  }, [playerPosition, getViewportSize, clampPan]);

  // Load player's sea assignment and map
  useEffect(() => {
    const loadSeaMap = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // First, ensure player is assigned to a sea
        const assignResult = await seaAPI.assignPlayerToSea(userId);
        if (!assignResult.success) {
          throw new Error(assignResult.error || 'Failed to assign sea');
        }
        
        setPlayerSeaId(assignResult.seaId);
        setPlayerPosition(assignResult.position);
        
        // Load sea map
        const mapResult = await seaAPI.getSeaMap(assignResult.seaId);
        if (!mapResult.success) {
          throw new Error(mapResult.error || 'Failed to load sea map');
        }
        
        setSeaMap(mapResult);
        
        // Center view on player's island avec zoom par défaut
        if (assignResult.position) {
          setTimeout(() => {
            centerOnPlayerIsland();
          }, 200);
        }
      } catch (err) {
        console.error('Load sea map error:', err);
        setError(err.message || 'Failed to load sea map');
      } finally {
        setLoading(false);
      }
    };
    
    loadSeaMap();
  }, [userId, centerOnPlayerIsland]);

  // Recentrer quand la position du joueur change ou quand le composant devient actif
  useEffect(() => {
    if (playerPosition && isActive) {
      // Petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        centerOnPlayerIsland();
      }, 100);
    }
  }, [playerPosition, isActive, centerOnPlayerIsland]);

  const handleIslandClick = (island) => {
    if (island.playerId === userId) {
      setSelectedTarget(null); // Deselect own island
      return;
    }
    setSelectedTarget({
      type: 'island',
      ...island,
    });
  };

  const handleEventClick = (event) => {
    setSelectedTarget({
      type: 'event',
      ...event,
    });
  };

  const handleNavigate = async () => {
    if (!selectedTarget || !selectedShip) {
      alert('Please select a target and a ship first!');
      return;
    }
    
    // TODO: Implement navigation logic
    alert(`Navigation to ${selectedTarget.type} not yet implemented`);
  };

  // Handle zoom with limits
  const handleZoom = useCallback((delta, centerX = null, centerY = null) => {
    setZoom(prevZoom => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + delta));
      
      // If zooming at a specific point, adjust pan to keep that point under cursor
      if (centerX !== null && centerY !== null && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = centerX - rect.left;
        const relativeY = centerY - rect.top;
        
        // Get current pan state
        setPan(prevPan => {
          // Calculate the world position at the cursor
          const worldX = (relativeX - prevPan.x) / prevZoom;
          const worldY = (relativeY - prevPan.y) / prevZoom;
          
          // Calculate new pan to keep world position under cursor
          const newPanX = relativeX - worldX * newZoom;
          const newPanY = relativeY - worldY * newZoom;
          
          return clampPan({ x: newPanX, y: newPanY }, newZoom);
        });
      } else {
        // Just clamp the current pan with new zoom
        setPan(prevPan => clampPan(prevPan, newZoom));
      }
      
      return newZoom;
    });
  }, [clampPan]);

  // Handle drag start
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
    e.preventDefault();
  }, [pan]);

  // Handle drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newPan = {
      x: panStart.x + deltaX,
      y: panStart.y + deltaY,
    };
    
    setPan(clampPan(newPan, zoom));
    e.preventDefault();
  }, [isDragging, dragStart, panStart, zoom, clampPan]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta, e.clientX, e.clientY);
  }, [handleZoom]);

  // Update pan when zoom changes to keep it clamped
  useEffect(() => {
    setPan(prevPan => clampPan(prevPan, zoom));
  }, [zoom, clampPan]);

  if (loading) {
    return (
      <div className="sea-view">
        <div className="sea-loading">
          <p>🌊 Loading sea map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sea-view">
        <div className="sea-error">
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!seaMap) {
    return (
      <div className="sea-view">
        <div className="sea-error">
          <p>No sea map data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sea-view">
      <div className="sea-header">
        <h2>🌊 {seaMap.sea.name}</h2>
        <div className="sea-info">
          <span>Islands: {seaMap.sea.currentIslands}/{seaMap.sea.maxIslands}</span>
          {selectedShip && (
            <span className="selected-ship">
              Ship: {selectedShip.type} ({Math.ceil(selectedShip.hp)}/{selectedShip.maxHp} HP)
            </span>
          )}
        </div>
      </div>

      <div className="sea-controls">
        <button onClick={() => handleZoom(0.1)} disabled={zoom >= MAX_ZOOM}>🔍+</button>
        <button onClick={() => handleZoom(-0.1)} disabled={zoom <= MIN_ZOOM}>🔍-</button>
        <button onClick={() => {
          centerOnPlayerIsland();
        }}>📍 Center</button>
        <div className="zoom-indicator">{Math.round(zoom * 100)}%</div>
      </div>

      <div 
        ref={containerRef}
        className={`sea-map-container ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Mer animée avec Pixi.js en arrière-plan */}
        <div 
          className="animated-sea-wrapper"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <AnimatedSea width={MAP_WIDTH} height={MAP_HEIGHT} />
        </div>

        <div 
          className="sea-map"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Render islands */}
          {seaMap.islands.map((island) => {
            const isPlayerIsland = island.playerId === userId;
            const isSelected = selectedTarget?.type === 'island' && selectedTarget.playerId === island.playerId;
            
            return (
              <div
                key={island.playerId}
                className={`island-marker ${isPlayerIsland ? 'player-island' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${island.position.x}px`,
                  top: `${island.position.y}px`,
                }}
                onClick={() => handleIslandClick(island)}
                title={isPlayerIsland ? 'Your Island' : `Island of ${island.username}`}
              >
                {isPlayerIsland ? '🏝️' : '🏝️'}
                {!isPlayerIsland && <span className="island-label">{island.username}</span>}
              </div>
            );
          })}

          {/* Render events */}
          {seaMap.events.map((event) => {
            const isSelected = selectedTarget?.type === 'event' && selectedTarget.id === event.id;
            
            return (
              <div
                key={event.id}
                className={`event-marker event-${event.type} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${event.position.x}px`,
                  top: `${event.position.y}px`,
                }}
                onClick={() => handleEventClick(event)}
                title={`${event.name} - ${event.type.toUpperCase()}`}
              >
                {event.type === 'pvp' && '⚔️'}
                {event.type === 'pve' && '👹'}
                {event.type === 'treasure' && '💎'}
                {event.type === 'raid' && '🏴‍☠️'}
                <span className="event-label">{event.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTarget && (
        <div className="sea-target-info">
          <h3>
            {selectedTarget.type === 'island' ? '🏝️' : '🎯'} {selectedTarget.type === 'island' ? selectedTarget.username : selectedTarget.name}
          </h3>
          {selectedTarget.type === 'event' && (
            <div>
              <p>{selectedTarget.description}</p>
              <p>Required Level: {selectedTarget.requiredLevel}</p>
              {selectedTarget.rewards && (
                <p>Rewards: {JSON.stringify(selectedTarget.rewards)}</p>
              )}
            </div>
          )}
          {playerPosition && (
            <div>
              <p>Distance: {Math.round(
                Math.sqrt(
                  Math.pow(selectedTarget.position.x - playerPosition.x, 2) +
                  Math.pow(selectedTarget.position.y - playerPosition.y, 2)
                )
              )} units</p>
            </div>
          )}
          {selectedShip && (
            <button onClick={handleNavigate} className="navigate-button">
              🚢 Navigate
            </button>
          )}
        </div>
      )}
    </div>
  );
}


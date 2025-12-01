import React, { useState, useEffect } from 'react';
import { seaAPI } from '../services/api';
import './SeaView.css';

export default function SeaView({ gameState, userId, selectedShip }) {
  const [seaMap, setSeaMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerSeaId, setPlayerSeaId] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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
        
        // Center view on player's island
        if (assignResult.position) {
          setPan({
            x: -assignResult.position.x + window.innerWidth / 2,
            y: -assignResult.position.y + window.innerHeight / 2,
          });
        }
      } catch (err) {
        console.error('Load sea map error:', err);
        setError(err.message || 'Failed to load sea map');
      } finally {
        setLoading(false);
      }
    };
    
    loadSeaMap();
  }, [userId]);

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

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

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
        <button onClick={() => handleZoom(0.1)}>🔍+</button>
        <button onClick={() => handleZoom(-0.1)}>🔍-</button>
        <button onClick={() => {
          if (playerPosition) {
            setPan({
              x: -playerPosition.x + window.innerWidth / 2,
              y: -playerPosition.y + window.innerHeight / 2,
            });
            setZoom(1);
          }
        }}>📍 Center</button>
      </div>

      <div 
        className="sea-map-container"
        onWheel={(e) => {
          e.preventDefault();
          handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
        }}
      >
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


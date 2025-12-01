import React, { useState } from 'react';
import './DevTools.css';

/**
 * Dev Tools Panel - For testing and development
 * Access with Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * Can be disabled in production
 */
export default function DevTools({ gameState, onAddResources, onAddDiamonds, onCompleteBuildings, onCompleteResearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [resourceAmount, setResourceAmount] = useState(1000);
  const [diamondAmount, setDiamondAmount] = useState(100);

  // Toggle with keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D (or Cmd+Shift+D on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddResource = (resourceType) => {
    if (onAddResources) {
      onAddResources({
        [resourceType]: resourceAmount,
      });
    }
  };

  const handleAddAllResources = () => {
    if (onAddResources) {
      onAddResources({
        gold: resourceAmount,
        wood: resourceAmount,
        rum: resourceAmount,
        stone: resourceAmount,
        food: resourceAmount,
        crew: resourceAmount,
        cannons: resourceAmount,
      });
    }
  };

  const handleAddDiamonds = () => {
    if (onAddDiamonds) {
      onAddDiamonds(diamondAmount);
    }
  };

  const handleCompleteAllBuildings = () => {
    if (onCompleteBuildings) {
      onCompleteBuildings();
    }
  };

  const handleCompleteAllResearch = () => {
    if (onCompleteResearch) {
      onCompleteResearch();
    }
  };

  return (
    <div className="dev-tools-overlay" onClick={() => setIsOpen(false)}>
      <div className="dev-tools-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dev-tools-header">
          <h3>🛠️ Dev Tools</h3>
          <button className="dev-tools-close" onClick={() => setIsOpen(false)}>✖</button>
        </div>

        <div className="dev-tools-content">
          {/* Resources Section */}
          <div className="dev-tools-section">
            <h4>💰 Resources</h4>
            <div className="dev-tools-input-group">
              <label>Amount:</label>
              <input
                type="number"
                value={resourceAmount}
                onChange={(e) => setResourceAmount(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="dev-tools-buttons">
              <button onClick={() => handleAddResource('gold')}>+ Gold</button>
              <button onClick={() => handleAddResource('wood')}>+ Wood</button>
              <button onClick={() => handleAddResource('rum')}>+ Rum</button>
              <button onClick={() => handleAddResource('stone')}>+ Stone</button>
              <button onClick={() => handleAddResource('food')}>+ Food</button>
              <button onClick={() => handleAddResource('crew')}>+ Crew</button>
              <button onClick={() => handleAddResource('cannons')}>+ Cannons</button>
              <button className="dev-tools-button-all" onClick={handleAddAllResources}>
                + All Resources
              </button>
            </div>
          </div>

          {/* Premium Currency */}
          <div className="dev-tools-section">
            <h4>💎 Premium</h4>
            <div className="dev-tools-input-group">
              <label>Diamonds:</label>
              <input
                type="number"
                value={diamondAmount}
                onChange={(e) => setDiamondAmount(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="dev-tools-buttons">
              <button onClick={handleAddDiamonds}>+ Diamonds</button>
              <button onClick={() => onAddDiamonds && onAddDiamonds(1000)}>+ 1000 Diamonds</button>
            </div>
          </div>

          {/* Time Skip */}
          <div className="dev-tools-section">
            <h4>⏰ Time Skip</h4>
            <div className="dev-tools-buttons">
              <button onClick={handleCompleteAllBuildings}>Complete All Buildings</button>
              <button onClick={handleCompleteAllResearch}>Complete All Research</button>
            </div>
          </div>

          {/* Current State Display */}
          <div className="dev-tools-section">
            <h4>📊 Current State</h4>
            <div className="dev-tools-state">
              <p><strong>Gold:</strong> {gameState.resources.gold}</p>
              <p><strong>Wood:</strong> {gameState.resources.wood}</p>
              <p><strong>Diamonds:</strong> {gameState.resources.diamonds}</p>
              <p><strong>Buildings:</strong> {gameState.buildings.length}</p>
              <p><strong>Ships:</strong> {gameState.ships.length}</p>
            </div>
          </div>
        </div>

        <div className="dev-tools-footer">
          <p>Press <kbd>Ctrl+Shift+D</kbd> to toggle | <kbd>Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}


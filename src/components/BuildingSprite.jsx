import React, { useState } from 'react';
import { getBuildingSprite, getBuildingSpriteWithFallback } from '../utils/buildingSprites';
import './BuildingSprite.css';

/**
 * Composant pour afficher le sprite d'un bâtiment selon son niveau
 */
export default function BuildingSprite({ buildingId, level, icon, className = '', style = {} }) {
  const [imageError, setImageError] = useState(false);
  
  // Essayer d'obtenir le sprite, avec fallback sur l'icône
  const spritePath = getBuildingSprite(buildingId, level);
  const fallback = icon || '🏛️';
  
  // Si l'image a échoué ou si on utilise le fallback
  if (imageError) {
    return (
      <div className={`building-sprite-fallback ${className}`} style={style}>
        {fallback}
      </div>
    );
  }
  
  // Essayer d'afficher le sprite
  return (
    <div className={`building-sprite-container ${className}`} style={style}>
      <img
        src={spritePath}
        alt={`${buildingId} level ${level}`}
        className="building-sprite-image"
        onError={() => setImageError(true)}
        style={style}
      />
    </div>
  );
}


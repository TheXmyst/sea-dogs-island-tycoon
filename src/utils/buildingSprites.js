/**
 * Gestion des sprites de bâtiments basés sur le niveau
 * Chaque bâtiment peut avoir différents sprites selon son niveau
 */

/**
 * Obtient le chemin du sprite pour un bâtiment à un niveau donné
 * @param {string} buildingId - ID du bâtiment (ex: 'town_hall')
 * @param {number} level - Niveau du bâtiment (1-30)
 * @returns {string} Chemin vers le sprite
 */
export function getBuildingSprite(buildingId, level) {
  // Niveau minimum 1, maximum 30
  const normalizedLevel = Math.max(1, Math.min(30, Math.floor(level)));
  
  // Pour le Town Hall, on peut avoir jusqu'à 30 sprites différents
  // Format: /buildings/{building_id}/level_{level:02d}.png
  return `/buildings/${buildingId}/${buildingId}_level_${String(normalizedLevel).padStart(2, '0')}.png`;
}

/**
 * Obtient le sprite avec fallback si l'image n'existe pas
 * @param {string} buildingId - ID du bâtiment
 * @param {number} level - Niveau du bâtiment
 * @param {string} fallbackIcon - Icône emoji de fallback
 * @returns {string|object} Chemin du sprite ou icône
 */
export function getBuildingSpriteWithFallback(buildingId, level, fallbackIcon = '🏛️') {
  // Pour l'instant, on retourne l'icône par défaut
  // Une fois les sprites extraits, on utilisera getBuildingSprite
  // Le composant BuildingSprite gère automatiquement le fallback
  return getBuildingSprite(buildingId, level);
}

/**
 * Vérifie si un sprite existe pour un niveau donné
 * @param {string} buildingId - ID du bâtiment
 * @param {number} level - Niveau du bâtiment
 * @returns {boolean}
 */
export function hasBuildingSprite(buildingId, level) {
  // Pour l'instant, on retourne false
  // Une fois les sprites extraits, on vérifiera l'existence du fichier
  return false;
}

/**
 * Obtient tous les niveaux disponibles pour un bâtiment
 * @param {string} buildingId - ID du bâtiment
 * @returns {number[]} Liste des niveaux disponibles
 */
export function getAvailableLevels(buildingId) {
  // Pour l'instant, on retourne tous les niveaux de 1 à 30
  // Une fois les sprites extraits, on lira les métadonnées
  return Array.from({ length: 30 }, (_, i) => i + 1);
}


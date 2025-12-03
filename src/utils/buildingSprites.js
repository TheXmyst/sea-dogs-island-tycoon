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
  
  // Mapping des niveaux aux sprites disponibles
  // Si le bâtiment a moins de 30 sprites, on mappe les niveaux aux sprites disponibles
  const spriteMapping = getSpriteMapping(buildingId, normalizedLevel);
  
  // Format: /buildings/{building_id}/level_{sprite_level:02d}.png
  return `/buildings/${buildingId}/${buildingId}_level_${String(spriteMapping).padStart(2, '0')}.png`;
}

/**
 * Mappe un niveau de bâtiment au sprite correspondant
 * @param {string} buildingId - ID du bâtiment
 * @param {number} level - Niveau du bâtiment (1-30)
 * @returns {number} Numéro du sprite (1-6 pour town_hall)
 */
function getSpriteMapping(buildingId, level) {
  // Pour le Town Hall, on a 6 sprites pour 30 niveaux
  // Distribution: 5 niveaux par sprite
  if (buildingId === 'town_hall') {
    // Niveaux 1-5 → sprite 1
    // Niveaux 6-10 → sprite 2
    // Niveaux 11-15 → sprite 3
    // Niveaux 16-20 → sprite 4
    // Niveaux 21-25 → sprite 5
    // Niveaux 26-30 → sprite 6
    return Math.min(6, Math.ceil(level / 5));
  }
  
  // Pour les autres bâtiments, on assume qu'ils ont un sprite par niveau
  return level;
}

/**
 * Obtient le sprite avec fallback si l'image n'existe pas
 * @param {string} buildingId - ID du bâtiment
 * @param {number} level - Niveau du bâtiment
 * @param {string} fallbackIcon - Icône emoji de fallback
 * @returns {string|object} Chemin du sprite ou icône
 */
export function getBuildingSpriteWithFallback(buildingId, level, fallbackIcon = '🏛️') {
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


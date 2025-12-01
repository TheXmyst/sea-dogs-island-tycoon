/**
 * Island layout configuration
 * Defines fixed positions for each building type on the island
 * Based on the island image with dock, trees, path, and rocks
 */

// Island grid dimensions (adjusted for the island shape)
export const ISLAND_GRID = {
  width: 12,
  height: 10,
  cellSize: 60, // pixels
};

/**
 * Fixed building positions on the island
 * Each building type has a predefined position (x, y) and a visual zone
 * Only one building of each type can be built
 */
export const BUILDING_POSITIONS = {
  town_hall: {
    x: 5,
    y: 2,
    description: 'Center-north, near the large tree',
    zone: {
      left: '51.37%',
      top: '44.48%',
      width: '6%',
      height: '6%',
    },
  },
  dock: {
    x: 9,
    y: 7,
    description: 'Southeast, at the dock location',
    // Updated with improved debug coordinates
    zone: {
      left: '5.28%',
      top: '76.47%',
      width: '6%',
      height: '6%',
    },
  },
  gold_mine: {
    x: 2,
    y: 4,
    description: 'West side, near rocks',
    // Updated with improved debug coordinates
    zone: {
      left: '77.38%',
      top: '55.73%',
      width: '6%',
      height: '6%',
    },
  },
  lumber_mill: {
    x: 1,
    y: 2,
    description: 'Northwest, near vegetation',
    // Positioned based on debug coordinates (bucheron) - keeping previous value
    zone: {
      left: '50.37%',
      top: '32.47%',
      width: '6%',
      height: '6%',
    },
  },
  quarry: {
    x: 3,
    y: 6,
    description: 'Southwest, near large rocks',
    // Positioned near the sandy beach area with rocks (bottom-left)
    zone: {
      left: '15%',
      top: '68%',
      width: '6%',
      height: '7%',
    },
  },
  distillery: {
    x: 6,
    y: 5,
    description: 'Center, along the path',
    // Updated with improved debug coordinates
    zone: {
      left: '56.93%',
      top: '67.80%',
      width: '6%',
      height: '6%',
    },
  },
  tavern: {
    x: 8,
    y: 3,
    description: 'Northeast, near the path',
    // Updated with corrected coordinates from debug
    zone: {
      left: '37.5%',
      top: '49.74%',
      width: '6%',
      height: '6%',
    },
  },
};

/**
 * Get the position for a building type
 * @param {string} buildingType - Building type ID
 * @returns {object|null} Position object with x, y or null if not found
 */
export function getBuildingPosition(buildingType) {
  return BUILDING_POSITIONS[buildingType] || null;
}

/**
 * Check if a position is valid for a building type
 * @param {string} buildingType - Building type ID
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position matches the predefined position
 */
export function isValidBuildingPosition(buildingType, x, y) {
  const position = getBuildingPosition(buildingType);
  if (!position) return false;
  return position.x === x && position.y === y;
}

/**
 * Get all available positions for buildings
 * @returns {Array} Array of position objects
 */
export function getAllBuildingPositions() {
  return Object.entries(BUILDING_POSITIONS).map(([type, pos]) => ({
    type,
    ...pos,
  }));
}


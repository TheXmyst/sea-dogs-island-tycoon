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
    // Zone coordinates as percentage of island image (for visual overlay) - reduced size
    zone: {
      left: '40%',
      top: '15%',
      width: '12%',
      height: '12%',
    },
  },
  dock: {
    x: 9,
    y: 7,
    description: 'Southeast, at the dock location',
    zone: {
      left: '70%',
      top: '60%',
      width: '15%',
      height: '18%',
    },
  },
  gold_mine: {
    x: 2,
    y: 4,
    description: 'West side, near rocks',
    zone: {
      left: '10%',
      top: '35%',
      width: '12%',
      height: '12%',
    },
  },
  lumber_mill: {
    x: 1,
    y: 2,
    description: 'Northwest, near vegetation',
    zone: {
      left: '5%',
      top: '15%',
      width: '12%',
      height: '12%',
    },
  },
  quarry: {
    x: 3,
    y: 6,
    description: 'Southwest, near large rocks',
    zone: {
      left: '20%',
      top: '55%',
      width: '12%',
      height: '15%',
    },
  },
  distillery: {
    x: 6,
    y: 5,
    description: 'Center, along the path',
    zone: {
      left: '45%',
      top: '40%',
      width: '12%',
      height: '12%',
    },
  },
  tavern: {
    x: 8,
    y: 3,
    description: 'Northeast, near the path',
    zone: {
      left: '65%',
      top: '20%',
      width: '12%',
      height: '12%',
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


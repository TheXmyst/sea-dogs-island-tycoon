/**
 * Ship configuration data
 */
export const SHIPS = {
  SLOOP: {
    id: 'sloop',
    name: 'Small Sloop',
    description: 'Fast and agile, perfect for quick raids.',
    icon: '⛵',
    stats: {
      speed: 10,
      hp: 50,
      maxHp: 50,
      attack: 15,
      defense: 5,
    },
    cost: {
      gold: 500,
      wood: 200,
      rum: 50,
      crew: 10,
    },
    buildTime: 60, // seconds
    repairCostMultiplier: 0.3, // 30% of build cost to fully repair
  },
  BRIGANTINE: {
    id: 'brigantine',
    name: 'Brigantine',
    description: 'A balanced ship for versatile combat.',
    icon: '🚢',
    stats: {
      speed: 7,
      hp: 100,
      maxHp: 100,
      attack: 25,
      defense: 10,
    },
    cost: {
      gold: 1000,
      wood: 400,
      rum: 100,
      crew: 20,
    },
    buildTime: 120,
    repairCostMultiplier: 0.3,
  },
  GALLEON: {
    id: 'galleon',
    name: 'Galleon',
    description: 'A powerful warship, slow but devastating.',
    icon: '🏴‍☠️',
    stats: {
      speed: 4,
      hp: 200,
      maxHp: 200,
      attack: 40,
      defense: 20,
    },
    cost: {
      gold: 2500,
      wood: 1000,
      rum: 250,
      crew: 50,
    },
    buildTime: 300,
    repairCostMultiplier: 0.3,
  },
};

/**
 * Get ship config by ID
 */
export function getShipConfig(shipId) {
  return SHIPS[shipId.toUpperCase()] || null;
}

/**
 * Calculate repair cost for a ship
 */
export function calculateRepairCost(ship, shipConfig) {
  const damagePercent = 1 - (ship.hp / ship.maxHp);
  const repairCost = {};
  
  Object.keys(shipConfig.cost).forEach(resource => {
    repairCost[resource] = Math.ceil(shipConfig.cost[resource] * shipConfig.repairCostMultiplier * damagePercent);
  });
  
  return repairCost;
}


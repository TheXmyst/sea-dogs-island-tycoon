/**
 * Crew/Sailor recruitment system
 * Specialized crew types with different abilities
 */

export const CREW_TYPE = {
  WARRIOR: 'warrior',
  ARCHER: 'archer',
  HUNTER: 'hunter',
};

/**
 * Crew type definitions
 */
export const CREW_TYPES = {
  WARRIOR: {
    id: CREW_TYPE.WARRIOR,
    name: 'Warrior',
    description: 'Melee fighter specialized in close combat. Increases ship attack.',
    icon: '⚔️',
    cost: {
      gold: 50,
      rum: 20,
    },
    stats: {
      attack: 5,
      defense: 3,
      hp: 10,
    },
    shipBonus: {
      attack: 0.05, // +5% ship attack per warrior
    },
  },
  ARCHER: {
    id: CREW_TYPE.ARCHER,
    name: 'Archer',
    description: 'Ranged fighter with high accuracy. Increases ship attack and speed.',
    icon: '🏹',
    cost: {
      gold: 60,
      rum: 25,
    },
    stats: {
      attack: 4,
      defense: 2,
      hp: 8,
    },
    shipBonus: {
      attack: 0.04, // +4% ship attack per archer
      speed: 0.03, // +3% ship speed per archer
    },
  },
  HUNTER: {
    id: CREW_TYPE.HUNTER,
    name: 'Hunter',
    description: 'Scout and tracker. Increases loot rewards and exploration speed.',
    icon: '🎯',
    cost: {
      gold: 55,
      rum: 22,
    },
    stats: {
      attack: 3,
      defense: 4,
      hp: 9,
    },
    shipBonus: {
      lootBonus: 0.08, // +8% loot per hunter
      explorationSpeed: 0.05, // +5% exploration speed per hunter
    },
  },
};

/**
 * Get crew type config
 */
export function getCrewTypeConfig(crewTypeId) {
  return CREW_TYPES[crewTypeId.toUpperCase()] || null;
}

/**
 * Calculate crew bonuses for a ship
 */
export function calculateCrewBonuses(crew, shipStats) {
  const bonuses = {
    attack: 0,
    defense: 0,
    speed: 0,
    lootBonus: 0,
    explorationSpeed: 0,
  };
  
  crew.forEach(crewMember => {
    const config = getCrewTypeConfig(crewMember.type);
    if (!config || !config.shipBonus) return;
    
    Object.keys(config.shipBonus).forEach(bonusType => {
      if (bonuses.hasOwnProperty(bonusType)) {
        bonuses[bonusType] += config.shipBonus[bonusType];
      }
    });
  });
  
  // Apply bonuses to ship stats
  return {
    attack: Math.floor(shipStats.attack * (1 + bonuses.attack)),
    defense: Math.floor(shipStats.defense * (1 + bonuses.defense)),
    speed: Math.floor(shipStats.speed * (1 + bonuses.speed)),
    lootBonus: bonuses.lootBonus,
    explorationSpeed: bonuses.explorationSpeed,
  };
}

/**
 * Get total crew stats
 */
export function getTotalCrewStats(crew) {
  return crew.reduce((total, member) => {
    const config = getCrewTypeConfig(member.type);
    if (!config) return total;
    
    return {
      attack: total.attack + config.stats.attack,
      defense: total.defense + config.stats.defense,
      hp: total.hp + config.stats.hp,
    };
  }, { attack: 0, defense: 0, hp: 0 });
}


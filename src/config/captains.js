/**
 * Captain configuration data
 * Collectible female pirate characters with rarity, roles, and buffs
 */

export const CAPTAIN_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const CAPTAIN_ROLE = {
  COMBAT: 'combat',
  ECONOMY: 'economy',
  EXPLORATION: 'exploration',
  SUPPORT: 'support',
  COMMERCE: 'commerce',
};

/**
 * Captain definitions
 * Each captain has unique stats, buffs, and visual identity
 */
export const CAPTAINS = {
  // Common Captains
  ANNE_SHARP: {
    id: 'anne_sharp',
    name: 'Anne Sharp',
    rarity: CAPTAIN_RARITY.COMMON,
    role: CAPTAIN_ROLE.COMBAT,
    portrait: '⚔️',
    description: 'A fierce fighter with a quick blade and unwavering courage.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
    },
    buffs: {
      shipAttack: 0.05, // +5% ship attack
      shipDefense: 0.02, // +2% ship defense
    },
  },
  MARY_READ: {
    id: 'mary_read',
    name: 'Mary Read',
    rarity: CAPTAIN_RARITY.COMMON,
    role: CAPTAIN_ROLE.ECONOMY,
    portrait: '💰',
    description: 'Efficient manager of island resources and trade routes.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
    },
    buffs: {
      buildTimeReduction: 0.03, // -3% build time
      resourceProduction: 0.05, // +5% resource production
    },
  },
  GRACE_O_MALLEY: {
    id: 'grace_o_malley',
    name: 'Grace O\'Malley',
    rarity: CAPTAIN_RARITY.COMMON,
    role: CAPTAIN_ROLE.EXPLORATION,
    portrait: '🗺️',
    description: 'Skilled navigator and explorer of uncharted waters.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
    },
    buffs: {
      lootBonus: 0.08, // +8% loot from battles
      missionSpeed: 0.05, // +5% mission completion speed
    },
  },
  SARAH_KIDD: {
    id: 'sarah_kidd',
    name: 'Sarah Kidd',
    rarity: CAPTAIN_RARITY.COMMON,
    role: CAPTAIN_ROLE.SUPPORT,
    portrait: '🛡️',
    description: 'A supportive leader who boosts crew morale and efficiency.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
    },
    buffs: {
      shipHP: 0.04, // +4% ship HP
      buildTimeReduction: 0.02, // -2% build time
    },
  },
  
  // Rare Captains
  CHARLOTTE_BADGER: {
    id: 'charlotte_badger',
    name: 'Charlotte Badger',
    rarity: CAPTAIN_RARITY.RARE,
    role: CAPTAIN_ROLE.COMBAT,
    portrait: '⚔️',
    description: 'Veteran warrior with unmatched experience in naval combat.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 150,
    },
    buffs: {
      shipAttack: 0.10, // +10% ship attack
      shipHP: 0.08, // +8% ship HP
      shipDefense: 0.05, // +5% ship defense
    },
  },
  RACHEL_WALL: {
    id: 'rachel_wall',
    name: 'Rachel Wall',
    rarity: CAPTAIN_RARITY.RARE,
    role: CAPTAIN_ROLE.ECONOMY,
    portrait: '💎',
    description: 'Master trader and resource optimizer with keen business sense.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 150,
    },
    buffs: {
      buildTimeReduction: 0.08, // -8% build time
      resourceProduction: 0.12, // +12% resource production
      storageBonus: 0.10, // +10% storage capacity
    },
  },
  ISABELLA_BLACK: {
    id: 'isabella_black',
    name: 'Isabella Black',
    rarity: CAPTAIN_RARITY.RARE,
    role: CAPTAIN_ROLE.EXPLORATION,
    portrait: '🌊',
    description: 'Daring explorer who discovers hidden treasures and secret routes.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 150,
    },
    buffs: {
      lootBonus: 0.12, // +12% loot from battles
      missionSpeed: 0.08, // +8% mission completion speed
      shipSpeed: 0.05, // +5% ship speed
    },
  },
  
  // Epic Captains
  ANNE_BONNY: {
    id: 'anne_bonny',
    name: 'Anne Bonny',
    rarity: CAPTAIN_RARITY.EPIC,
    role: CAPTAIN_ROLE.COMBAT,
    portrait: '🔥',
    description: 'Legendary fighter feared across the seas, known for her ferocity.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 200,
    },
    buffs: {
      shipAttack: 0.15, // +15% ship attack
      shipHP: 0.12, // +12% ship HP
      shipDefense: 0.10, // +10% ship defense
      shipSpeed: 0.05, // +5% ship speed
    },
  },
  CHING_SHIH: {
    id: 'ching_shih',
    name: 'Ching Shih',
    rarity: CAPTAIN_RARITY.EPIC,
    role: CAPTAIN_ROLE.SUPPORT,
    portrait: '👑',
    description: 'Strategic mastermind and fleet commander with unmatched leadership.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 200,
    },
    buffs: {
      shipAttack: 0.10, // +10% ship attack
      shipDefense: 0.12, // +12% ship defense
      buildTimeReduction: 0.10, // -10% build time
      resourceProduction: 0.08, // +8% resource production
    },
  },
  ELENA_CRIMSON: {
    id: 'elena_crimson',
    name: 'Elena Crimson',
    rarity: CAPTAIN_RARITY.EPIC,
    role: CAPTAIN_ROLE.ECONOMY,
    portrait: '💍',
    description: 'Wealthy merchant captain who maximizes profits and trade efficiency.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 200,
    },
    buffs: {
      resourceProduction: 0.15, // +15% resource production
      buildTimeReduction: 0.12, // -12% build time
      lootBonus: 0.08, // +8% loot from battles
      storageBonus: 0.10, // +10% storage capacity
    },
  },
  
  // Legendary Captains
  NADIA: {
    id: 'nadia',
    name: 'Nadia',
    rarity: CAPTAIN_RARITY.LEGENDARY,
    role: CAPTAIN_ROLE.COMBAT,
    portrait: '/captains/nadia.png', // Image path instead of emoji
    description: 'The Red-Haired Fury, a legendary pirate captain feared across all seas.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 300,
    },
    buffs: {
      shipAttack: 0.25, // +25% ship attack (stronger than other legendaries)
      shipHP: 0.20, // +20% ship HP
      shipDefense: 0.18, // +18% ship defense
      shipSpeed: 0.15, // +15% ship speed
      lootBonus: 0.15, // +15% loot from battles
      resourceProduction: 0.10, // +10% resource production
    },
  },
  SAYYIDA_AL_HURRA: {
    id: 'sayyida_al_hurra',
    name: 'Sayyida al-Hurra',
    rarity: CAPTAIN_RARITY.LEGENDARY,
    role: CAPTAIN_ROLE.SUPPORT,
    portrait: '👑',
    description: 'Queen of the seas, master of all trades and supreme commander.',
    baseStats: {
      level: 1,
      xp: 0,
      xpToNext: 300,
    },
    buffs: {
      shipAttack: 0.12, // +12% ship attack
      shipDefense: 0.12, // +12% ship defense
      buildTimeReduction: 0.15, // -15% build time
      resourceProduction: 0.15, // +15% resource production
      lootBonus: 0.12, // +12% loot from battles
      missionSpeed: 0.10, // +10% mission completion speed
    },
  },
};

/**
 * Gacha rates (percentages)
 */
export const GACHA_RATES = {
  [CAPTAIN_RARITY.COMMON]: 70,
  [CAPTAIN_RARITY.RARE]: 25,
  [CAPTAIN_RARITY.EPIC]: 4,
  [CAPTAIN_RARITY.LEGENDARY]: 1,
};

/**
 * Get captain config by ID
 */
export function getCaptainConfig(captainId) {
  return Object.values(CAPTAINS).find(c => c.id === captainId) || null;
}

/**
 * Get captains by rarity
 */
export function getCaptainsByRarity(rarity) {
  return Object.values(CAPTAINS).filter(c => c.rarity === rarity);
}

/**
 * Calculate XP required for next level
 */
export function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Perform gacha pull with pity system
 * Pity system: Separate counters for Epic and Legendary
 * - Epic pity resets when Epic is obtained
 * - Legendary pity resets only when Legendary is obtained
 * - Both counters increment on Common/Rare pulls
 */
export function performGachaPull(gameState) {
  const { gachaPity } = gameState;
  
  // Initialize pity counters if they don't exist (backward compatibility)
  const epicPulls = gachaPity.epicPulls !== undefined ? gachaPity.epicPulls : gachaPity.pulls || 0;
  const legendaryPulls = gachaPity.legendaryPulls !== undefined ? gachaPity.legendaryPulls : gachaPity.pulls || 0;
  const guaranteedEpicAt = gachaPity.guaranteedEpicAt || 50;
  const guaranteedLegendaryAt = gachaPity.guaranteedLegendaryAt || 100;
  
  let rarity;
  
  // Check pity system (Legendary has priority)
  if (legendaryPulls >= guaranteedLegendaryAt - 1) {
    rarity = CAPTAIN_RARITY.LEGENDARY;
  } else if (epicPulls >= guaranteedEpicAt - 1) {
    rarity = CAPTAIN_RARITY.EPIC;
  } else {
    // Normal gacha roll
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rar, rate] of Object.entries(GACHA_RATES)) {
      cumulative += rate;
      if (roll <= cumulative) {
        rarity = rar;
        break;
      }
    }
  }
  
  // Select random captain of that rarity
  let availableCaptains = getCaptainsByRarity(rarity);
  
  // If no captain available for this rarity, fallback to legendary (should always have at least one)
  if (availableCaptains.length === 0) {
    console.warn(`No captain available for rarity ${rarity}, falling back to legendary`);
    rarity = CAPTAIN_RARITY.LEGENDARY;
    availableCaptains = getCaptainsByRarity(rarity);
  }
  
  // Safety check: if still no captain, get any available captain
  if (availableCaptains.length === 0) {
    console.error('No captains available at all! Using first available captain.');
    availableCaptains = Object.values(CAPTAINS);
  }
  
  if (availableCaptains.length === 0) {
    throw new Error('No captains configured in the game!');
  }
  
  const selectedCaptain = availableCaptains[Math.floor(Math.random() * availableCaptains.length)];
  
  // Update pity counters based on rarity obtained
  let newEpicPulls, newLegendaryPulls;
  
  if (rarity === CAPTAIN_RARITY.LEGENDARY) {
    // Legendary resets both counters
    newEpicPulls = 0;
    newLegendaryPulls = 0;
  } else if (rarity === CAPTAIN_RARITY.EPIC) {
    // Epic resets only Epic counter, Legendary continues
    newEpicPulls = 0;
    newLegendaryPulls = legendaryPulls + 1;
  } else {
    // Common/Rare increments both counters
    newEpicPulls = epicPulls + 1;
    newLegendaryPulls = legendaryPulls + 1;
  }
  
  return {
    captain: selectedCaptain,
    newPityPulls: newEpicPulls, // Keep for backward compatibility, but use newEpicPulls
    newEpicPulls,
    newLegendaryPulls,
  };
}


/**
 * Gacha system - Server-side logic
 * Secure gacha implementation that cannot be cheated
 */

// Gacha rates (percentages)
const GACHA_RATES = {
  common: 70,
  rare: 25,
  epic: 4,
  legendary: 1,
};

// Captain definitions (simplified for backend)
// In production, you might want to load this from a database or config file
const CAPTAINS = {
  // Common
  anne_sharp: { id: 'anne_sharp', rarity: 'common', role: 'combat' },
  mary_read: { id: 'mary_read', rarity: 'common', role: 'economy' },
  grace_o_malley: { id: 'grace_o_malley', rarity: 'common', role: 'exploration' },
  charlotte_de_berry: { id: 'charlotte_de_berry', rarity: 'common', role: 'support' },
  
  // Rare
  elizabeth_swann: { id: 'elizabeth_swann', rarity: 'rare', role: 'combat' },
  anne_bonny: { id: 'anne_bonny', rarity: 'rare', role: 'economy' },
  mary_killigrew: { id: 'mary_killigrew', rarity: 'rare', role: 'exploration' },
  
  // Epic
  ching_shih: { id: 'ching_shih', rarity: 'epic', role: 'combat' },
  jeanne_de_clisson: { id: 'jeanne_de_clisson', rarity: 'epic', role: 'support' },
  rachel_wall: { id: 'rachel_wall', rarity: 'epic', role: 'economy' },
  
  // Legendary
  nadia_the_red: { id: 'nadia_the_red', rarity: 'legendary', role: 'combat' },
  pirate_queen: { id: 'pirate_queen', rarity: 'legendary', role: 'support' },
};

/**
 * Get captains by rarity
 */
function getCaptainsByRarity(rarity) {
  return Object.values(CAPTAINS).filter(captain => captain.rarity === rarity);
}

/**
 * Perform gacha pull with pity system
 * @param {Object} gachaPity - Current pity state
 * @returns {Object} Result with captain and updated pity
 */
function performGachaPull(gachaPity) {
  // Initialize pity counters
  const epicPulls = gachaPity.epicPulls !== undefined ? gachaPity.epicPulls : gachaPity.pulls || 0;
  const legendaryPulls = gachaPity.legendaryPulls !== undefined ? gachaPity.legendaryPulls : gachaPity.pulls || 0;
  const guaranteedEpicAt = gachaPity.guaranteedEpicAt || 50;
  const guaranteedLegendaryAt = gachaPity.guaranteedLegendaryAt || 100;
  
  let rarity;
  
  // Check pity system (Legendary has priority)
  if (legendaryPulls >= guaranteedLegendaryAt - 1) {
    rarity = 'legendary';
  } else if (epicPulls >= guaranteedEpicAt - 1) {
    rarity = 'epic';
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
  
  // Fallback if no captain available
  if (availableCaptains.length === 0) {
    console.warn(`No captain available for rarity ${rarity}, falling back to legendary`);
    rarity = 'legendary';
    availableCaptains = getCaptainsByRarity(rarity);
  }
  
  if (availableCaptains.length === 0) {
    throw new Error('No captains configured in the game!');
  }
  
  const selectedCaptain = availableCaptains[Math.floor(Math.random() * availableCaptains.length)];
  
  // Update pity counters based on rarity obtained
  let newEpicPulls, newLegendaryPulls;
  
  if (rarity === 'legendary') {
    // Legendary resets both counters
    newEpicPulls = 0;
    newLegendaryPulls = 0;
  } else if (rarity === 'epic') {
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
    newPityPulls: newEpicPulls, // Backward compatibility
    newEpicPulls,
    newLegendaryPulls,
  };
}

export {
  performGachaPull,
  GACHA_RATES,
  CAPTAINS,
};


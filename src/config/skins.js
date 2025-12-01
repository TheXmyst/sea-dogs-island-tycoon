/**
 * Captain Skin configuration
 * Cosmetic items for captains (outfits, frames, auras)
 */

export const SKIN_TYPE = {
  OUTFIT: 'outfit',
  FRAME: 'frame',
  AURA: 'aura',
};

export const SKINS = {
  // Outfits
  OUTFIT_ROYAL: {
    id: 'outfit_royal',
    name: 'Royal Attire',
    type: SKIN_TYPE.OUTFIT,
    description: 'Elegant royal clothing fit for a queen.',
    icon: '👑',
    rarity: 'epic',
    appliesTo: 'all', // 'all' or specific captain IDs
  },
  OUTFIT_BATTLE: {
    id: 'outfit_battle',
    name: 'Battle Armor',
    type: SKIN_TYPE.OUTFIT,
    description: 'Heavy armor for the fiercest battles.',
    icon: '⚔️',
    rarity: 'rare',
    appliesTo: 'all',
  },
  OUTFIT_ELEGANT: {
    id: 'outfit_elegant',
    name: 'Elegant Dress',
    type: SKIN_TYPE.OUTFIT,
    description: 'Beautiful dress for formal occasions.',
    icon: '👗',
    rarity: 'common',
    appliesTo: 'all',
  },
  
  // Frames
  FRAME_GOLD: {
    id: 'frame_gold',
    name: 'Gold Frame',
    type: SKIN_TYPE.FRAME,
    description: 'Prestigious gold portrait frame.',
    icon: '🖼️',
    rarity: 'epic',
    appliesTo: 'all',
  },
  FRAME_SILVER: {
    id: 'frame_silver',
    name: 'Silver Frame',
    type: SKIN_TYPE.FRAME,
    description: 'Elegant silver portrait frame.',
    icon: '🖼️',
    rarity: 'rare',
    appliesTo: 'all',
  },
  FRAME_BRONZE: {
    id: 'frame_bronze',
    name: 'Bronze Frame',
    type: SKIN_TYPE.FRAME,
    description: 'Classic bronze portrait frame.',
    icon: '🖼️',
    rarity: 'common',
    appliesTo: 'all',
  },
  
  // Auras
  AURA_FIRE: {
    id: 'aura_fire',
    name: 'Fire Aura',
    type: SKIN_TYPE.AURA,
    description: 'Burning passion surrounds this captain.',
    icon: '🔥',
    rarity: 'epic',
    appliesTo: 'all',
  },
  AURA_ICE: {
    id: 'aura_ice',
    name: 'Ice Aura',
    type: SKIN_TYPE.AURA,
    description: 'Cool determination emanates from this captain.',
    icon: '❄️',
    rarity: 'rare',
    appliesTo: 'all',
  },
  AURA_STAR: {
    id: 'aura_star',
    name: 'Starlight Aura',
    type: SKIN_TYPE.AURA,
    description: 'Mystical starlight follows this captain.',
    icon: '✨',
    rarity: 'common',
    appliesTo: 'all',
  },
};

/**
 * Get skin config by ID
 */
export function getSkinConfig(skinId) {
  return SKINS[skinId.toUpperCase().replace(/-/g, '_')] || null;
}

/**
 * Get skins by type
 */
export function getSkinsByType(type) {
  return Object.values(SKINS).filter(s => s.type === type);
}

/**
 * Check if skin can be applied to captain
 */
export function canApplySkin(skin, captainId) {
  return skin.appliesTo === 'all' || skin.appliesTo === captainId;
}


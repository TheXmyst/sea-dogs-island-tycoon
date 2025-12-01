/**
 * PvE Battle configuration
 */

import { applyLootBonus } from '../utils/captainBuffs';
import { getLootTechnologyBonus } from '../utils/technologyBuffs';

export const PVE_BATTLES = [
  {
    id: 'camp_1',
    name: 'Bandit Camp',
    description: 'A small group of bandits has set up camp nearby.',
    difficulty: 'easy',
    enemyStats: {
      hp: 30,
      maxHp: 30,
      attack: 8,
      defense: 2,
    },
    rewards: {
      gold: 100,
      wood: 50,
      rum: 20,
    },
    requiredLevel: 1,
  },
  {
    id: 'camp_2',
    name: 'Marauder Outpost',
    description: 'A fortified outpost of hostile marauders.',
    difficulty: 'medium',
    enemyStats: {
      hp: 80,
      maxHp: 80,
      attack: 15,
      defense: 5,
    },
    rewards: {
      gold: 300,
      wood: 150,
      rum: 50,
      stone: 30,
    },
    requiredLevel: 2,
  },
  {
    id: 'camp_3',
    name: 'Pirate Stronghold',
    description: 'A well-defended stronghold of rival pirates.',
    difficulty: 'hard',
    enemyStats: {
      hp: 150,
      maxHp: 150,
      attack: 25,
      defense: 10,
    },
    rewards: {
      gold: 750,
      wood: 400,
      rum: 100,
      stone: 100,
      food: 50,
    },
    requiredLevel: 3,
  },
];

/**
 * Calculate battle outcome
 * Note: Captain buffs should be applied to playerShip stats before calling this
 * @param {object} playerShip - Player ship with stats
 * @param {object} enemyBattle - Enemy battle config
 * @param {object} gameState - Game state for technology bonuses
 */
export function calculateBattle(playerShip, enemyBattle, gameState = null) {
  let playerHp = playerShip.hp;
  let enemyHp = enemyBattle.enemyStats.hp;
  
  // Simple turn-based combat
  while (playerHp > 0 && enemyHp > 0) {
    // Player attacks
    const playerDamage = Math.max(1, playerShip.attack - enemyBattle.enemyStats.defense);
    enemyHp -= playerDamage;
    
    if (enemyHp <= 0) break;
    
    // Enemy attacks
    const enemyDamage = Math.max(1, enemyBattle.enemyStats.attack - playerShip.defense);
    playerHp -= enemyDamage;
  }
  
  const won = playerHp > 0;
  const finalPlayerHp = Math.max(0, playerHp);
  
  // Apply loot bonuses (captain + technology)
  let rewards = won ? { ...enemyBattle.rewards } : null;
  if (rewards && gameState) {
    // Apply captain loot bonus
    rewards = applyLootBonus(rewards, gameState);
    
    // Apply technology loot bonus
    const techLootBonus = getLootTechnologyBonus(gameState);
    if (techLootBonus > 0) {
      Object.keys(rewards).forEach(resource => {
        rewards[resource] = Math.floor(rewards[resource] * (1 + techLootBonus));
      });
    }
  }
  
  return {
    won,
    finalPlayerHp,
    rewards,
  };
}


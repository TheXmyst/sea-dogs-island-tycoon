/**
 * PvE Events and Raids configuration
 * Time-limited events with special rewards
 */

export const EVENT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  LIMITED: 'limited',
  RAID: 'raid',
};

/**
 * Active events configuration
 */
export const EVENTS = [
  {
    id: 'daily_quest_1',
    name: 'Daily Bandit Hunt',
    description: 'Defeat 3 bandit camps to earn daily rewards.',
    type: EVENT_TYPES.DAILY,
    startDate: null, // null = always available
    endDate: null,
    requirements: {
      battles: [
        { battleId: 'camp_1', count: 3 },
      ],
    },
    rewards: {
      diamonds: 50,
      fragments: 5,
      gold: 200,
    },
    repeatable: true,
    cooldown: 86400000, // 24 hours in ms
  },
  {
    id: 'weekly_raid_1',
    name: 'Pirate Fortress Raid',
    description: 'A massive fortress has appeared! Defeat it for legendary rewards.',
    type: EVENT_TYPES.RAID,
    startDate: null,
    endDate: null,
    requirements: {
      battles: [
        { battleId: 'camp_3', count: 1 },
      ],
    },
    rewards: {
      diamonds: 200,
      fragments: 20,
      gold: 1000,
      skins: ['outfit_royal'], // Skin rewards
    },
    repeatable: true,
    cooldown: 604800000, // 7 days in ms
  },
  {
    id: 'limited_event_1',
    name: 'Treasure Hunt',
    description: 'Special limited-time event! Complete all battles for exclusive rewards.',
    type: EVENT_TYPES.LIMITED,
    startDate: Date.now() - 86400000, // Started yesterday
    endDate: Date.now() + 604800000, // Ends in 7 days
    requirements: {
      battles: [
        { battleId: 'camp_1', count: 1 },
        { battleId: 'camp_2', count: 1 },
        { battleId: 'camp_3', count: 1 },
      ],
    },
    rewards: {
      diamonds: 300,
      fragments: 30,
      skins: ['frame_gold', 'aura_fire'],
    },
    repeatable: false,
  },
];

/**
 * Get active events
 */
export function getActiveEvents() {
  const now = Date.now();
  return EVENTS.filter(event => {
    if (event.startDate && event.startDate > now) return false;
    if (event.endDate && event.endDate < now) return false;
    return true;
  });
}

/**
 * Check event progress
 */
export function checkEventProgress(eventId, gameState) {
  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return null;
  
  const eventProgress = gameState.eventProgress || {};
  const progress = eventProgress[eventId] || { battles: {} };
  
  let completed = 0;
  let total = 0;
  
  event.requirements.battles.forEach(req => {
    total += req.count;
    completed += Math.min(req.count, progress.battles?.[req.battleId] || 0);
  });
  
  return {
    completed,
    total,
    progress: total > 0 ? completed / total : 0,
    isComplete: completed >= total,
    battles: progress.battles || {},
  };
}

/**
 * Record battle completion for events
 */
export function recordBattleForEvents(battleId, gameState) {
  const activeEvents = getActiveEvents();
  const eventProgress = { ...(gameState.eventProgress || {}) };
  let updated = false;
  
  activeEvents.forEach(event => {
    const battleReq = event.requirements.battles.find(r => r.battleId === battleId);
    if (battleReq) {
      if (!eventProgress[event.id]) {
        eventProgress[event.id] = { battles: {} };
      }
      if (!eventProgress[event.id].battles[battleId]) {
        eventProgress[event.id].battles[battleId] = 0;
      }
      eventProgress[event.id].battles[battleId] = 
        Math.min(
          battleReq.count,
          eventProgress[event.id].battles[battleId] + 1
        );
      updated = true;
    }
  });
  
  return updated ? eventProgress : gameState.eventProgress;
}

/**
 * Claim event rewards
 */
export function claimEventRewards(eventId, gameState) {
  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return null;
  
  const progress = checkEventProgress(eventId, gameState);
  if (!progress || !progress.isComplete) return null;
  
  const eventProgress = gameState.eventProgress || {};
  const eventData = eventProgress[eventId] || {};
  
  // Check cooldown
  if (event.repeatable && eventData.lastClaimed) {
    const timeSinceClaim = Date.now() - eventData.lastClaimed;
    if (timeSinceClaim < event.cooldown) {
      const hoursRemaining = Math.ceil((event.cooldown - timeSinceClaim) / 3600000);
      return { error: `Event on cooldown. Available in ${hoursRemaining}h` };
    }
  }
  
  // Update event progress
  const newEventProgress = {
    ...eventProgress,
    [eventId]: {
      ...eventData,
      lastClaimed: Date.now(),
      battles: event.repeatable ? {} : eventData.battles, // Reset if repeatable
    },
  };
  
  return {
    rewards: event.rewards,
    eventProgress: newEventProgress,
  };
}


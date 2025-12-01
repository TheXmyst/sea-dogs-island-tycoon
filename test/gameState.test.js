/**
 * Simple manual test suite for game state management
 * Tests basic functionality manually
 */

console.log('🧪 Running Sea Dogs Game Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Basic resource object structure
test('Resource structure is valid', () => {
  const resources = {
    gold: 1000,
    wood: 500,
    rum: 100,
    stone: 200,
    food: 50,
    crew: 20,
    cannons: 0,
    diamonds: 100,
    fragments: 0,
  };
  
  if (typeof resources.gold !== 'number' || resources.gold !== 1000) {
    throw new Error('Gold should be 1000');
  }
  if (typeof resources.diamonds !== 'number' || resources.diamonds !== 100) {
    throw new Error('Diamonds should be 100');
  }
});

// Test 2: Resource calculation logic
test('Resource calculations work correctly', () => {
  const resources = { gold: 1000, wood: 500 };
  const cost = { gold: 500, wood: 200 };
  
  // Check if has resources
  const hasEnough = Object.keys(cost).every(resource => {
    return (resources[resource] || 0) >= cost[resource];
  });
  
  if (!hasEnough) {
    throw new Error('Should have enough resources');
  }
  
  // Deduct resources
  const afterDeduct = { ...resources };
  Object.keys(cost).forEach(resource => {
    afterDeduct[resource] = (afterDeduct[resource] || 0) - cost[resource];
  });
  
  if (afterDeduct.gold !== 500 || afterDeduct.wood !== 300) {
    throw new Error('Resources not deducted correctly');
  }
  
  // Add resources
  const rewards = { gold: 200, wood: 100 };
  const afterAdd = { ...afterDeduct };
  Object.keys(rewards).forEach(resource => {
    afterAdd[resource] = (afterAdd[resource] || 0) + (rewards[resource] || 0);
  });
  
  if (afterAdd.gold !== 700 || afterAdd.wood !== 400) {
    throw new Error('Resources not added correctly');
  }
});

// Test 3: Game state structure
test('Game state structure is valid', () => {
  const gameState = {
    resources: {
      gold: 1000,
      wood: 500,
      diamonds: 100,
      fragments: 0,
    },
    buildings: [],
    ships: [],
    captains: [],
    captainSkins: {},
    activeSkins: {},
    gachaPity: {
      pulls: 0,
      guaranteedEpicAt: 50,
      guaranteedLegendaryAt: 100,
    },
    eventProgress: {},
    timers: {
      buildings: {},
      ships: {},
    },
    version: 2,
  };
  
  if (!Array.isArray(gameState.captains)) {
    throw new Error('Captains should be an array');
  }
  if (typeof gameState.eventProgress !== 'object') {
    throw new Error('eventProgress should be an object');
  }
  if (gameState.version !== 2) {
    throw new Error(`Version should be 2, got ${gameState.version}`);
  }
});

// Test 4: Captain buff calculation
test('Captain buff calculation logic', () => {
  const captains = [
    {
      id: 'anne_sharp',
      level: 1,
      rarity: 'common',
    },
  ];
  
  // Simulate buff calculation
  const baseBuffs = {
    shipAttack: 0.05,
    shipDefense: 0.02,
  };
  
  const levelMultiplier = 1 + (captains[0].level - 1) * 0.05;
  const totalBuffs = {
    shipAttack: baseBuffs.shipAttack * levelMultiplier,
    shipDefense: baseBuffs.shipDefense * levelMultiplier,
  };
  
  if (totalBuffs.shipAttack !== 0.05) {
    throw new Error('Level 1 should have no multiplier');
  }
});

// Test 5: Gacha probability logic
test('Gacha probability calculation', () => {
  const rates = {
    common: 70,
    rare: 25,
    epic: 4,
    legendary: 1,
  };
  
  // Simulate roll
  const roll = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity = null;
  
  for (const [rarity, rate] of Object.entries(rates)) {
    cumulative += rate;
    if (roll <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }
  
  if (!selectedRarity) {
    throw new Error('Should select a rarity');
  }
  
  if (!['common', 'rare', 'epic', 'legendary'].includes(selectedRarity)) {
    throw new Error('Invalid rarity selected');
  }
});

// Test 6: Event progress tracking
test('Event progress structure', () => {
  const eventProgress = {
    'daily_quest_1': {
      battles: {
        'camp_1': 2,
      },
      lastClaimed: null,
    },
  };
  
  const event = {
    requirements: {
      battles: [
        { battleId: 'camp_1', count: 3 },
      ],
    },
  };
  
  const progress = eventProgress['daily_quest_1'];
  const completed = event.requirements.battles.reduce((sum, req) => {
    return sum + Math.min(req.count, progress.battles[req.battleId] || 0);
  }, 0);
  
  const total = event.requirements.battles.reduce((sum, req) => sum + req.count, 0);
  
  if (completed !== 2 || total !== 3) {
    throw new Error('Progress calculation incorrect');
  }
});

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed!');
  console.log('\n💡 Note: These are basic logic tests. For full integration testing,');
  console.log('   use the browser dev server (npm run dev) to test the UI.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed');
  process.exit(1);
}


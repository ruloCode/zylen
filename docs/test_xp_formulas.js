#!/usr/bin/env node

/**
 * Test script to verify XP level calculation formulas
 * Run with: node docs/test_xp_formulas.js
 */

// User level calculation (350 base, 1.12 multiplier)
function calculateUserLevel(totalXP) {
  if (totalXP < 350) return 1;
  return Math.floor(Math.log(totalXP / 350) / Math.log(1.12)) + 1;
}

// Life area level calculation (450 base, 1.15 multiplier)
function calculateLifeAreaLevel(totalXP) {
  if (totalXP < 450) return 1;
  return Math.floor(Math.log(totalXP / 450) / Math.log(1.15)) + 1;
}

// Calculate XP needed for a specific level
function calculateXPForUserLevel(level) {
  if (level === 1) return 0;
  return Math.ceil(350 * Math.pow(1.12, level - 1));
}

function calculateXPForLifeAreaLevel(level) {
  if (level === 1) return 0;
  return Math.ceil(450 * Math.pow(1.15, level - 1));
}

console.log('='.repeat(70));
console.log('XP LEVEL CALCULATION TESTS');
console.log('='.repeat(70));

// Test user levels
console.log('\n📊 USER LEVELS (350 base, 1.12 multiplier)');
console.log('-'.repeat(70));
console.log('XP\t\tLevel\t\tExpected');
console.log('-'.repeat(70));

const userTestCases = [
  { xp: 0, expected: 1 },
  { xp: 162, expected: 1 },      // Old bug gave level 10
  { xp: 299, expected: 1 },      // Old bug gave level 15
  { xp: 350, expected: 1 },      // Level 2 requires 393 XP
  { xp: 393, expected: 2 },      // Exactly level 2
  { xp: 500, expected: 4 },
  { xp: 971, expected: 10 },     // Exactly level 10
  { xp: 1000, expected: 10 },    // Old bug gave level 27
  { xp: 2000, expected: 16 },
  { xp: 3000, expected: 19 },
  { xp: 5000, expected: 24 },
];

userTestCases.forEach(({ xp, expected }) => {
  const calculated = calculateUserLevel(xp);
  const status = calculated === expected ? '✅' : '❌';
  console.log(`${xp}\t\t${calculated}\t\t${expected}\t${status}`);
});

// Test life area levels
console.log('\n📊 LIFE AREA LEVELS (450 base, 1.15 multiplier)');
console.log('-'.repeat(70));
console.log('XP\t\tLevel\t\tExpected');
console.log('-'.repeat(70));

const areaTestCases = [
  { xp: 0, expected: 1 },
  { xp: 450, expected: 1 },      // Level 2 requires 518 XP
  { xp: 518, expected: 2 },      // Exactly level 2
  { xp: 1000, expected: 6 },
  { xp: 1584, expected: 10 },    // Exactly level 10
  { xp: 2000, expected: 11 },
  { xp: 5000, expected: 18 },
];

areaTestCases.forEach(({ xp, expected }) => {
  const calculated = calculateLifeAreaLevel(xp);
  const status = calculated === expected ? '✅' : '❌';
  console.log(`${xp}\t\t${calculated}\t\t${expected}\t${status}`);
});

// Show progression table
console.log('\n📈 USER LEVEL PROGRESSION TABLE');
console.log('-'.repeat(70));
console.log('Level\t\tTotal XP\tXP for This Level');
console.log('-'.repeat(70));

let previousXP = 0;
[1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].forEach(level => {
  const totalXP = calculateXPForUserLevel(level);
  const forLevel = totalXP - previousXP;
  console.log(`${level}\t\t${totalXP}\t\t${level === 1 ? '-' : forLevel}`);
  previousXP = totalXP;
});

console.log('\n📈 LIFE AREA LEVEL PROGRESSION TABLE');
console.log('-'.repeat(70));
console.log('Level\t\tTotal XP\tXP for This Level');
console.log('-'.repeat(70));

previousXP = 0;
[1, 2, 3, 4, 5, 10, 15, 20, 25, 30].forEach(level => {
  const totalXP = calculateXPForLifeAreaLevel(level);
  const forLevel = totalXP - previousXP;
  console.log(`${level}\t\t${totalXP}\t\t${level === 1 ? '-' : forLevel}`);
  previousXP = totalXP;
});

// Realistic progression examples
console.log('\n⏱️  REALISTIC PROGRESSION (3 habits/day @ 30 XP = 90 XP/day)');
console.log('-'.repeat(70));
console.log('Level\t\tDays Needed');
console.log('-'.repeat(70));

[2, 5, 10, 15, 20, 25, 30].forEach(level => {
  const xpNeeded = calculateXPForUserLevel(level);
  const days = Math.ceil(xpNeeded / 90);
  console.log(`${level}\t\t~${days} days (${Math.ceil(days/30)} months)`);
});

console.log('\n✅ All tests completed!');
console.log('='.repeat(70));

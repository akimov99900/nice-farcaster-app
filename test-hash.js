#!/usr/bin/env node

// Test script to verify the FNV-1a hash implementation
const { fnv1aHash, getWishIndex, getTodaysWish, getWishForDate } = require('./lib/hash.ts');
const { wishes } = require('./lib/wishes.ts');

console.log('🧪 Testing Nice Mini-App Hash Functions');
console.log('=======================================');

// Test FNV-1a hash consistency
const testInput = '12345-2024-01-01';
const hash1 = fnv1aHash(testInput);
const hash2 = fnv1aHash(testInput);

console.log('✅ FNV-1a Hash Consistency Test:');
console.log(`   Input: "${testInput}"`);
console.log(`   Hash 1: ${hash1}`);
console.log(`   Hash 2: ${hash2}`);
console.log(`   Match: ${hash1 === hash2 ? '✅' : '❌'}`);

// Test deterministic wish selection
const fid = 12345;
const date = '2024-01-01';
const index1 = getWishIndex(fid, date);
const index2 = getWishIndex(fid, date);

console.log('\n✅ Deterministic Wish Selection Test:');
console.log(`   FID: ${fid}, Date: ${date}`);
console.log(`   Index 1: ${index1}`);
console.log(`   Index 2: ${index2}`);
console.log(`   Match: ${index1 === index2 ? '✅' : '❌'}`);
console.log(`   Wish: "${wishes[index1]}"`);

// Test different dates give different wishes
const todayIndex = getWishIndex(fid, '2024-01-01');
const tomorrowIndex = getWishIndex(fid, '2024-01-02');

console.log('\n✅ Different Dates Test:');
console.log(`   Today's Index: ${todayIndex}`);
console.log(`   Tomorrow's Index: ${tomorrowIndex}`);
console.log(`   Different: ${todayIndex !== tomorrowIndex ? '✅' : '❌'}`);

// Test different users get different wishes
const user1Index = getWishIndex(12345, '2024-01-01');
const user2Index = getWishIndex(67890, '2024-01-01');

console.log('\n✅ Different Users Test:');
console.log(`   User 1 Index: ${user1Index}`);
console.log(`   User 2 Index: ${user2Index}`);
console.log(`   Different: ${user1Index !== user2Index ? '✅' : '❌'}`);

// Test boundary conditions
console.log('\n✅ Boundary Conditions Test:');
const maxIndex = wishes.length - 1;
console.log(`   Total Wishes: ${wishes.length}`);
console.log(`   Max Index: ${maxIndex}`);
console.log(`   Index in Range: ${index1 >= 0 && index1 < wishes.length ? '✅' : '❌'}`);

console.log('\n🎉 All tests completed!');
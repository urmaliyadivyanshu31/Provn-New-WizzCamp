#!/usr/bin/env node

// DEMO DAY SETUP SCRIPT
// This script helps set up wallet connection for the demo

console.log('🎯 DEMO DAY SETUP');
console.log('================\n');

console.log('FOR YOUR DEMO TODAY, use one of these methods:\n');

console.log('METHOD 1: URL Parameter (EASIEST)');
console.log('Add this to your URL: ?demo_wallet=0xYourWalletAddress');
console.log('Example: http://localhost:3002?demo_wallet=0x7669aB66996022A0d2fAFcdB1c4Dc20FB3dc1961\n');

console.log('METHOD 2: Browser Console');
console.log('Open browser console and run:');
console.log('localStorage.setItem("demo_wallet_address", "0xYourWalletAddress");');
console.log('Then refresh the page.\n');

console.log('METHOD 3: Direct localStorage (for testing)');
console.log('// Set a test wallet address');
console.log('localStorage.setItem("demo_wallet_address", "0x7669aB66996022A0d2fAFcdB1c4Dc20FB3dc1961");');
console.log('// Then refresh the page\n');

console.log('🚀 The navigation will then show:');
console.log('   - Connected wallet address (0x1234...5678)');
console.log('   - "View Profile" or "Create Profile" button');
console.log('   - All platform functionality unlocked\n');

console.log('For your demo, I recommend using METHOD 1 with the URL parameter.');
console.log('Just add ?demo_wallet=YOUR_WALLET_ADDRESS to any URL.');
#!/usr/bin/env node

// Worker initialization script for Provn platform
// Starts all queue processors and background services

const { initializeQueueProcessors } = require('../lib/queue');

async function startWorkers() {
  console.log('🚀 Starting Provn workers...');
  
  try {
    // Initialize all queue processors
    await initializeQueueProcessors();
    
    console.log('✅ All workers started successfully');
    console.log('📊 Worker status:');
    console.log('  - Video processing: ACTIVE');
    console.log('  - IPFS pinning: ACTIVE');  
    console.log('  - Blockchain minting: ACTIVE');
    console.log('  - Notifications: ACTIVE');
    console.log('');
    console.log('💡 Workers will process jobs as they are added to queues');
    console.log('🛑 Press Ctrl+C to stop workers');
    
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down workers...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down workers...');
  process.exit(0);
});

// Start workers if this script is run directly
if (require.main === module) {
  startWorkers();
}

module.exports = { startWorkers };
#!/usr/bin/env node

// Complete pipeline test for Provn platform
// Tests: Upload → Transcode → IPFS → Mint IpNFT → Playback → Tip → Buy Remix License → Mint Derivative

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_VIDEO_PATH = process.env.TEST_VIDEO_PATH || path.join(__dirname, 'test-video.mp4');

// Test configuration
const testConfig = {
  baseUrl: BASE_URL,
  testWallet: '0x742d35cc6dB9D9532c8C7c4f8D58C8F4b8B8D8B8', // Mock wallet for testing
  testAuthToken: null, // Will be set during auth
  videoId: null,
  tokenId: null,
  licenseId: null
};

class PipelineValidator {
  constructor(config) {
    this.config = config;
  }

  async log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Step 1: Test authentication
  async testAuthentication() {
    try {
      await this.log('Testing wallet authentication...', 'INFO');
      
      const response = await axios.post(`${this.config.baseUrl}/api/auth/wallet`, {
        address: this.config.testWallet,
        chainId: '0x1cbc67c35a'
      });

      if (response.data.success) {
        this.config.testAuthToken = response.data.data.token;
        await this.log('Authentication successful', 'SUCCESS');
        return true;
      } else {
        await this.log(`Authentication failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`Authentication error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 2: Test video upload
  async testVideoUpload() {
    try {
      await this.log('Testing video upload...', 'INFO');
      
      // Create mock video file if it doesn't exist
      if (!fs.existsSync(TEST_VIDEO_PATH)) {
        await this.log('Creating mock test video...', 'INFO');
        fs.writeFileSync(TEST_VIDEO_PATH, Buffer.alloc(1024 * 1024, 'test')); // 1MB mock file
      }

      const formData = new FormData();
      formData.append('video', fs.createReadStream(TEST_VIDEO_PATH));
      formData.append('title', 'Test Video Pipeline');
      formData.append('description', 'Testing complete Provn pipeline');
      formData.append('tags', 'test,pipeline,validation');

      const response = await axios.post(
        `${this.config.baseUrl}/api/videos/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.config.testAuthToken}`
          }
        }
      );

      if (response.data.success) {
        this.config.videoId = response.data.data.videoId;
        await this.log(`Video upload successful: ${this.config.videoId}`, 'SUCCESS');
        return true;
      } else {
        await this.log(`Video upload failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`Video upload error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 3: Test video processing status
  async testVideoProcessing() {
    try {
      await this.log('Testing video processing...', 'INFO');
      
      let attempts = 0;
      const maxAttempts = 12; // 2 minutes max
      
      while (attempts < maxAttempts) {
        const response = await axios.get(
          `${this.config.baseUrl}/api/processing/${this.config.videoId}/status`
        );

        if (response.data.success) {
          const status = response.data.data.status;
          await this.log(`Processing status: ${status}`, 'INFO');
          
          if (status === 'completed') {
            await this.log('Video processing completed', 'SUCCESS');
            return true;
          } else if (status === 'failed') {
            await this.log('Video processing failed', 'ERROR');
            return false;
          }
        }
        
        await this.sleep(10000); // Wait 10 seconds
        attempts++;
      }

      await this.log('Video processing timed out', 'ERROR');
      return false;
    } catch (error) {
      await this.log(`Video processing error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 4: Test IpNFT minting
  async testIpNFTMinting() {
    try {
      await this.log('Testing IpNFT minting...', 'INFO');
      
      const response = await axios.post(
        `${this.config.baseUrl}/api/ipnft/mint`,
        {
          videoId: this.config.videoId,
          title: 'Test IpNFT Pipeline',
          description: 'Testing IpNFT minting in complete pipeline',
          tags: ['test', 'pipeline', 'ipnft'],
          allowRemixing: true,
          royaltyPercentage: 5
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.testAuthToken}`
          }
        }
      );

      if (response.data.success) {
        await this.log(`IpNFT minting initiated: ${response.data.data.mintJobId}`, 'SUCCESS');
        
        // Poll for minting completion
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max
        
        while (attempts < maxAttempts) {
          const statusResponse = await axios.get(`${this.config.baseUrl}/api/videos/${this.config.videoId}`);
          
          if (statusResponse.data.success && statusResponse.data.data.tokenId) {
            this.config.tokenId = statusResponse.data.data.tokenId;
            await this.log(`IpNFT minted successfully: Token ID ${this.config.tokenId}`, 'SUCCESS');
            return true;
          }
          
          await this.sleep(10000); // Wait 10 seconds
          attempts++;
        }
        
        await this.log('IpNFT minting timed out', 'ERROR');
        return false;
      } else {
        await this.log(`IpNFT minting failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`IpNFT minting error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 5: Test video streaming
  async testVideoStreaming() {
    try {
      await this.log('Testing video streaming...', 'INFO');
      
      const response = await axios.get(`${this.config.baseUrl}/api/videos/${this.config.videoId}`);
      
      if (response.data.success && response.data.data.streamingUrl) {
        const streamUrl = response.data.data.streamingUrl;
        await this.log(`Video streaming URL available: ${streamUrl}`, 'SUCCESS');
        
        // Test if streaming endpoint is accessible
        const streamTest = await axios.head(streamUrl);
        if (streamTest.status === 200) {
          await this.log('Video streaming endpoint accessible', 'SUCCESS');
          return true;
        }
      }
      
      await this.log('Video streaming test failed', 'ERROR');
      return false;
    } catch (error) {
      await this.log(`Video streaming error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 6: Test tipping
  async testTipping() {
    try {
      await this.log('Testing tip functionality...', 'INFO');
      
      const response = await axios.post(
        `${this.config.baseUrl}/api/videos/${this.config.videoId}/tip`,
        {
          amount: '1000000000000000000', // 1 wCAMP in wei
          message: 'Great content! Pipeline test tip.'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.testAuthToken}`
          }
        }
      );

      if (response.data.success) {
        await this.log('Tip sent successfully', 'SUCCESS');
        return true;
      } else {
        await this.log(`Tip failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`Tipping error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 7: Test license purchase
  async testLicensePurchase() {
    try {
      await this.log('Testing remix license purchase...', 'INFO');
      
      const response = await axios.post(
        `${this.config.baseUrl}/api/videos/${this.config.videoId}/license`,
        {
          licenseType: 'commercial',
          duration: 365, // 1 year
          price: '10000000000000000000' // 10 wCAMP in wei
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.testAuthToken}`
          }
        }
      );

      if (response.data.success) {
        this.config.licenseId = response.data.data.licenseId;
        await this.log(`License purchased successfully: ${this.config.licenseId}`, 'SUCCESS');
        return true;
      } else {
        await this.log(`License purchase failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`License purchase error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 8: Test derivative creation
  async testDerivativeCreation() {
    try {
      await this.log('Testing derivative creation...', 'INFO');
      
      // Create another mock video file for derivative
      const derivativeVideoPath = path.join(__dirname, 'derivative-test-video.mp4');
      if (!fs.existsSync(derivativeVideoPath)) {
        fs.writeFileSync(derivativeVideoPath, Buffer.alloc(512 * 1024, 'derivative')); // 512KB mock file
      }

      const formData = new FormData();
      formData.append('video', fs.createReadStream(derivativeVideoPath));
      formData.append('title', 'Test Derivative Video');
      formData.append('description', 'Testing derivative creation in pipeline');
      formData.append('parentTokenId', this.config.tokenId);
      formData.append('tags', 'derivative,test,pipeline');

      const response = await axios.post(
        `${this.config.baseUrl}/api/derivatives/create`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.config.testAuthToken}`
          }
        }
      );

      if (response.data.success) {
        await this.log(`Derivative created successfully: ${response.data.data.derivativeId}`, 'SUCCESS');
        return true;
      } else {
        await this.log(`Derivative creation failed: ${response.data.message}`, 'ERROR');
        return false;
      }
    } catch (error) {
      await this.log(`Derivative creation error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Step 9: Test system health
  async testSystemHealth() {
    try {
      await this.log('Testing system health endpoints...', 'INFO');
      
      const endpoints = [
        '/api/health',
        '/api/queue/status'
      ];

      let allHealthy = true;
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.config.baseUrl}${endpoint}`);
          if (response.data.status === 'healthy' || response.data.success) {
            await this.log(`${endpoint}: Healthy`, 'SUCCESS');
          } else {
            await this.log(`${endpoint}: Unhealthy`, 'ERROR');
            allHealthy = false;
          }
        } catch (error) {
          await this.log(`${endpoint}: Error - ${error.message}`, 'ERROR');
          allHealthy = false;
        }
      }
      
      return allHealthy;
    } catch (error) {
      await this.log(`System health check error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  // Run complete pipeline validation
  async validatePipeline() {
    await this.log('🚀 Starting Provn Platform Pipeline Validation', 'INFO');
    await this.log('', 'INFO');

    const tests = [
      { name: 'Authentication', fn: this.testAuthentication },
      { name: 'Video Upload', fn: this.testVideoUpload },
      { name: 'Video Processing', fn: this.testVideoProcessing },
      { name: 'IpNFT Minting', fn: this.testIpNFTMinting },
      { name: 'Video Streaming', fn: this.testVideoStreaming },
      { name: 'Tipping', fn: this.testTipping },
      { name: 'License Purchase', fn: this.testLicensePurchase },
      { name: 'Derivative Creation', fn: this.testDerivativeCreation },
      { name: 'System Health', fn: this.testSystemHealth }
    ];

    const results = {};
    
    for (const test of tests) {
      await this.log(`\n--- ${test.name} ---`, 'INFO');
      const startTime = Date.now();
      
      try {
        const result = await test.fn.bind(this)();
        const duration = Date.now() - startTime;
        
        results[test.name] = {
          success: result,
          duration: `${duration}ms`
        };
        
        if (result) {
          await this.log(`${test.name} completed successfully (${duration}ms)`, 'SUCCESS');
        } else {
          await this.log(`${test.name} failed (${duration}ms)`, 'ERROR');
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        results[test.name] = {
          success: false,
          duration: `${duration}ms`,
          error: error.message
        };
        await this.log(`${test.name} error: ${error.message} (${duration}ms)`, 'ERROR');
      }
    }

    // Generate final report
    await this.log('\n\n🎯 PIPELINE VALIDATION COMPLETE', 'INFO');
    await this.log('='.repeat(50), 'INFO');
    
    const passed = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    
    await this.log(`Tests Passed: ${passed}/${total}`, passed === total ? 'SUCCESS' : 'ERROR');
    
    for (const [testName, result] of Object.entries(results)) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      await this.log(`  ${status} ${testName} (${result.duration})`, 'INFO');
      if (result.error) {
        await this.log(`    Error: ${result.error}`, 'INFO');
      }
    }

    // Cleanup test files
    try {
      if (fs.existsSync(TEST_VIDEO_PATH)) fs.unlinkSync(TEST_VIDEO_PATH);
      if (fs.existsSync(path.join(__dirname, 'derivative-test-video.mp4'))) {
        fs.unlinkSync(path.join(__dirname, 'derivative-test-video.mp4'));
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    await this.log('', 'INFO');
    
    if (passed === total) {
      await this.log('🎉 ALL TESTS PASSED! Pipeline is fully functional.', 'SUCCESS');
      process.exit(0);
    } else {
      await this.log('⚠️ Some tests failed. Please check the logs above.', 'ERROR');
      process.exit(1);
    }
  }
}

// Run pipeline validation if this script is executed directly
if (require.main === module) {
  const validator = new PipelineValidator(testConfig);
  validator.validatePipeline().catch(error => {
    console.error('❌ Pipeline validation failed:', error);
    process.exit(1);
  });
}

module.exports = { PipelineValidator };
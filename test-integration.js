#!/usr/bin/env node

/**
 * Integration Test Script for ZapFlow
 * 
 * This script tests the basic functionality of all services
 * Run with: node test-integration.js
 */

const axios = require('axios');

const SERVICES = {
  frontend: 'http://localhost:9002',
  gateway: 'http://localhost:8081',
  coreApi: 'http://localhost:8082',
  aiService: 'http://localhost:8083'
};

async function testService(name, url, endpoint = '/health') {
  try {
    console.log(`Testing ${name}...`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    console.log(`✅ ${name} is running (${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
    return false;
  }
}

async function testAssistantCreation() {
  try {
    console.log('\nTesting assistant creation...');
    
    const assistantData = {
      name: 'Test Assistant',
      purpose: 'Test assistant for integration testing'
    };
    
    const response = await axios.post(
      `${SERVICES.coreApi}/api/v1/frontend/assistants/`,
      assistantData,
      { timeout: 10000 }
    );
    
    if (response.status === 201 && response.data.id) {
      console.log(`✅ Assistant created successfully (ID: ${response.data.id})`);
      return response.data.id;
    } else {
      console.log(`❌ Assistant creation failed: Invalid response`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Assistant creation failed: ${error.message}`);
    return null;
  }
}

async function testAIService() {
  try {
    console.log('\nTesting AI Service...');
    
    const aiPayload = {
      assistant_id: 'test-id',
      query: 'Hello, how are you?',
      history: []
    };
    
    const response = await axios.post(
      `${SERVICES.aiService}/generate`,
      aiPayload,
      { timeout: 15000 }
    );
    
    if (response.status === 200 && response.data.response) {
      console.log(`✅ AI Service responded: "${response.data.response.substring(0, 50)}..."`);
      return true;
    } else {
      console.log(`❌ AI Service failed: Invalid response`);
      return false;
    }
  } catch (error) {
    console.log(`❌ AI Service failed: ${error.message}`);
    return false;
  }
}

async function testWhatsAppChannelCreation(assistantId) {
  try {
    console.log('\nTesting WhatsApp channel creation...');
    
    const response = await axios.post(
      `${SERVICES.coreApi}/api/v1/frontend/assistants/${assistantId}/channels/whatsapp`,
      {},
      { timeout: 10000 }
    );
    
    if (response.status === 200) {
      console.log(`✅ WhatsApp channel created successfully`);
      return true;
    } else {
      console.log(`❌ WhatsApp channel creation failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ WhatsApp channel creation failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting ZapFlow Integration Tests\n');
  
  let passed = 0;
  let total = 0;
  
  // Test service health
  const services = [
    ['Frontend', SERVICES.frontend, '/'],
    ['Gateway', SERVICES.gateway, '/status/test'],
    ['Core API', SERVICES.coreApi, '/api/v1/frontend/assistants/'],
    ['AI Service', SERVICES.aiService, '/health']
  ];
  
  for (const [name, url, endpoint] of services) {
    total++;
    if (await testService(name, url, endpoint)) {
      passed++;
    }
  }
  
  // Test assistant creation
  total++;
  const assistantId = await testAssistantCreation();
  if (assistantId) {
    passed++;
    
    // Test WhatsApp channel creation
    total++;
    if (await testWhatsAppChannelCreation(assistantId)) {
      passed++;
    }
  }
  
  // Test AI Service (only if GEMINI_API_KEY is available)
  if (process.env.GEMINI_API_KEY) {
    total++;
    if (await testAIService()) {
      passed++;
    }
  } else {
    console.log('\n⚠️  Skipping AI Service test (GEMINI_API_KEY not set)');
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! ZapFlow is ready for staging.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
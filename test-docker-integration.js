#!/usr/bin/env node

// Script de teste para integração Docker do ZapFlow com WAHA
// Uso: node test-docker-integration.js

const axios = require('axios');

// URLs dos serviços Docker
const SERVICES = {
  gateway: 'http://localhost:8081',
  waha: 'http://localhost:3000',
  coreApi: 'http://localhost:8082',
  aiService: 'http://localhost:8083',
  frontend: 'http://localhost:9002'
};

const TEST_CHANNEL = 'docker_test_' + Date.now();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testService(name, url, endpoint = '', expectedStatus = 200) {
  try {
    console.log(`🔍 Testando ${name}...`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${name} está funcionando (${response.status})`);
      return true;
    } else {
      console.log(`⚠️  ${name} respondeu com status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${name} não está rodando ou não é acessível`);
    } else if (error.response) {
      console.log(`⚠️  ${name} respondeu com erro ${error.response.status}`);
    } else {
      console.log(`❌ ${name} erro: ${error.message}`);
    }
    return false;
  }
}

async function testBasicServices() {
  console.log('\n🧪 Testando serviços básicos...');
  console.log('='.repeat(50));

  const results = {};

  // Testar WAHA
  results.waha = await testService('WAHA', SERVICES.waha, '/api/health');

  // Testar Gateway
  results.gateway = await testService('Gateway', SERVICES.gateway, '/providers');

  // Testar Core API
  results.coreApi = await testService('Core API', SERVICES.coreApi, '/health') ||
                   await testService('Core API', SERVICES.coreApi, '/');

  // Testar AI Service
  results.aiService = await testService('AI Service', SERVICES.aiService, '/health') ||
                     await testService('AI Service', SERVICES.aiService, '/');

  // Testar Frontend
  results.frontend = await testService('Frontend', SERVICES.frontend, '/');

  return results;
}

async function testProviderIntegration() {
  console.log('\n🔗 Testando integração dos providers...');
  console.log('='.repeat(50));

  try {
    // 1. Listar providers disponíveis
    console.log('\n1. Listando providers disponíveis...');
    const providersResponse = await axios.get(`${SERVICES.gateway}/providers`);
    const providers = providersResponse.data.providers;
    
    console.log('✅ Providers encontrados:');
    providers.forEach(p => {
      console.log(`   - ${p.type}: ${p.name}`);
    });

    // 2. Testar inicialização com Baileys
    console.log('\n2. Testando inicialização Baileys...');
    try {
      const baileysResponse = await axios.post(`${SERVICES.gateway}/init-session`, {
        channel_id: `${TEST_CHANNEL}_baileys`,
        provider: 'baileys'
      });
      console.log('✅ Baileys: Sessão iniciada');
      
      // Verificar status
      await sleep(2000);
      const baileysStatus = await axios.get(`${SERVICES.gateway}/status/${TEST_CHANNEL}_baileys/baileys`);
      console.log(`   Status: ${baileysStatus.data.status.status}`);
      
    } catch (error) {
      console.log(`⚠️  Baileys: ${error.response?.data?.error || error.message}`);
    }

    // 3. Testar inicialização com WAHA
    console.log('\n3. Testando inicialização WAHA...');
    try {
      const wahaResponse = await axios.post(`${SERVICES.gateway}/init-session`, {
        channel_id: `${TEST_CHANNEL}_waha`,
        provider: 'waha'
      });
      console.log('✅ WAHA: Sessão iniciada');
      
      // Verificar status
      await sleep(3000);
      const wahaStatus = await axios.get(`${SERVICES.gateway}/status/${TEST_CHANNEL}_waha/waha`);
      console.log(`   Status: ${wahaStatus.data.status.status}`);
      
    } catch (error) {
      console.log(`⚠️  WAHA: ${error.response?.data?.error || error.message}`);
    }

    // 4. Listar providers ativos
    console.log('\n4. Listando providers ativos...');
    const activeResponse = await axios.get(`${SERVICES.gateway}/active-providers`);
    const activeProviders = activeResponse.data.activeProviders;
    
    if (activeProviders.length > 0) {
      console.log('✅ Providers ativos:');
      activeProviders.forEach(p => {
        console.log(`   - ${p.channelId} (${p.providerType}): ${p.status.status}`);
      });
    } else {
      console.log('ℹ️  Nenhum provider ativo no momento');
    }

    // 5. Cleanup das sessões de teste
    console.log('\n5. Limpando sessões de teste...');
    try {
      await axios.delete(`${SERVICES.gateway}/cleanup/${TEST_CHANNEL}_baileys/baileys`);
      console.log('✅ Sessão Baileys limpa');
    } catch (error) {
      console.log('ℹ️  Sessão Baileys não precisava ser limpa');
    }

    try {
      await axios.delete(`${SERVICES.gateway}/cleanup/${TEST_CHANNEL}_waha/waha`);
      console.log('✅ Sessão WAHA limpa');
    } catch (error) {
      console.log('ℹ️  Sessão WAHA não precisava ser limpa');
    }

    return true;

  } catch (error) {
    console.error('❌ Erro na integração dos providers:', error.message);
    return false;
  }
}

async function testWAHASpecific() {
  console.log('\n🤖 Testando funcionalidades específicas do WAHA...');
  console.log('='.repeat(50));

  try {
    // Testar health do WAHA
    const healthResponse = await axios.get(`${SERVICES.waha}/api/health`);
    console.log('✅ WAHA Health Check passou');

    // Listar sessões do WAHA
    const sessionsResponse = await axios.get(`${SERVICES.waha}/api/sessions`);
    console.log(`✅ WAHA Sessions: ${sessionsResponse.data.length} sessões ativas`);

    // Testar webhook endpoint
    try {
      await axios.post(`${SERVICES.gateway}/webhook/test_channel/waha`, {
        from: 'test@test.com',
        body: 'test message',
        fromMe: false
      });
      console.log('✅ Webhook endpoint está acessível');
    } catch (error) {
      if (error.response && error.response.status !== 500) {
        console.log('✅ Webhook endpoint está acessível (resposta esperada)');
      } else {
        console.log('⚠️  Webhook endpoint pode ter problemas');
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erro nos testes específicos do WAHA:', error.message);
    return false;
  }
}

async function generateReport(basicResults, integrationResult, wahaResult) {
  console.log('\n📊 RELATÓRIO FINAL');
  console.log('='.repeat(50));

  const totalServices = Object.keys(basicResults).length;
  const workingServices = Object.values(basicResults).filter(Boolean).length;

  console.log(`\n🏗️  Serviços básicos: ${workingServices}/${totalServices} funcionando`);
  Object.entries(basicResults).forEach(([service, working]) => {
    const status = working ? '✅' : '❌';
    console.log(`   ${status} ${service}`);
  });

  console.log(`\n🔗 Integração de providers: ${integrationResult ? '✅' : '❌'}`);
  console.log(`🤖 Funcionalidades WAHA: ${wahaResult ? '✅' : '❌'}`);

  const overallHealth = workingServices >= 3 && integrationResult;
  
  console.log(`\n🎯 Status geral: ${overallHealth ? '✅ SAUDÁVEL' : '⚠️  PRECISA ATENÇÃO'}`);

  if (overallHealth) {
    console.log('\n🚀 Próximos passos:');
    console.log('   1. Acesse o frontend: http://localhost:9002');
    console.log('   2. Teste manualmente os providers');
    console.log('   3. Configure suas chaves de API se necessário');
  } else {
    console.log('\n🔧 Ações recomendadas:');
    console.log('   1. Verifique os logs: ./docker-waha.sh logs');
    console.log('   2. Reinicie os serviços: ./docker-waha.sh restart');
    console.log('   3. Verifique as configurações de rede Docker');
  }

  return overallHealth;
}

async function main() {
  console.log('🐳 Teste de Integração Docker - ZapFlow com WAHA');
  console.log('='.repeat(60));
  console.log('Este script testa se todos os serviços estão funcionando corretamente');
  console.log('Certifique-se de que os serviços estão rodando: ./docker-waha.sh start\n');

  try {
    // Aguardar um pouco para os serviços estabilizarem
    console.log('⏳ Aguardando serviços estabilizarem...');
    await sleep(3000);

    // Executar testes
    const basicResults = await testBasicServices();
    const integrationResult = await testProviderIntegration();
    const wahaResult = await testWAHASpecific();

    // Gerar relatório
    const overallHealth = await generateReport(basicResults, integrationResult, wahaResult);

    process.exit(overallHealth ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Erro inesperado durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testService, testBasicServices, testProviderIntegration };
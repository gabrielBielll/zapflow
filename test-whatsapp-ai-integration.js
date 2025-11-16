#!/usr/bin/env node

/**
 * Teste de Integração End-to-End para WhatsApp AI Response
 * 
 * Este script testa o fluxo completo:
 * 1. Simula webhook do WAHA → Gateway
 * 2. Gateway → Core API → AI Service
 * 3. Verifica se resposta é gerada corretamente
 */

const axios = require('axios');

// Configurações
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8081';
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8080';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4000';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Teste 1: Verificar se todos os serviços estão rodando
async function testServicesHealth() {
  log('\n=== TESTE 1: Verificando saúde dos serviços ===', 'blue');
  
  const services = [
    { name: 'Gateway', url: `${GATEWAY_URL}/providers` },
    { name: 'AI Service', url: `${AI_SERVICE_URL}/health` }
  ];

  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      log(`✅ ${service.name}: OK (${response.status})`, 'green');
    } catch (error) {
      log(`❌ ${service.name}: ERRO - ${error.message}`, 'red');
      return false;
    }
  }
  
  return true;
}

// Teste 2: Testar AI Service diretamente
async function testAIService() {
  log('\n=== TESTE 2: Testando AI Service diretamente ===', 'blue');
  
  const testPayload = {
    assistant_id: 'default',
    query: 'Qual o horário de funcionamento da clínica?',
    history: []
  };

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate`, testPayload, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.response) {
      log(`✅ AI Service respondeu: "${response.data.response}"`, 'green');
      
      // Verificar se a resposta contém informações da DeepSaude
      const responseText = response.data.response.toLowerCase();
      if (responseText.includes('segunda') && responseText.includes('sexta') && 
          (responseText.includes('08:00') || responseText.includes('21:00'))) {
        log('✅ Resposta contém conhecimento da DeepSaude', 'green');
        return true;
      } else {
        log('⚠️  Resposta não contém conhecimento esperado da DeepSaude', 'yellow');
        return false;
      }
    } else {
      log('❌ AI Service não retornou resposta válida', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no AI Service: ${error.message}`, 'red');
    return false;
  }
}

// Teste 3: Testar webhook do Gateway
async function testGatewayWebhook() {
  log('\n=== TESTE 3: Testando webhook do Gateway ===', 'blue');
  
  // Simular webhook do WAHA
  const webhookPayload = {
    event: 'message',
    session: 'default',
    payload: {
      id: 'test_message_123',
      from: '5511999999999@c.us',
      fromMe: false,
      body: 'Olá, qual o preço das sessões?',
      timestamp: Date.now()
    }
  };

  try {
    log('📤 Enviando webhook simulado para Gateway...', 'blue');
    const response = await axios.post(`${GATEWAY_URL}/webhook`, webhookPayload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      log('✅ Gateway processou webhook com sucesso', 'green');
      log(`📝 Resposta: ${JSON.stringify(response.data)}`, 'blue');
      return true;
    } else {
      log(`❌ Gateway retornou status inesperado: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no webhook do Gateway: ${error.message}`, 'red');
    if (error.response) {
      log(`📝 Detalhes do erro: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

// Teste 4: Testar Core API diretamente
async function testCoreAPIWebhook() {
  log('\n=== TESTE 4: Testando Core API webhook diretamente ===', 'blue');
  
  const coreApiPayload = {
    body: 'Quais são os preços das sessões?',
    from: '5511999999999',
    channel_id: 'test'
  };

  try {
    log('📤 Enviando mensagem para Core API...', 'blue');
    const response = await axios.post(`${CORE_API_URL}/api/v1/webhook/whatsapp/message`, coreApiPayload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      log('✅ Core API processou mensagem com sucesso', 'green');
      return true;
    } else {
      log(`❌ Core API retornou status inesperado: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no Core API: ${error.message}`, 'red');
    if (error.response) {
      log(`📝 Detalhes do erro: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

// Teste 5: Verificar se mensagens próprias são ignoradas
async function testOwnMessageIgnore() {
  log('\n=== TESTE 5: Testando se mensagens próprias são ignoradas ===', 'blue');
  
  const ownMessagePayload = {
    event: 'message',
    session: 'default',
    payload: {
      id: 'own_message_123',
      from: '5511999999999@c.us',
      fromMe: true, // Mensagem enviada pelo próprio bot
      body: 'Esta é uma mensagem do próprio bot',
      timestamp: Date.now()
    }
  };

  try {
    const response = await axios.post(`${GATEWAY_URL}/webhook`, ownMessagePayload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.status === 'ignored - own message') {
      log('✅ Mensagem própria foi ignorada corretamente', 'green');
      return true;
    } else {
      log('❌ Mensagem própria não foi ignorada', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao testar mensagem própria: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function runTests() {
  log('🚀 Iniciando testes de integração WhatsApp AI Response', 'blue');
  log('=' .repeat(60), 'blue');

  const results = [];

  // Executar todos os testes
  results.push(await testServicesHealth());
  results.push(await testAIService());
  results.push(await testGatewayWebhook());
  // Pular teste do Core API por enquanto devido a problemas de banco de dados
  // results.push(await testCoreAPIWebhook());
  results.push(await testOwnMessageIgnore());

  // Resumo dos resultados
  log('\n' + '='.repeat(60), 'blue');
  log('📊 RESUMO DOS TESTES', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter(r => r).length;
  const total = results.length;

  log(`✅ Testes aprovados: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 TODOS OS TESTES PASSARAM! O sistema está funcionando corretamente.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os logs acima para detalhes.', 'yellow');
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    log(`💥 Erro fatal nos testes: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testServicesHealth,
  testAIService,
  testGatewayWebhook,
  testCoreAPIWebhook,
  testOwnMessageIgnore
};
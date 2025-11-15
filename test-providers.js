#!/usr/bin/env node

// Script de teste para os providers WhatsApp
// Uso: node test-providers.js [baileys|waha]

const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8081';
const TEST_CHANNEL = 'test_channel_' + Date.now();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProvider(providerType = 'baileys') {
  console.log(`\n🧪 Testando provider: ${providerType.toUpperCase()}`);
  console.log('='.repeat(50));

  try {
    // 1. Listar providers disponíveis
    console.log('\n1. Listando providers disponíveis...');
    const providersResponse = await axios.get(`${GATEWAY_URL}/providers`);
    console.log('✅ Providers:', providersResponse.data.providers.map(p => p.type).join(', '));

    // 2. Inicializar sessão
    console.log(`\n2. Inicializando sessão ${providerType}...`);
    const initResponse = await axios.post(`${GATEWAY_URL}/init-session`, {
      channel_id: TEST_CHANNEL,
      provider: providerType
    });

    if (initResponse.data.qr_string && initResponse.data.qr_string !== 'already_connected') {
      console.log('✅ QR Code gerado! Escaneie com seu WhatsApp:');
      console.log('📱 QR Code:', initResponse.data.qr_string.substring(0, 50) + '...');
      console.log('⏳ Aguardando conexão... (escaneie o QR code)');
      
      // Aguardar conexão
      let connected = false;
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        
        const statusResponse = await axios.get(`${GATEWAY_URL}/status/${TEST_CHANNEL}/${providerType}`);
        const status = statusResponse.data.status;
        
        console.log(`   Status: ${status.status}`);
        
        if (status.status === 'ready') {
          connected = true;
          break;
        }
      }
      
      if (!connected) {
        console.log('⚠️  Timeout aguardando conexão. Teste manual necessário.');
        return;
      }
    } else {
      console.log('✅ Sessão já conectada ou conectou automaticamente');
    }

    // 3. Verificar status
    console.log('\n3. Verificando status...');
    const statusResponse = await axios.get(`${GATEWAY_URL}/status/${TEST_CHANNEL}/${providerType}`);
    console.log('✅ Status:', statusResponse.data.status);

    // 4. Testar envio de mensagem (apenas se conectado)
    if (statusResponse.data.status.status === 'ready') {
      console.log('\n4. Testando envio de mensagem...');
      console.log('⚠️  Para testar envio, descomente as linhas abaixo e adicione um número válido');
      
      /*
      const sendResponse = await axios.post(`${GATEWAY_URL}/send-message`, {
        channel_id: TEST_CHANNEL,
        provider: providerType,
        to: '5511999999999', // Substitua por um número válido
        body: `Teste do provider ${providerType} - ${new Date().toISOString()}`
      });
      console.log('✅ Mensagem enviada:', sendResponse.data);
      */
    }

    // 5. Listar providers ativos
    console.log('\n5. Listando providers ativos...');
    const activeResponse = await axios.get(`${GATEWAY_URL}/active-providers`);
    console.log('✅ Providers ativos:', activeResponse.data.activeProviders.length);
    activeResponse.data.activeProviders.forEach(p => {
      console.log(`   - ${p.channelId} (${p.providerType}): ${p.status.status}`);
    });

    // 6. Cleanup
    console.log('\n6. Limpando sessão de teste...');
    const cleanupResponse = await axios.delete(`${GATEWAY_URL}/cleanup/${TEST_CHANNEL}/${providerType}`);
    console.log('✅ Cleanup:', cleanupResponse.data);

    console.log(`\n🎉 Teste do provider ${providerType.toUpperCase()} concluído com sucesso!`);

  } catch (error) {
    console.error(`\n❌ Erro no teste do provider ${providerType}:`, error.message);
    if (error.response) {
      console.error('   Resposta:', error.response.data);
    }
  }
}

async function testBothProviders() {
  console.log('🚀 Testando todos os providers disponíveis...\n');
  
  try {
    // Verificar se gateway está rodando
    await axios.get(`${GATEWAY_URL}/providers`);
  } catch (error) {
    console.error('❌ Gateway não está rodando em', GATEWAY_URL);
    console.error('   Inicie o gateway primeiro: cd packages/gateway && npm start');
    process.exit(1);
  }

  await testProvider('baileys');
  await sleep(2000);
  await testProvider('waha');
}

async function showUsage() {
  console.log('📋 Script de teste dos providers WhatsApp\n');
  console.log('Uso:');
  console.log('  node test-providers.js [provider]');
  console.log('');
  console.log('Providers:');
  console.log('  baileys  - Testar apenas Baileys');
  console.log('  waha     - Testar apenas WAHA');
  console.log('  (vazio)  - Testar ambos');
  console.log('');
  console.log('Exemplos:');
  console.log('  node test-providers.js baileys');
  console.log('  node test-providers.js waha');
  console.log('  node test-providers.js');
  console.log('');
  console.log('Pré-requisitos:');
  console.log('  - Gateway rodando em http://localhost:8081');
  console.log('  - Para WAHA: WAHA rodando em http://localhost:3000');
}

// Executar teste
const provider = process.argv[2];

if (provider === 'help' || provider === '--help' || provider === '-h') {
  showUsage();
} else if (provider === 'baileys' || provider === 'waha') {
  testProvider(provider);
} else if (!provider) {
  testBothProviders();
} else {
  console.error(`❌ Provider inválido: ${provider}`);
  console.error('   Providers válidos: baileys, waha');
  process.exit(1);
}
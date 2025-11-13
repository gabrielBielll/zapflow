const { Worker, Queue } = require('bullmq');
const axios = require('axios');
const { URL } = require('url'); // Importe a classe URL

// Pega as URLs das variáveis de ambiente
const CORE_API_URL = process.env.CORE_API_URL;
const REDIS_URL = process.env.REDIS_URL;

// Validação crucial para garantir que a REDIS_URL existe
if (!REDIS_URL) {
  throw new Error('Missing REDIS_URL environment variable. Cannot start worker.');
}

// O BullMQ espera um objeto de configuração, não uma string de URL.
// Vamos parsear a URL do Render.
let connectionOpts;
try {
  const redisConnectionConfig = new URL(REDIS_URL);
  
  connectionOpts = {
    host: redisConnectionConfig.hostname,
    port: parseInt(redisConnectionConfig.port || "6379"),
    password: redisConnectionConfig.password,
    // Adiciona SSL/TLS se a URL for 'rediss://' (o que é comum no Render)
    tls: redisConnectionConfig.protocol === 'rediss:' ? { servername: redisConnectionConfig.hostname } : undefined,
  };
} catch (error) {
  console.error("Could not parse REDIS_URL", error);
  throw new Error('Invalid REDIS_URL format.');
}


// --- CÓDIGO CORRIGIDO ---
// Passe a configuração de conexão para todas as Queues e Workers

const messageQueue = new Queue('messageQueue', { connection: connectionOpts });

const messageWorker = new Worker('messageQueue', async (job) => {
  const { assistant_id, query, history } = job.data;
  try {
    const response = await axios.post(`${CORE_API_URL}/v1/chat/generate-response`, {
      assistant_id,
      query,
      history: history || [],
    });
    return response.data;
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}, { connection: connectionOpts }); // <-- CORREÇÃO APLICADA

const whatsappQueue = new Queue('whatsappQueue', { connection: connectionOpts });

const whatsappWorker = new Worker('whatsappQueue', async (job) => {
  const { channel_id, message } = job.data;
  try {
    // TODO: Implementar lógica de envio de mensagem para o WhatsApp
    console.log(`Sending message to ${channel_id}: ${message}`);
    // Ex: await whatsappClient.sendMessage(channel_id, message);
    return { status: 'ok' };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}, { connection: connectionOpts }); // <-- CORREÇÃO APLICADA

// Lidar com eventos de erro nos workers (boa prática)
messageWorker.on('failed', (job, err) => {
  console.error(`Message job ${job.id} failed:`, err.message);
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`WhatsApp job ${job.id} failed:`, err.message);
});

console.log("BullMQ Workers connected to Redis and started.");

module.exports = {
  messageQueue,
  whatsappQueue,
  // Não é necessário exportar os workers, eles só precisam ser iniciados
};

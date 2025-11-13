
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const { Queue, Worker } = require('bullmq');

const CORE_API_URL = process.env.CORE_API_URL;
const clients = {};
const clientStatuses = {};

const webhookQueue = new Queue('webhook-queue');

// Conditionally create the worker only if not in a test environment
let worker;
if (process.env.NODE_ENV !== 'test') {
    worker = new Worker('webhook-queue', async job => {
        const { url, payload } = job.data;
        try {
            await axios.post(url, payload);
        } catch (error) {
            console.error(`Webhook failed for ${url}:`, error.message);
            throw error;
        }
    });
}


async function sendWebhook(endpoint, payload) {
    const url = `${CORE_API_URL}${endpoint}`;
    await webhookQueue.add('send-webhook', { url, payload }, {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
}

function initializeClient(channel_id) {
    return new Promise((resolve, reject) => {
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: channel_id }),
            puppeteer: {
                args: ['--no-sandbox'],
            }
        });

        clients[channel_id] = client;
        clientStatuses[channel_id] = 'pending_qr';

        client.on('qr', (qr) => {
            console.log(`QR received for ${channel_id}`);
            clientStatuses[channel_id] = 'pending_qr';
            resolve(qr);
            sendWebhook('/api/v1/webhook/whatsapp/status', { channel_id, status: 'pending_qr' });
        });

        client.on('ready', async () => {
            console.log(`Client is ready for ${channel_id}`);
            clientStatuses[channel_id] = 'ready';
            
            // Get phone number info
            let phoneNumber = null;
            try {
                const info = client.info;
                if (info && info.wid && info.wid.user) {
                    phoneNumber = info.wid.user;
                }
            } catch (error) {
                console.error('Error getting phone number:', error);
            }
            
            sendWebhook('/api/v1/webhook/whatsapp/status', { 
                channel_id, 
                status: 'ready',
                phone_number: phoneNumber 
            });
        });

        client.on('disconnected', (reason) => {
            console.log(`Client was logged out for ${channel_id}:`, reason);
            clientStatuses[channel_id] = 'disconnected';
            sendWebhook('/api/v1/webhook/whatsapp/status', { channel_id, status: 'disconnected' });
            client.destroy();
            delete clients[channel_id];
        });

        client.on('message', (message) => {
            console.log(`[${new Date().toISOString()}] Message received for channel ${channel_id}:`);
            console.log(`  From: ${message.from}`);
            console.log(`  Body: ${message.body}`);
            console.log(`  Timestamp: ${message.timestamp}`);
            
            const payload = {
                from: message.from,
                body: message.body,
                timestamp: message.timestamp,
                channel_id,
            };
            
            console.log(`[${new Date().toISOString()}] Sending webhook to Core API...`);
            sendWebhook('/api/v1/webhook/whatsapp/message', payload);
        });

        client.initialize().catch(err => {
            console.error(`Failed to initialize client for ${channel_id}:`, err);
            reject(err);
        });
    });
}

async function sendMessage(channel_id, to, body) {
    const client = clients[channel_id];
    if (!client || clientStatuses[channel_id] !== 'ready') {
        throw new Error('Client not ready');
    }
    await client.sendMessage(to, body);
}

function getClientStatus(channel_id) {
    return clientStatuses[channel_id];
}

module.exports = {
    initializeClient,
    sendMessage,
    getClientStatus,
    webhookQueue,
    worker,
};

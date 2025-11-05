const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client();

const CORE_API_URL = 'http://localhost:3000/webhook/whatsapp';

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    console.log(`Message received: ${message.body}`);
    try {
        await axios.post(CORE_API_URL, message);
        console.log('Message sent to Core API');
    } catch (error) {
        console.error('Error sending message to Core API:', error.message);
    }
});

client.initialize();

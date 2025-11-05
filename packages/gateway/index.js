const { Client } = require('whatsapp-web.js');
const { handleQr, handleReady, handleMessage } = require('./handlers');

const client = new Client();

client.on('qr', handleQr);
client.on('ready', handleReady);
client.on('message', handleMessage);

client.initialize();

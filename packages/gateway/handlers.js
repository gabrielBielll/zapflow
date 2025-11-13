const qrcode = require('qrcode-terminal');
const axios = require('axios');

const CORE_API_URL = 'http://localhost:3000/webhook/whatsapp';

let qrCodeData = null;

function handleQr(qr) {
    console.log('QR RECEIVED', qr);
    qrCodeData = qr;
    qrcode.generate(qr, { small: true });
}

function getQrCode() {
    return qrCodeData;
}

function handleReady() {
    console.log('Client is ready!');
}

async function handleMessage(message) {
    console.log(`Message received: ${message.body}`);
    try {
        await axios.post(CORE_API_URL, message);
        console.log('Message sent to Core API');
    } catch (error) {
        console.error('Error sending message to Core API:', error.message);
    }
}

module.exports = {
    handleQr,
    handleReady,
    handleMessage,
    getQrCode,
};

const { Client } = require('whatsapp-web.js');
const { handleQr, handleReady, handleMessage } = require('./handlers');
const express = require('express');
const bodyParser = require('body-parser');

function createApp(client) {
    const app = express();
    app.use(bodyParser.json());

    app.post('/send-message', async (req, res) => {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).send({ error: 'Parameters "to" and "message" are required.' });
        }

        try {
            await client.sendMessage(to, message);
            res.status(200).send({ status: 'Message sent' });
            console.log(`Message sent to ${to}: ${message}`);
        } catch (error) {
            console.error('Error sending message:', error.message);
            res.status(500).send({ error: 'Failed to send message' });
        }
    });

    return app;
}

if (require.main === module) {
    const client = new Client();
    const port = 5001;

    // --- Existing whatsapp-web.js client setup ---
    client.on('qr', handleQr);
    client.on('ready', handleReady);
    client.on('message', handleMessage);

    client.initialize();

    const app = createApp(client);
    app.listen(port, () => {
        console.log(`Gateway service listening on port ${port}`);
    });
}

module.exports = { createApp };

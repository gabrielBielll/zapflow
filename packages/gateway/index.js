
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { initializeClient, sendMessage, getClientStatus } = require('./handlers');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8081;

// In-memory store for WhatsApp clients
const clients = {};

app.post('/init-session', async (req, res) => {
    const { channel_id } = req.body;
    if (!channel_id) {
        return res.status(400).send({ error: 'channel_id is required' });
    }

    try {
        const qr = await initializeClient(channel_id);
        res.status(200).send({ qr_string: qr });
    } catch (error) {
        console.error(`Failed to initialize session for ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to initialize session' });
    }
});

app.post('/send-message', async (req, res) => {
    const { to, body, channel_id } = req.body;
    if (!to || !body || !channel_id) {
        return res.status(400).send({ error: '"to", "body", and "channel_id" are required' });
    }

    try {
        await sendMessage(channel_id, to, body);
        res.status(200).send({ status: 'Message sent' });
    } catch (error) {
        console.error(`Failed to send message for ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to send message' });
    }
});

app.get('/status/:channel_id', (req, res) => {
    const { channel_id } = req.params;
    const status = getClientStatus(channel_id);
    if (status) {
        res.status(200).send({ status });
    } else {
        res.status(404).send({ error: 'Client not found' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Gateway service listening on port ${PORT}`);
    });
}

module.exports = app;


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const providerManager = require('./providers/provider-manager');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8081;

// Get available providers
app.get('/providers', (req, res) => {
    try {
        const providers = providerManager.getAvailableProviders();
        res.status(200).send({ providers });
    } catch (error) {
        console.error('Failed to get providers:', error);
        res.status(500).send({ error: 'Failed to get providers' });
    }
});

// Initialize session with provider choice
app.post('/init-session', async (req, res) => {
    const { channel_id, provider = 'baileys', config = {} } = req.body;
    
    if (!channel_id) {
        return res.status(400).send({ error: 'channel_id is required' });
    }

    try {
        const qr = await providerManager.initializeProvider(channel_id, provider, config);
        res.status(200).send({ 
            qr_string: qr,
            provider,
            channel_id 
        });
    } catch (error) {
        console.error(`Failed to initialize ${provider} session for ${channel_id}:`, error);
        res.status(500).send({ 
            error: 'Failed to initialize session',
            provider,
            details: error.message 
        });
    }
});

// Send message with provider specification
app.post('/send-message', async (req, res) => {
    const { to, body, channel_id, provider = 'baileys' } = req.body;
    
    if (!to || !body || !channel_id) {
        return res.status(400).send({ error: '"to", "body", and "channel_id" are required' });
    }

    try {
        const result = await providerManager.sendMessage(channel_id, provider, to, body);
        res.status(200).send({ 
            status: 'Message sent',
            provider,
            result 
        });
    } catch (error) {
        console.error(`Failed to send message via ${provider} for ${channel_id}:`, error);
        res.status(500).send({ 
            error: 'Failed to send message',
            provider,
            details: error.message 
        });
    }
});

// Get status with provider specification
app.get('/status/:channel_id/:provider', (req, res) => {
    const { channel_id, provider } = req.params;
    
    try {
        const status = providerManager.getProviderStatus(channel_id, provider);
        if (status) {
            res.status(200).send({ status });
        } else {
            res.status(404).send({ error: 'Client not found', provider, channel_id });
        }
    } catch (error) {
        console.error(`Failed to get status for ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to get status' });
    }
});

// Get status with default provider (backward compatibility)
app.get('/status/:channel_id', (req, res) => {
    const { channel_id } = req.params;
    const provider = 'baileys'; // default
    
    try {
        const status = providerManager.getProviderStatus(channel_id, provider);
        if (status) {
            res.status(200).send({ status });
        } else {
            res.status(404).send({ error: 'Client not found', provider, channel_id });
        }
    } catch (error) {
        console.error(`Failed to get status for ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to get status' });
    }
});

// Cleanup with provider specification
app.delete('/cleanup/:channel_id/:provider', async (req, res) => {
    const { channel_id, provider } = req.params;
    
    try {
        const result = await providerManager.cleanupProvider(channel_id, provider);
        res.status(200).send(result);
    } catch (error) {
        console.error(`Failed to cleanup ${provider} client ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to cleanup client' });
    }
});

// Cleanup with default provider (backward compatibility)
app.delete('/cleanup/:channel_id', async (req, res) => {
    const { channel_id } = req.params;
    const provider = 'baileys'; // default
    
    try {
        const result = await providerManager.cleanupProvider(channel_id, provider);
        res.status(200).send(result);
    } catch (error) {
        console.error(`Failed to cleanup ${provider} client ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to cleanup client' });
    }
});

// Get all active providers
app.get('/active-providers', (req, res) => {
    try {
        const activeProviders = providerManager.getActiveProviders();
        res.status(200).send({ activeProviders });
    } catch (error) {
        console.error('Failed to get active providers:', error);
        res.status(500).send({ error: 'Failed to get active providers' });
    }
});

// Webhook endpoint for WAHA (generic)
app.post('/webhook', async (req, res) => {
    const messageData = req.body;
    
    try {
        console.log('=== WAHA WEBHOOK RECEIVED ===');
        console.log('Raw webhook data:', JSON.stringify(messageData, null, 2));
        
        // Validate webhook structure
        if (!messageData) {
            console.error('Webhook validation failed: Empty message data');
            return res.status(400).send({ error: 'Invalid webhook: empty data' });
        }

        // Handle different WAHA webhook formats
        let processedMessage;
        
        // Check if it's a message event
        if (messageData.event === 'message' && messageData.payload) {
            // New WAHA format with event wrapper
            processedMessage = messageData.payload;
            console.log('Processing WAHA event format message');
        } else if (messageData.from && messageData.body !== undefined) {
            // Direct message format
            processedMessage = messageData;
            console.log('Processing direct WAHA message format');
        } else {
            console.log('Webhook ignored: not a message event or invalid format');
            return res.status(200).send({ status: 'ignored - not a message' });
        }

        // Skip messages sent by the bot itself (CRITICAL for avoiding loops)
        if (processedMessage.fromMe === true) {
            console.log('Webhook ignored: message sent by bot itself (fromMe=true)');
            return res.status(200).send({ status: 'ignored - own message' });
        }

        // Validate required fields
        if (!processedMessage.from || processedMessage.body === undefined) {
            console.error('Webhook validation failed: missing required fields (from/body)');
            return res.status(400).send({ error: 'Invalid webhook: missing from or body' });
        }

        // Skip empty messages
        if (!processedMessage.body || processedMessage.body.trim() === '') {
            console.log('Webhook ignored: empty message body');
            return res.status(200).send({ status: 'ignored - empty message' });
        }

        console.log(`Processing message from: ${processedMessage.from}`);
        console.log(`Message text: "${processedMessage.body}"`);
        
        // For WAHA, we'll use a default channel and provider
        const channel_id = messageData.session || processedMessage.session || 'default';
        const provider = 'waha';
        
        console.log(`Using channel_id: ${channel_id}, provider: ${provider}`);
        
        // Process webhook through provider manager
        const result = await providerManager.handleWebhook(channel_id, provider, processedMessage);
        
        // If message was ignored, return appropriate status
        if (result && result.status === 'ignored') {
            console.log(`Webhook ignored: ${result.reason}`);
            return res.status(200).send({ status: `ignored - ${result.reason}` });
        }
        
        console.log('Webhook processed successfully');
        res.status(200).send({ status: 'webhook processed' });
    } catch (error) {
        console.error('=== WEBHOOK ERROR ===');
        console.error('Error processing WAHA webhook:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).send({ error: 'Failed to process webhook', details: error.message });
    }
});

// Webhook endpoint for WAHA (with parameters)
app.post('/webhook/:channel_id/:provider', async (req, res) => {
    const { channel_id, provider } = req.params;
    const messageData = req.body;

    try {
        await providerManager.handleWebhook(channel_id, provider, messageData);
        res.status(200).send({ status: 'webhook processed' });
    } catch (error) {
        console.error(`Failed to process webhook for ${channel_id}:`, error);
        res.status(500).send({ error: 'Failed to process webhook' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Gateway service listening on port ${PORT}`);
    });
}

module.exports = app;

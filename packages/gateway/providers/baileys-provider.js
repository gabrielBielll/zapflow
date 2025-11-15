const BaseProvider = require('./base-provider');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const P = require('pino');

class BaileysProvider extends BaseProvider {
  constructor(channelId) {
    super(channelId);
    this.socket = null;
    this.currentQR = null;
    this.isInitializing = false;
    this.logger = P({ level: 'silent' });
    this.coreApiUrl = process.env.CORE_API_URL || 'http://localhost:8080/api';
  }

  async initialize() {
    console.log(`Initializing Baileys WhatsApp client for channel: ${this.channelId}`);

    // If already ready, return success
    if (this.socket && this.status === 'ready') {
      console.log(`Baileys client ${this.channelId} already ready`);
      return 'already_connected';
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      throw new Error('Baileys client is being initialized. Please wait.');
    }

    try {
      this.isInitializing = true;

      // Clean up any existing client
      if (this.socket) {
        console.log(`Cleaning up existing Baileys client for channel: ${this.channelId}`);
        try {
          this.socket.end();
        } catch (error) {
          console.log(`Error ending existing socket: ${error.message}`);
        }
        this.socket = null;
        this.status = 'disconnected';
        this.currentQR = null;
      }

      // Create auth directory
      const authDir = path.join(__dirname, '..', '.baileys_auth', this.channelId);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      // Get auth state
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`Using Baileys version: ${version}, isLatest: ${isLatest}`);

      return new Promise((resolve, reject) => {
        // Create socket
        const socket = makeWASocket({
          version,
          logger: this.logger,
          printQRInTerminal: false,
          auth: state,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 30000,
          keepAliveIntervalMs: 30000,
          emitOwnEvents: true,
          fireInitQueries: true,
          generateHighQualityLinkPreview: false,
          syncFullHistory: false,
          markOnlineOnConnect: true,
          browser: ['ZapFlow', 'Chrome', '1.0.0'],
        });

        this.socket = socket;
        this.status = 'initializing';

        // Handle connection updates
        socket.ev.on('connection.update', (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            console.log(`Baileys QR Code generated for ${this.channelId}`);
            this.currentQR = qr;
            this.status = 'qr_generated';
            this.isInitializing = false;
            resolve(qr);
          }

          if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`Baileys connection closed for ${this.channelId}`);
            console.log(`Disconnect reason: ${statusCode} (${this.getDisconnectReason(statusCode)})`);

            if (shouldReconnect) {
              this.status = 'reconnecting';
              console.log(`Attempting to reconnect Baileys ${this.channelId}...`);
            } else {
              console.log(`Baileys client ${this.channelId} logged out`);
              this.status = 'disconnected';
              this.cleanupSessionFiles();
              this.socket = null;
              this.currentQR = null;
            }
          } else if (connection === 'open') {
            console.log(`Baileys WhatsApp client ${this.channelId} is ready!`);
            this.status = 'ready';
            this.currentQR = null;
          }
        });

        // Handle credentials update
        socket.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        socket.ev.on('messages.upsert', async (m) => {
          await this.handleIncomingMessage(m);
        });

        // Timeout after 60 seconds
        setTimeout(() => {
          if (this.status === 'initializing') {
            this.isInitializing = false;
            reject(new Error('Baileys QR code generation timeout'));
          }
        }, 60000);
      });

    } catch (error) {
      console.error(`Error in Baileys initializeClient for ${this.channelId}:`, error);
      this.isInitializing = false;
      throw error;
    }
  }

  async sendMessage(to, message) {
    if (!this.socket || this.status !== 'ready') {
      throw new Error(`Baileys WhatsApp client ${this.channelId} is not ready. Status: ${this.status}`);
    }

    try {
      // Format phone number for Baileys
      const formattedNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      await this.socket.sendMessage(formattedNumber, { text: message });
      console.log(`Baileys message sent to ${to} via ${this.channelId}: ${message}`);
      return { status: 'sent', message: 'Message sent successfully' };
    } catch (error) {
      console.error(`Failed to send Baileys message via ${this.channelId}:`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      ...super.getStatus(),
      provider: 'baileys',
      hasQR: !!this.currentQR,
      qr: this.currentQR
    };
  }

  async cleanup() {
    console.log(`Cleaning up Baileys client session for ${this.channelId}`);

    if (this.socket) {
      try {
        this.socket.end();
      } catch (error) {
        console.log(`Error ending Baileys socket: ${error.message}`);
      }
      this.socket = null;
    }

    this.status = 'disconnected';
    this.currentQR = null;
    this.cleanupSessionFiles();

    return { status: 'cleaned', provider: 'baileys' };
  }

  // Helper methods
  getDisconnectReason(statusCode) {
    const reasons = {
      [DisconnectReason.badSession]: 'Bad Session File',
      [DisconnectReason.connectionClosed]: 'Connection Closed',
      [DisconnectReason.connectionLost]: 'Connection Lost',
      [DisconnectReason.connectionReplaced]: 'Connection Replaced',
      [DisconnectReason.loggedOut]: 'Logged Out',
      [DisconnectReason.restartRequired]: 'Restart Required',
      [DisconnectReason.timedOut]: 'Timed Out',
      [DisconnectReason.forbidden]: 'Forbidden',
      [DisconnectReason.unavailable]: 'Unavailable'
    };
    return reasons[statusCode] || `Unknown (${statusCode})`;
  }

  cleanupSessionFiles() {
    try {
      const sessionPath = path.join(__dirname, '..', '.baileys_auth', this.channelId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`Cleaned up Baileys session files for ${this.channelId}`);
      }
    } catch (error) {
      console.log(`Error cleaning Baileys session files: ${error.message}`);
    }
  }

  async handleIncomingMessage(m) {
    try {
      const message = m.messages[0];

      // Skip if not a new message or from status broadcast
      if (!m.type === 'notify' || message.key.remoteJid === 'status@broadcast') return;

      // Skip messages sent by the bot itself
      if (message.key.fromMe) return;

      const messageText = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';

      if (!messageText) return;

      console.log(`Baileys received message from ${message.key.remoteJid}: ${messageText}`);

      // Send message to AI service for processing
      const response = await axios.post(`${this.coreApiUrl}/v1/frontend/conversations/generate-response`, {
        assistant_id: 'default',
        query: messageText,
        history: []
      }, {
        timeout: 30000
      });

      if (response.data && response.data.response) {
        // Send AI response back to WhatsApp
        await this.socket.sendMessage(message.key.remoteJid, {
          text: response.data.response
        });
        console.log(`Baileys AI response sent to ${message.key.remoteJid}: ${response.data.response}`);
      } else {
        console.log('No response from AI service');
      }
    } catch (error) {
      console.error('Error processing incoming message in Baileys:', error);
      try {
        await this.socket.sendMessage(message.key.remoteJid, {
          text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
        });
      } catch (sendError) {
        console.error('Error sending error message in Baileys:', sendError);
      }
    }
  }
}

module.exports = BaileysProvider;
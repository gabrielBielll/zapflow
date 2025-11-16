const BaseProvider = require('./base-provider');
const axios = require('axios');

class WahaProvider extends BaseProvider {
  constructor(channelId, wahaConfig = {}) {
    super(channelId);
    this.wahaUrl = wahaConfig.url || process.env.WAHA_URL || 'http://localhost:3000';
    this.wahaApiKey = wahaConfig.apiKey || process.env.WAHA_API_KEY;
    // WAHA Core only supports 'default' session
    this.sessionName = 'default';
    this.currentQR = null;
    this.coreApiUrl = process.env.CORE_API_URL || 'http://core-api:8080';
    this.webhookUrl = wahaConfig.webhookUrl || process.env.WAHA_WEBHOOK_URL || 'http://gateway:8081/webhook';
    
    // Configure axios instance for WAHA API
    this.wahaClient = axios.create({
      baseURL: this.wahaUrl,
      timeout: 30000,
      headers: this.wahaApiKey ? { 'X-Api-Key': this.wahaApiKey } : {}
    });
  }

  async initialize() {
    console.log(`Initializing WAHA WhatsApp client for channel: ${this.channelId}`);

    try {
      // Check if session already exists and is ready
      const sessionStatus = await this.getSessionStatus();
      if (sessionStatus && sessionStatus.status === 'WORKING') {
        console.log(`WAHA client ${this.channelId} already ready`);
        this.status = 'ready';
        return 'already_connected';
      }

      // Start new session
      this.status = 'initializing';
      
      const sessionConfig = {
        name: this.sessionName,
        config: {
          webhooks: this.webhookUrl ? [
            {
              url: this.webhookUrl,
              events: ['message']
            }
          ] : []
        }
      };

      console.log(`Starting WAHA session: ${this.sessionName}`);
      console.log(`Configuring webhook URL: ${this.webhookUrl}`);
      console.log(`Session config:`, JSON.stringify(sessionConfig, null, 2));
      const response = await this.wahaClient.post('/api/sessions/start', sessionConfig);
      
      if (response.data && response.data.name) {
        console.log(`WAHA session ${this.sessionName} started successfully`);
        
        // Wait for QR code or connection
        return await this.waitForQROrConnection();
      } else {
        throw new Error('Failed to start WAHA session');
      }

    } catch (error) {
      console.error(`Error initializing WAHA client for ${this.channelId}:`, error);
      this.status = 'error';
      throw error;
    }
  }

  async waitForQROrConnection() {
    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          attempts++;
          
          const sessionStatus = await this.getSessionStatus();
          
          if (sessionStatus) {
            switch (sessionStatus.status) {
              case 'SCAN_QR_CODE':
                // Get QR code
                const qrResponse = await this.wahaClient.get(`/api/sessions/${this.sessionName}/auth/qr`);
                if (qrResponse.data && qrResponse.data.qr) {
                  console.log(`WAHA QR Code generated for ${this.channelId}`);
                  this.currentQR = qrResponse.data.qr;
                  this.status = 'qr_generated';
                  resolve(this.currentQR);
                  return;
                }
                break;
                
              case 'WORKING':
                console.log(`WAHA WhatsApp client ${this.channelId} is ready!`);
                this.status = 'ready';
                this.currentQR = null;
                resolve('connected');
                return;
                
              case 'FAILED':
                this.status = 'error';
                reject(new Error('WAHA session failed to connect'));
                return;
            }
          }

          if (attempts >= maxAttempts) {
            this.status = 'timeout';
            reject(new Error('WAHA connection timeout'));
            return;
          }

          // Check again in 1 second
          setTimeout(checkStatus, 1000);
          
        } catch (error) {
          console.error('Error checking WAHA session status:', error);
          reject(error);
        }
      };

      checkStatus();
    });
  }

  async getSessionStatus() {
    try {
      const response = await this.wahaClient.get(`/api/sessions/${this.sessionName}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null; // Session doesn't exist
      }
      throw error;
    }
  }

  async sendMessage(to, message) {
    if (this.status !== 'ready') {
      throw new Error(`WAHA WhatsApp client ${this.channelId} is not ready. Status: ${this.status}`);
    }

    try {
      // Format phone number for WAHA
      const formattedNumber = this.formatPhoneNumber(to);
      
      const messageData = {
        chatId: `${formattedNumber}@c.us`,
        text: message,
        session: this.sessionName
      };

      const response = await this.wahaClient.post('/api/sendText', messageData);
      
      console.log(`WAHA message sent to ${to} via ${this.channelId}: ${message}`);
      return { 
        status: 'sent', 
        message: 'Message sent successfully',
        wahaResponse: response.data 
      };
      
    } catch (error) {
      console.error(`Failed to send WAHA message via ${this.channelId}:`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      ...super.getStatus(),
      provider: 'waha',
      sessionName: this.sessionName,
      hasQR: !!this.currentQR,
      qr: this.currentQR,
      wahaUrl: this.wahaUrl
    };
  }

  async cleanup() {
    console.log(`Cleaning up WAHA client session for ${this.channelId}`);

    try {
      // Stop the session
      await this.wahaClient.post(`/api/sessions/${this.sessionName}/stop`);
      console.log(`WAHA session ${this.sessionName} stopped`);
      
      // Optionally logout (this will require re-authentication)
      // await this.wahaClient.post(`/api/sessions/${this.sessionName}/auth/logout`);
      
    } catch (error) {
      console.log(`Error stopping WAHA session: ${error.message}`);
    }

    this.status = 'disconnected';
    this.currentQR = null;

    return { status: 'cleaned', provider: 'waha' };
  }

  // Handle incoming messages via webhook (simplified - main logic is in Provider Manager)
  async handleWebhookMessage(messageData) {
    // This method is kept for compatibility but the main logic is now in Provider Manager
    console.log(`WAHA Provider: Message handling delegated to Provider Manager`);
  }

  formatPhoneNumber(phone) {
    console.log(`Formatting phone number: ${phone}`);
    
    // Handle WAHA format (remove @c.us if present)
    let cleaned = phone.replace(/@c\.us$/, '');
    
    // Remove any non-numeric characters except +
    cleaned = cleaned.replace(/[^\d+]/g, '');
    
    // Remove + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // If it doesn't start with country code, add Brazil (55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = `55${cleaned}`;
    }
    
    // Validate Brazilian phone number format
    if (cleaned.length < 12 || cleaned.length > 13) {
      console.warn(`Invalid phone number length: ${cleaned} (length: ${cleaned.length})`);
    }
    
    console.log(`Formatted phone number: ${cleaned}`);
    return cleaned;
  }
}

module.exports = WahaProvider;
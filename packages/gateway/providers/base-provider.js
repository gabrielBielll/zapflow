// Base Provider Interface
class BaseProvider {
  constructor(channelId) {
    this.channelId = channelId;
    this.status = 'disconnected';
  }

  // Abstract methods that must be implemented by each provider
  async initialize() {
    throw new Error('initialize() must be implemented by provider');
  }

  async sendMessage(to, message) {
    throw new Error('sendMessage() must be implemented by provider');
  }

  getStatus() {
    return {
      status: this.status,
      channelId: this.channelId
    };
  }

  async cleanup() {
    throw new Error('cleanup() must be implemented by provider');
  }

  // Helper method to format phone numbers
  formatPhoneNumber(phone) {
    // Remove any non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add country code (assuming Brazil +55)
    if (!cleaned.startsWith('+')) {
      return `+55${cleaned}`;
    }
    
    return cleaned;
  }
}

module.exports = BaseProvider;
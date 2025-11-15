const BaileysProvider = require('./baileys-provider');
const WahaProvider = require('./waha-provider');

class ProviderManager {
  constructor() {
    this.providers = new Map(); // channelId -> provider instance
    this.availableProviders = {
      baileys: BaileysProvider,
      waha: WahaProvider
    };
  }

  // Get available provider types
  getAvailableProviders() {
    return Object.keys(this.availableProviders).map(type => ({
      type,
      name: this.getProviderDisplayName(type),
      description: this.getProviderDescription(type)
    }));
  }

  getProviderDisplayName(type) {
    const names = {
      baileys: 'Baileys (Oficial)',
      waha: 'WAHA (HTTP API)'
    };
    return names[type] || type;
  }

  getProviderDescription(type) {
    const descriptions = {
      baileys: 'Biblioteca oficial do WhatsApp Web. Mais estável mas requer mais recursos.',
      waha: 'API HTTP para WhatsApp. Mais leve e fácil de escalar, mas pode ser menos estável.'
    };
    return descriptions[type] || 'Provider desconhecido';
  }

  // Create or get provider instance
  getProvider(channelId, providerType = 'baileys', config = {}) {
    const key = `${channelId}_${providerType}`;
    
    if (this.providers.has(key)) {
      return this.providers.get(key);
    }

    const ProviderClass = this.availableProviders[providerType];
    if (!ProviderClass) {
      throw new Error(`Provider type '${providerType}' not found`);
    }

    const provider = new ProviderClass(channelId, config);
    this.providers.set(key, provider);
    
    console.log(`Created ${providerType} provider for channel ${channelId}`);
    return provider;
  }

  // Initialize a provider
  async initializeProvider(channelId, providerType = 'baileys', config = {}) {
    const provider = this.getProvider(channelId, providerType, config);
    return await provider.initialize();
  }

  // Send message through provider
  async sendMessage(channelId, providerType, to, message) {
    const key = `${channelId}_${providerType}`;
    const provider = this.providers.get(key);
    
    if (!provider) {
      throw new Error(`Provider not found for channel ${channelId} with type ${providerType}`);
    }

    return await provider.sendMessage(to, message);
  }

  // Get provider status
  getProviderStatus(channelId, providerType) {
    const key = `${channelId}_${providerType}`;
    const provider = this.providers.get(key);
    
    if (!provider) {
      return null;
    }

    return provider.getStatus();
  }

  // Cleanup provider
  async cleanupProvider(channelId, providerType) {
    const key = `${channelId}_${providerType}`;
    const provider = this.providers.get(key);
    
    if (!provider) {
      return { status: 'not_found' };
    }

    const result = await provider.cleanup();
    this.providers.delete(key);
    
    return result;
  }

  // Get all active providers
  getActiveProviders() {
    const active = [];
    for (const [key, provider] of this.providers.entries()) {
      const [channelId, providerType] = key.split('_');
      active.push({
        channelId,
        providerType,
        status: provider.getStatus()
      });
    }
    return active;
  }

  // Cleanup all providers
  async cleanupAll() {
    const results = [];
    for (const [key, provider] of this.providers.entries()) {
      try {
        const result = await provider.cleanup();
        results.push({ key, result });
      } catch (error) {
        results.push({ key, error: error.message });
      }
    }
    this.providers.clear();
    return results;
  }

  // Handle webhook for WAHA providers
  async handleWebhook(channelId, providerType, messageData) {
    const key = `${channelId}_${providerType}`;
    const provider = this.providers.get(key);
    
    if (!provider || providerType !== 'waha') {
      console.log(`Webhook ignored: provider not found or not WAHA type`);
      return;
    }

    if (typeof provider.handleWebhookMessage === 'function') {
      await provider.handleWebhookMessage(messageData);
    }
  }
}

// Singleton instance
const providerManager = new ProviderManager();

module.exports = providerManager;
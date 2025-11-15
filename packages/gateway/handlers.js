// WhatsApp Gateway Service - Legacy Handlers (Backward Compatibility)
// This file maintains backward compatibility with the old API
// New implementations should use the provider system directly

const providerManager = require('./providers/provider-manager');

console.log("Gateway Service - Legacy Handlers (Backward Compatibility)");

// Default provider for legacy compatibility
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'baileys';

// Initialize WhatsApp client for a channel (legacy)
async function initializeClient(channel_id, provider = DEFAULT_PROVIDER) {
  console.log(`[LEGACY] Initializing ${provider} WhatsApp client for channel: ${channel_id}`);
  return await providerManager.initializeProvider(channel_id, provider);
}

// Send message through WhatsApp (legacy)
async function sendMessage(channel_id, to, message, provider = DEFAULT_PROVIDER) {
  console.log(`[LEGACY] Sending message via ${provider} for channel: ${channel_id}`);
  return await providerManager.sendMessage(channel_id, provider, to, message);
}

// Get client status (legacy)
function getClientStatus(channel_id, provider = DEFAULT_PROVIDER) {
  console.log(`[LEGACY] Getting status for ${provider} client: ${channel_id}`);
  return providerManager.getProviderStatus(channel_id, provider);
}

// Clean up client session (legacy)
async function cleanupClient(channel_id, provider = DEFAULT_PROVIDER) {
  console.log(`[LEGACY] Cleaning up ${provider} client session for ${channel_id}`);
  return await providerManager.cleanupProvider(channel_id, provider);
}

module.exports = {
  initializeClient,
  sendMessage,
  getClientStatus,
  cleanupClient
};
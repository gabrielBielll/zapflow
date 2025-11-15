// HARDCODED PRODUCTION VARIABLES FOR LOCAL DEVELOPMENT
// Switch between local and production by commenting/uncommenting lines

// PRODUCTION CONFIGURATION (pointing to Render services)
export const CORE_API_URL = 'https://zflow-core-api.onrender.com';
export const GATEWAY_URL = 'https://zapflow-gateway.onrender.com';

// LOCAL CONFIGURATION (uncomment to use local services)
// export const CORE_API_URL = 'http://localhost:8080';
// export const GATEWAY_URL = 'http://localhost:5001';

// Export configuration object for easy access
export const config = {
  CORE_API_URL,
  GATEWAY_URL,
};

export default config;
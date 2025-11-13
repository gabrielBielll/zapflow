# Implementation Plan

- [x] 1. Configure environment variables for service communication
  - Update docker-compose.yml with all required environment variables for local development
  - Add missing environment variables: CORE_API_URL, AI_SERVICE_URL, GATEWAY_URL, DATABASE_URL
  - Ensure services can communicate using internal URLs
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create HTTP server for AI Service
  - Implement Express.js server to expose Genkit flows as REST endpoints
  - Add POST /generate endpoint that calls generateResponse flow
  - Add POST /index-document endpoint that calls indexDocument flow
  - Include proper error handling and JSON response formatting
  - _Requirements: 4.1, 4.2_

- [x] 3. Implement WhatsApp connection interface in frontend
  - Create WhatsAppConnection component with QR code display
  - Add connection status indicators (pending_qr, ready, disconnected)
  - Implement connection initialization and status polling
  - Add reconnection functionality for failed connections
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Create WhatsApp connection page in dashboard
  - Add new route /dashboard/whatsapp for WhatsApp connection management
  - Integrate WhatsAppConnection component into dashboard layout
  - Add navigation link in dashboard sidebar
  - Include connection status in dashboard overview
  - _Requirements: 2.1, 2.2_

- [x] 5. Implement assistant-phone number association logic
  - Update whatsapp-status-webhook-handler to capture phone number on ready status
  - Create database record in assistant_phone_numbers table when connection established
  - Modify channel initialization to link assistant_id with channel_id
  - Add error handling for duplicate phone number associations
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Fix webhook endpoints and message flow
  - Update webhook URLs in gateway handlers to match Core API routes
  - Ensure whatsapp-message-webhook-handler correctly processes incoming messages
  - Verify AI service integration in webhook handler works with new HTTP endpoints
  - Test complete message flow: WhatsApp → Gateway → Core API → AI Service → Gateway → WhatsApp
  - _Requirements: 4.3, 4.4_

- [x] 7. Add database connection and migration setup
  - Configure PostgreSQL connection string in Core API
  - Ensure database migrations run automatically on startup
  - Add connection health check and error handling
  - Test all database operations with proper error responses
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Create Render deployment configuration
  - Add render.yaml configuration file for multi-service deployment
  - Configure environment variables for each service in Render
  - Set up PostgreSQL database service in Render
  - Configure internal service URLs and external API endpoints
  - _Requirements: 1.2, 1.4_

- [x] 9. Add comprehensive error handling and logging
  - Implement proper error responses in all API endpoints
  - Add structured logging for debugging in all services
  - Create user-friendly error messages in frontend
  - Add retry mechanisms for failed service communications
  - _Requirements: 1.4, 4.4, 5.4_

- [x] 10. Create integration tests for end-to-end flow
  - Write test for complete assistant creation and WhatsApp connection flow
  - Add test for message processing and AI response generation
  - Create test for error scenarios and recovery mechanisms
  - Verify all service communications work correctly
  - _Requirements: 2.4, 3.4, 4.4_
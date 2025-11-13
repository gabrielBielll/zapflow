# Design Document

## Overview

O sistema ZapFlow já possui uma arquitetura sólida de microsserviços com a maioria dos componentes implementados. Este design foca em completar as integrações faltantes para permitir o fluxo completo de ponta a ponta no ambiente de staging. 

O sistema atual possui:
- ✅ Frontend Next.js com interface para criar assistentes
- ✅ Gateway WhatsApp com suporte a QR code e múltiplas sessões
- ✅ Core API em Clojure com handlers para assistentes, webhooks e canais
- ✅ AI Service com Genkit, RAG e integração Gemini
- ✅ Estrutura de banco de dados completa

**Gaps identificados:**
1. Variáveis de ambiente não configuradas no docker-compose.yml
2. Interface frontend para conexão WhatsApp não implementada
3. Associação entre assistentes e números de telefone não implementada
4. Configuração de deployment para Render incompleta

## Architecture

### Current Architecture (Functional)
```
┌─────────────────┐      ┌──────────┐      ┌─────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│  Usuário Final  │◄───►│ WhatsApp │◄───►│  Gateway (Node.js)  │◄───►│  Core API (Clojure)     │◄───►│  AI Service (Genkit)   │
└─────────────────┘      └──────────┘      └─────────────────────┘      └─────────────────────────┘      └────────────────────────┘
                                                     ▲                                    ▲
                                                     │                                    │
                                                     ▼                                    ▼
                                           ┌─────────────────────┐              ┌─────────────────────┐
                                           │   QR Code API       │              │   PostgreSQL DB     │
                                           │   /init-session     │              │   (Assistants,      │
                                           │   /send-message     │              │    Conversations,   │
                                           │   /status           │              │    Channels)        │
                                           └─────────────────────┘              └─────────────────────┘
                                                     ▲
                                                     │
                                                     ▼
┌───────────────────┐      ┌───────────────────────────────┐
│  Dono do Negócio  │◄───►│  Frontend (React/Next.js)     │
└───────────────────┘      └───────────────────────────────┘
```

### Missing Components to Implement

1. **Frontend WhatsApp Connection Page**
2. **Environment Variables Configuration**  
3. **Assistant-Phone Number Association Logic**
4. **Render Deployment Configuration**

## Components and Interfaces

### 1. Frontend WhatsApp Connection Interface

**New Component: `WhatsAppConnection.tsx`**
- **Location:** `packages/frontend/src/components/whatsapp-connection.tsx`
- **Responsibilities:**
  - Display QR code for WhatsApp connection
  - Show connection status (pending_qr, ready, disconnected)
  - Handle connection initialization and status updates
  - Provide reconnection functionality

**API Integration:**
- `POST /api/v1/frontend/assistants/:id/channels/whatsapp` - Initialize WhatsApp channel
- `GET /status/:channel_id` - Check connection status (via Gateway)

### 2. Environment Variables Configuration

**Docker Compose Updates:**
```yaml
services:
  gateway:
    environment:
      - CORE_API_URL=http://core-api:3000
      
  core-api:
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/zapflow
      - AI_SERVICE_URL=http://ai-service:3000
      - GATEWAY_URL=http://gateway:3000
      
  ai-service:
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
```

**Render Configuration:**
- Each service needs proper environment variables
- Internal service URLs using service names
- External URLs for frontend API calls

### 3. Assistant-Phone Association Logic

**Database Integration:**
- Table `assistant_phone_numbers` already exists
- Need to populate when WhatsApp connection is established

**Core API Enhancement:**
- Webhook handler already looks for assistant by phone number
- Need to create association when channel is initialized

### 4. AI Service Integration

**Current Implementation Analysis:**
- ✅ Genkit flows already implemented (`generateResponse`, `indexDocument`)
- ✅ RAG with ChromaDB integration
- ✅ Gemini model integration
- ✅ Error handling for vector store failures

**Missing:**
- HTTP server to expose flows as REST endpoints

## Data Models

### Existing Models (Already Implemented)
```sql
-- Assistants table
assistants (id, name, purpose, created_at, updated_at)

-- Assistant settings
assistant_settings (id, assistant_id, personality, rag_enabled, created_at, updated_at)

-- Channels for WhatsApp connections
channels (id, assistant_id, channel_type, status, created_at, updated_at)

-- Phone number associations
assistant_phone_numbers (id, assistant_id, phone_number, created_at, updated_at)

-- Conversation history
conversation_history (id, assistant_id, sender, message, response, created_at)
```

### Data Flow for Phone Association
1. User creates assistant → `assistants` table
2. User clicks "Connect WhatsApp" → Creates record in `channels` table
3. Gateway generates QR code → Channel status = 'pending_qr'
4. User scans QR → WhatsApp sends ready event with phone number
5. System creates record in `assistant_phone_numbers` table
6. Channel status = 'ready'

## Error Handling

### Connection Failures
- **QR Code Generation Fails:** Display error message, allow retry
- **WhatsApp Disconnection:** Update channel status, show reconnection option
- **Service Communication Errors:** Graceful degradation with user feedback

### AI Processing Errors
- **Gemini API Failures:** Return default error message
- **RAG Retrieval Errors:** Continue without context (already implemented)
- **Vector Store Unavailable:** Fallback to basic LLM response

### Database Errors
- **Connection Failures:** Clear error messages in logs
- **Migration Issues:** Automatic retry mechanism
- **Query Failures:** Proper error responses to frontend

## Testing Strategy

### Integration Testing
1. **End-to-End Flow Test:**
   - Create assistant via frontend
   - Initialize WhatsApp connection
   - Send test message
   - Verify AI response received

2. **Service Communication Test:**
   - Verify all environment variables are accessible
   - Test API calls between services
   - Validate webhook delivery

3. **Database Integration Test:**
   - Test assistant creation and retrieval
   - Verify phone number association
   - Check conversation history storage

### Staging Environment Testing
1. **Render Deployment Test:**
   - All services start successfully
   - Environment variables properly configured
   - Services can communicate internally

2. **WhatsApp Integration Test:**
   - QR code generation works
   - Connection establishment successful
   - Message sending/receiving functional

3. **AI Response Test:**
   - Messages trigger AI processing
   - Responses are generated and sent
   - Error handling works correctly
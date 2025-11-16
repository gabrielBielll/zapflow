# Design Document

## Overview

Este design implementa um sistema de resposta automática da IA para mensagens do WhatsApp usando a arquitetura existente. O fluxo principal é: WAHA recebe mensagem → Gateway processa webhook → Core API orquestra → AI Service gera resposta → Gateway envia resposta de volta.

A implementação foca em conectar os componentes existentes sem modificações estruturais significativas, usando conhecimento hardcoded da DeepSaude e evitando dependências de banco de dados.

## Architecture

### Fluxo de Dados Principal

```
WhatsApp → WAHA → Gateway (webhook) → Core API → AI Service → Core API → Gateway → WAHA → WhatsApp
```

### Componentes Envolvidos

1. **WAHA Container**: Recebe mensagens do WhatsApp e envia webhooks
2. **Gateway Service**: Processa webhooks e gerencia envio de mensagens
3. **Core API**: Orquestra o fluxo entre Gateway e AI Service
4. **AI Service**: Gera respostas usando conhecimento hardcoded

### Configuração de Webhook

O WAHA será configurado para enviar webhooks para:
- URL: `http://gateway:8081/webhook`
- Eventos: `['message']`

## Components and Interfaces

### 1. Gateway Service (packages/gateway)

**Modificações Necessárias:**
- Melhorar o handler de webhook existente (`/webhook`)
- Garantir que mensagens sejam enviadas para Core API
- Implementar retry logic básico

**Interface de Webhook:**
```javascript
POST /webhook
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "message_id",
    "from": "5511999999999@c.us",
    "fromMe": false,
    "body": "Olá, preciso de ajuda",
    "timestamp": 1234567890
  }
}
```

### 2. Core API (packages/core-api)

**Modificações Necessárias:**
- Melhorar o handler de webhook existente em `webhooks.clj`
- Implementar lógica para evitar loops (ignorar mensagens do próprio bot)
- Adicionar tratamento de erro robusto

**Interface com AI Service:**
```json
POST /generate
{
  "assistant_id": "default",
  "query": "mensagem do usuário",
  "history": []
}
```

**Interface com Gateway:**
```json
POST /send-message
{
  "to": "5511999999999",
  "body": "resposta da IA",
  "channel_id": "default",
  "provider": "waha"
}
```

### 3. AI Service (packages/ai-service)

**Modificações Necessárias:**
- Garantir que o endpoint `/generate` funcione corretamente
- Usar conhecimento hardcoded da DeepSaude
- Implementar fallback para erros

**Resposta Esperada:**
```json
{
  "response": "Olá! Sou da Deep Saúde, clínica de psicologia online..."
}
```

### 4. WAHA Provider (packages/gateway/providers)

**Modificações Necessárias:**
- Melhorar o método `handleWebhookMessage`
- Garantir formatação correta de números de telefone
- Implementar detecção de mensagens próprias

## Data Models

### Mensagem Recebida (Webhook)
```typescript
interface IncomingMessage {
  event: string;
  session: string;
  payload: {
    id: string;
    from: string;        // "5511999999999@c.us"
    fromMe: boolean;     // false para mensagens recebidas
    body: string;        // texto da mensagem
    timestamp: number;
  }
}
```

### Mensagem para AI Service
```typescript
interface AIRequest {
  assistant_id: string;  // "default"
  query: string;         // texto da mensagem do usuário
  history: ChatMessage[]; // histórico vazio por enquanto
}
```

### Resposta da IA
```typescript
interface AIResponse {
  response: string;      // resposta gerada pela IA
}
```

## Error Handling

### 1. Webhook Inválido
- **Cenário**: Webhook com estrutura incorreta
- **Ação**: Log do erro e retorna 400
- **Fallback**: Ignora mensagem

### 2. AI Service Indisponível
- **Cenário**: AI Service não responde ou retorna erro
- **Ação**: Log do erro e envia mensagem padrão
- **Fallback**: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."

### 3. WAHA API Falha
- **Cenário**: Não consegue enviar mensagem via WAHA
- **Ação**: Log do erro e tenta novamente uma vez
- **Fallback**: Se falhar novamente, apenas registra o erro

### 4. Mensagem Própria (Loop Prevention)
- **Cenário**: Mensagem enviada pelo próprio bot
- **Ação**: Ignora completamente a mensagem
- **Identificação**: `fromMe: true` no payload

### 5. Timeout de Resposta
- **Cenário**: AI Service demora mais que 10 segundos
- **Ação**: Cancela requisição e envia mensagem de erro
- **Timeout**: 10 segundos para AI Service

## Testing Strategy

### 1. Testes de Integração
- **Webhook End-to-End**: Simular webhook do WAHA e verificar resposta
- **AI Service Integration**: Testar comunicação Gateway → Core API → AI Service
- **WAHA Send Message**: Testar envio de mensagem via WAHA API

### 2. Testes de Unidade
- **Webhook Handler**: Testar parsing e validação de webhooks
- **Message Formatting**: Testar formatação de números de telefone
- **Error Handling**: Testar todos os cenários de erro

### 3. Testes Manuais
- **WhatsApp Real**: Enviar mensagem real e verificar resposta
- **QR Code Flow**: Testar processo completo de conexão
- **Multiple Messages**: Testar múltiplas mensagens simultâneas

### 4. Configuração de Teste
```bash
# Testar webhook diretamente
curl -X POST http://localhost:8081/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "session": "default", 
    "payload": {
      "from": "5511999999999@c.us",
      "fromMe": false,
      "body": "Olá, preciso de ajuda"
    }
  }'
```

## Implementation Notes

### Configuração de Ambiente
- WAHA deve estar rodando em `http://waha:3000`
- Gateway em `http://gateway:8081`
- Core API em `http://core-api:8080`
- AI Service em `http://ai-service:4000`

### Webhook Configuration
O WAHA será configurado automaticamente pelo WahaProvider para enviar webhooks para o Gateway.

### Knowledge Base
Usar o conhecimento hardcoded existente em `deepSaudeKnowledge.ts` sem modificações.

### Session Management
Por simplicidade, usar sempre a sessão "default" do WAHA.

### Phone Number Format
Garantir que números sejam formatados corretamente para o padrão brasileiro (+55).

## Potential Issues and Solutions

### Issue 1: WAHA Webhook não chega no Gateway
**Suspeita**: Problema de rede entre containers
**Solução**: Verificar docker-compose network configuration
**Debug**: Logs do WAHA e Gateway

### Issue 2: AI Service não responde
**Suspeita**: Problema com API key do Google ou serviço down
**Solução**: Verificar logs do AI Service e variáveis de ambiente
**Debug**: Testar endpoint `/health` do AI Service

### Issue 3: Loop de mensagens
**Suspeita**: Bot respondendo às próprias mensagens
**Solução**: Verificar campo `fromMe` no webhook
**Debug**: Logs detalhados de todas as mensagens recebidas

### Issue 4: Formatação de número incorreta
**Suspeita**: WAHA enviando números em formato diferente
**Solução**: Implementar parser robusto de números
**Debug**: Log de todos os números recebidos e enviados
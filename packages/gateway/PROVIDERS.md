# WhatsApp Providers

Este gateway suporta múltiplos providers para conectar ao WhatsApp, permitindo escolher a melhor opção para cada caso de uso.

## Providers Disponíveis

### 1. Baileys (Padrão)
- **Tipo**: `baileys`
- **Descrição**: Biblioteca oficial do WhatsApp Web
- **Vantagens**:
  - Mais estável e confiável
  - Suporte completo às funcionalidades do WhatsApp
  - Não requer serviços externos
- **Desvantagens**:
  - Consome mais recursos (CPU/RAM)
  - Mais complexo para escalar
  - Requer gerenciamento de sessões

### 2. WAHA (HTTP API)
- **Tipo**: `waha`
- **Descrição**: API HTTP para WhatsApp baseada em containers
- **Vantagens**:
  - Mais leve e eficiente
  - Fácil de escalar horizontalmente
  - Interface HTTP simples
  - Suporte a webhooks
- **Desvantagens**:
  - Requer serviço WAHA rodando
  - Pode ser menos estável que Baileys
  - Dependente de serviço externo

## Configuração

### Baileys
Não requer configuração adicional. As sessões são armazenadas localmente em `.baileys_auth/`.

### WAHA
Requer um serviço WAHA rodando. Configure as variáveis de ambiente:

```bash
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_api_key
WAHA_WEBHOOK_URL=http://localhost:8081/webhook
```

## Uso da API

### Listar Providers Disponíveis
```bash
GET /providers
```

### Inicializar Sessão
```bash
POST /init-session
{
  "channel_id": "canal1",
  "provider": "baileys", // ou "waha"
  "config": {
    // configurações específicas do provider
  }
}
```

### Enviar Mensagem
```bash
POST /send-message
{
  "channel_id": "canal1",
  "provider": "baileys", // ou "waha"
  "to": "5511999999999",
  "body": "Olá!"
}
```

### Verificar Status
```bash
GET /status/:channel_id/:provider
```

### Limpar Sessão
```bash
DELETE /cleanup/:channel_id/:provider
```

### Ver Providers Ativos
```bash
GET /active-providers
```

## Webhook (WAHA)

Para receber mensagens via WAHA, configure o webhook:

```bash
POST /webhook/:channel_id/waha
```

O WAHA enviará mensagens recebidas para este endpoint automaticamente.

## Migração

Para migrar de Baileys para WAHA ou vice-versa:

1. Pare o provider atual: `DELETE /cleanup/:channel_id/:provider_atual`
2. Inicie o novo provider: `POST /init-session` com o novo provider
3. Escaneie o QR code novamente se necessário

## Monitoramento

Use `GET /active-providers` para monitorar todos os providers ativos e seus status.
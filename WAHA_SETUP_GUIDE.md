# Guia de Configuração WAHA

Este guia te ajudará a configurar o WAHA (WhatsApp HTTP API) como uma alternativa ao Baileys para maior estabilidade e escalabilidade.

## O que é WAHA?

WAHA é uma API HTTP para WhatsApp que roda em containers Docker, oferecendo:

- Interface HTTP simples
- Melhor escalabilidade
- Menor consumo de recursos
- Suporte a webhooks
- Múltiplas sessões simultâneas

## Instalação

### Opção 1: Docker (Recomendado)

1. **Instalar Docker** (se não tiver):

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install docker.io docker-compose

# macOS (com Homebrew)
brew install docker docker-compose

# Windows: Baixar Docker Desktop
```

2. **Executar WAHA**:

```bash
# Versão básica (gratuita)
docker run -it --rm -p 3000:3000/tcp devlikeapro/waha

# Versão Plus (paga, mais recursos)
docker run -it --rm -p 3000:3000/tcp -e WAHA_LICENSE_KEY=your_license_key devlikeapro/waha-plus
```

### Opção 2: Docker Compose (Para produção)

Crie um arquivo `docker-compose.waha.yml`:

```yaml
version: "3.8"
services:
  waha:
    image: devlikeapro/waha
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - WAHA_WEBHOOK_URL=http://localhost:8081/webhook
      - WAHA_WEBHOOK_EVENTS=message
    volumes:
      - waha_sessions:/app/sessions
    networks:
      - whatsapp_network

volumes:
  waha_sessions:

networks:
  whatsapp_network:
    driver: bridge
```

Execute:

```bash
docker-compose -f docker-compose.waha.yml up -d
```

## Configuração no Gateway

1. **Copie o arquivo de exemplo**:

```bash
cp packages/gateway/.env.example packages/gateway/.env
```

2. **Configure as variáveis**:

```bash
# packages/gateway/.env
WAHA_URL=http://localhost:3000
WAHA_WEBHOOK_URL=http://localhost:8081/webhook
DEFAULT_PROVIDER=waha
```

3. **Reinicie o gateway**:

```bash
cd packages/gateway
npm start
```

## Testando a Configuração

### 1. Verificar se WAHA está rodando

```bash
curl http://localhost:3000/api/health
```

### 2. Listar providers disponíveis

```bash
curl http://localhost:8081/providers
```

### 3. Inicializar sessão com WAHA

```bash
curl -X POST http://localhost:8081/init-session \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "teste_waha",
    "provider": "waha"
  }'
```

### 4. Verificar status

```bash
curl http://localhost:8081/status/teste_waha/waha
```

## Configuração Avançada

### Webhooks

Para receber mensagens automaticamente, configure o webhook no WAHA:

```bash
curl -X POST http://localhost:3000/api/sessions/teste_waha/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8081/webhook/teste_waha/waha",
    "events": ["message"]
  }'
```

### Múltiplas Sessões

WAHA suporta múltiplas sessões simultâneas:

```bash
# Sessão 1
curl -X POST http://localhost:8081/init-session \
  -d '{"channel_id": "canal1", "provider": "waha"}'

# Sessão 2
curl -X POST http://localhost:8081/init-session \
  -d '{"channel_id": "canal2", "provider": "waha"}'
```

## Monitoramento

### Ver sessões ativas no WAHA

```bash
curl http://localhost:3000/api/sessions
```

### Ver providers ativos no Gateway

```bash
curl http://localhost:8081/active-providers
```

## Troubleshooting

### WAHA não inicia

- Verifique se a porta 3000 está livre
- Verifique os logs: `docker logs <container_id>`

### Webhook não funciona

- Verifique se o Gateway está acessível do container WAHA
- Use `host.docker.internal` no lugar de `localhost` se necessário

### QR Code não aparece

- Verifique se a sessão foi criada corretamente
- Aguarde alguns segundos após inicializar

### Mensagens não chegam

- Verifique se o webhook está configurado
- Verifique os logs do Gateway e WAHA

## Migração do Baileys para WAHA

1. **Pare as sessões Baileys**:

```bash
curl -X DELETE http://localhost:8081/cleanup/seu_canal/baileys
```

2. **Inicie com WAHA**:

```bash
curl -X POST http://localhost:8081/init-session \
  -d '{"channel_id": "seu_canal", "provider": "waha"}'
```

3. **Escaneie o QR code novamente**

## Recursos Adicionais

- [Documentação oficial WAHA](https://waha.devlike.pro/)
- [GitHub WAHA](https://github.com/devlikeapro/waha)
- [Discord da comunidade](https://discord.gg/waha)

## Licenciamento

- **WAHA Core**: Gratuito, funcionalidades básicas
- **WAHA Plus**: Pago, funcionalidades avançadas (grupos, mídia, etc.)

Para produção, considere a versão Plus para ter suporte completo.

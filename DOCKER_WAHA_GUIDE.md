# Guia Docker - ZapFlow com WAHA

Este guia mostra como usar o ZapFlow com WAHA integrado via Docker, oferecendo uma solução completa e escalável.

## 🚀 Quick Start

### 1. Iniciar todos os serviços
```bash
# Iniciar ZapFlow completo com WAHA
./docker-waha.sh start

# Verificar status
./docker-waha.sh status

# Testar integração
./docker-waha.sh test
```

### 2. Acessar os serviços
- **Frontend**: http://localhost:9002
- **Gateway**: http://localhost:8081
- **WAHA**: http://localhost:3000
- **Core API**: http://localhost:8082
- **AI Service**: http://localhost:8083

## 📋 Comandos Disponíveis

```bash
# Gerenciamento básico
./docker-waha.sh start     # Iniciar todos os serviços
./docker-waha.sh stop      # Parar todos os serviços
./docker-waha.sh restart   # Reiniciar todos os serviços
./docker-waha.sh status    # Ver status detalhado

# Monitoramento
./docker-waha.sh logs              # Logs de todos os serviços
./docker-waha.sh logs gateway      # Logs apenas do gateway
./docker-waha.sh logs waha         # Logs apenas do WAHA

# Testes e limpeza
./docker-waha.sh test      # Testar integração
./docker-waha.sh cleanup   # Limpar recursos Docker
```

## 🏗️ Arquitetura Docker

```yaml
# Serviços incluídos no docker-compose.yml
services:
  - db          # PostgreSQL (porta 5432)
  - waha        # WAHA API (porta 3000)
  - gateway     # Gateway WhatsApp (porta 8081)
  - core-api    # API Principal (porta 8082)
  - ai-service  # Serviço IA (porta 8083)
  - frontend    # Interface Web (porta 9002)
```

### Rede Interna
Os serviços se comunicam via rede Docker interna:
- `gateway` → `waha:3000`
- `gateway` → `core-api:8080`
- `core-api` → `ai-service:8080`
- `waha` → `gateway:8080/webhook`

## 🔧 Configuração

### Variáveis de Ambiente
O WAHA já está pré-configurado no docker-compose.yml:

```yaml
waha:
  environment:
    - WAHA_WEBHOOK_URL=http://gateway:8080/webhook
    - WAHA_WEBHOOK_EVENTS=message
```

### Volumes Persistentes
- `postgres_data`: Dados do PostgreSQL
- `waha_sessions`: Sessões do WhatsApp (WAHA)

## 📱 Usando os Providers

### 1. Listar providers disponíveis
```bash
curl http://localhost:8081/providers
```

### 2. Inicializar com Baileys (padrão)
```bash
curl -X POST http://localhost:8081/init-session \
  -H "Content-Type: application/json" \
  -d '{"channel_id": "canal1"}'
```

### 3. Inicializar com WAHA
```bash
curl -X POST http://localhost:8081/init-session \
  -H "Content-Type: application/json" \
  -d '{"channel_id": "canal1", "provider": "waha"}'
```

### 4. Verificar status
```bash
# Baileys
curl http://localhost:8081/status/canal1/baileys

# WAHA
curl http://localhost:8081/status/canal1/waha
```

### 5. Enviar mensagem
```bash
curl -X POST http://localhost:8081/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "canal1",
    "provider": "waha",
    "to": "5511999999999",
    "body": "Olá do Docker!"
  }'
```

## 🧪 Testes Automatizados

### Teste completo da integração
```bash
# Testar todos os providers
node test-providers.js

# Testar apenas WAHA
node test-providers.js waha

# Testar apenas Baileys
node test-providers.js baileys
```

### Teste manual via curl
```bash
# 1. Verificar se WAHA está funcionando
curl http://localhost:3000/api/health

# 2. Verificar providers no Gateway
curl http://localhost:8081/providers

# 3. Ver sessões ativas no WAHA
curl http://localhost:3000/api/sessions

# 4. Ver providers ativos no Gateway
curl http://localhost:8081/active-providers
```

## 📊 Monitoramento

### Logs em tempo real
```bash
# Todos os serviços
./docker-waha.sh logs

# Apenas WAHA
./docker-waha.sh logs waha

# Apenas Gateway
./docker-waha.sh logs gateway
```

### Status dos containers
```bash
# Status detalhado
./docker-waha.sh status

# Status simples
docker-compose ps

# Uso de recursos
docker stats
```

### Health Checks
O WAHA tem health check automático:
```bash
# Verificar health do WAHA
docker-compose ps waha
```

## 🔧 Troubleshooting

### WAHA não inicia
```bash
# Ver logs do WAHA
./docker-waha.sh logs waha

# Verificar se a porta 3000 está livre
lsof -i :3000

# Reiniciar apenas o WAHA
docker-compose restart waha
```

### Gateway não conecta ao WAHA
```bash
# Verificar rede Docker
docker network ls
docker network inspect zapflow_default

# Testar conectividade interna
docker-compose exec gateway curl http://waha:3000/api/health
```

### Webhook não funciona
```bash
# Verificar se o webhook está configurado
curl http://localhost:3000/api/sessions/sua_sessao/webhooks

# Testar webhook manualmente
curl -X POST http://localhost:8081/webhook/canal1/waha \
  -H "Content-Type: application/json" \
  -d '{"from": "test", "body": "test message"}'
```

### Problemas de performance
```bash
# Ver uso de recursos
docker stats

# Limpar recursos não utilizados
./docker-waha.sh cleanup

# Reiniciar com rebuild
docker-compose down
docker-compose up -d --build
```

## 🚀 Produção

### Configurações recomendadas para produção

1. **Usar variáveis de ambiente externas**:
```bash
# Criar arquivo .env na raiz do projeto
echo "GEMINI_API_KEY=sua_chave_aqui" > .env
```

2. **Configurar recursos**:
```yaml
# No docker-compose.yml, adicionar limites
waha:
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
```

3. **Backup das sessões**:
```bash
# Backup do volume das sessões WAHA
docker run --rm -v zapflow_waha_sessions:/data -v $(pwd):/backup alpine tar czf /backup/waha_sessions_backup.tar.gz -C /data .
```

4. **Monitoramento**:
```bash
# Adicionar ao crontab para monitoramento
*/5 * * * * /path/to/docker-waha.sh status > /var/log/zapflow-status.log
```

## 🔄 Migração

### De desenvolvimento local para Docker
1. Parar serviços locais
2. Executar `./docker-waha.sh start`
3. Migrar dados se necessário

### Entre providers
```bash
# Parar provider atual
curl -X DELETE http://localhost:8081/cleanup/canal1/baileys

# Iniciar novo provider
curl -X POST http://localhost:8081/init-session \
  -d '{"channel_id": "canal1", "provider": "waha"}'
```

## 📈 Escalabilidade

### Múltiplas instâncias WAHA
Para escalar, você pode adicionar mais instâncias WAHA:

```yaml
# docker-compose.yml
waha-1:
  image: devlikeapro/waha
  ports: ["3001:3000"]
  
waha-2:
  image: devlikeapro/waha
  ports: ["3002:3000"]
```

### Load Balancer
Use nginx ou traefik para distribuir carga entre instâncias.

## 🎯 Próximos Passos

1. **Testar a configuração**: `./docker-waha.sh test`
2. **Configurar frontend** para mostrar opções de provider
3. **Implementar monitoramento** em produção
4. **Configurar backup** das sessões
5. **Otimizar recursos** conforme necessário

## 📚 Recursos Adicionais

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [WAHA Documentation](https://waha.devlike.pro/)
- [ZapFlow Architecture](ARCHITECTURE.md)

---

**Dica**: Use `./docker-waha.sh help` para ver todos os comandos disponíveis!
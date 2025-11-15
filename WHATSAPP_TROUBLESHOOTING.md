# 🔧 Solução de Problemas WhatsApp - Desconexão Imediata

## 📋 Problema Identificado

O WhatsApp está conectando mas desconectando imediatamente com os seguintes sintomas:
- QR code é gerado e escaneado com sucesso
- Cliente autentica e fica "ready"
- Desconecta imediatamente com "LOGOUT"
- Múltiplos QR codes são gerados continuamente
- Mensagens não são recebidas

## 🔍 Causa Raiz

O problema está relacionado a:
1. **Versão do whatsapp-web.js**: Incompatibilidade com versões recentes do WhatsApp Web
2. **Configuração do Puppeteer**: Argumentos muito agressivos causando instabilidade
3. **Múltiplas sessões**: WhatsApp detecta conflitos de sessão
4. **Cache de versão**: Problemas com cache remoto de versão

## 🛠️ Solução Implementada

### 1. **Configuração Simplificada**
```javascript
// Configuração mínima e estável
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: channel_id,
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath: undefined,
    timeout: 60000
  }
});
```

### 2. **Sessão Única**
- Apenas uma sessão WhatsApp ativa por vez
- Limpeza automática de sessões conflitantes
- Prevenção de inicializações simultâneas

### 3. **Tratamento de Erros Robusto**
- Captura de erros do Puppeteer
- Limpeza automática em caso de LOGOUT
- Timeout configurável para QR code

## 🚀 Passos para Testar

### 1. **Limpar Completamente**
```bash
# Parar todos os serviços
./stop-local-dev.sh

# Limpar sessões antigas
./clean-whatsapp-sessions.sh

# Limpar logs para análise limpa
rm -f logs/*.log
```

### 2. **Iniciar Serviços**
```bash
# Iniciar todos os serviços
./start-local-dev.sh

# Aguardar 30 segundos para estabilizar
sleep 30
```

### 3. **Testar Conexão WhatsApp**
```bash
# Gerar QR code
curl -X POST -H "Content-Type: application/json" \
  -d '{"channel_id":"whatsapp-channel-1"}' \
  http://localhost:5001/init-session

# Escanear IMEDIATAMENTE com WhatsApp no celular
# Aguardar confirmação "is ready!" nos logs
```

### 4. **Monitorar Logs**
```bash
# Em terminal separado, monitorar logs
tail -f logs/gateway.log

# Procurar por:
# ✅ "WhatsApp client whatsapp-channel-1 is ready!"
# ❌ "WhatsApp client whatsapp-channel-1 disconnected: LOGOUT"
```

### 5. **Testar Mensagem**
```bash
# Enviar mensagem para o número conectado
# Verificar se aparece nos logs:
# "Received message from 5511999999999@c.us: sua mensagem"
# "AI response sent to 5511999999999@c.us: resposta da IA"
```

## 🔧 Comandos de Diagnóstico

### **Verificar Status**
```bash
curl http://localhost:5001/status/whatsapp-channel-1
```

### **Limpar Sessão Específica**
```bash
curl -X DELETE http://localhost:5001/cleanup/whatsapp-channel-1
```

### **Verificar Processos**
```bash
ps aux | grep -E "(gateway|whatsapp)"
```

### **Verificar Portas**
```bash
lsof -i :5001  # Gateway
lsof -i :8080  # Core API
lsof -i :4000  # AI Service
```

## 📊 Logs Esperados (Sucesso)

```
Gateway Service - WhatsApp Integration Mode
Gateway service listening on port 5001
Initializing WhatsApp client for channel: whatsapp-channel-1
QR Code generated for whatsapp-channel-1
Scan this QR code with your WhatsApp:
[QR CODE AQUI]
Loading screen for whatsapp-channel-1: 100% - WhatsApp
WhatsApp client whatsapp-channel-1 authenticated
WhatsApp client whatsapp-channel-1 is ready!
Received message from 5511999999999@c.us: Olá
AI response sent to 5511999999999@c.us: Olá! Como posso ajudar você hoje?
```

## ⚠️ Sinais de Problema

### **Desconexão Imediata**
```
WhatsApp client whatsapp-channel-1 is ready!
WhatsApp client whatsapp-channel-1 disconnected: LOGOUT
```
**Solução**: Limpar sessões e tentar novamente

### **QR Codes Múltiplos**
```
QR Code generated for whatsapp-channel-1
QR Code generated for whatsapp-channel-1
QR Code generated for whatsapp-channel-1
```
**Solução**: Reiniciar gateway e escanear rapidamente

### **Erro Puppeteer**
```
Error: Execution context was destroyed, most likely because of a navigation.
```
**Solução**: Reiniciar serviços completamente

## 🔄 Procedimento de Recuperação

Se a conexão falhar:

1. **Parar serviços**
   ```bash
   ./stop-local-dev.sh
   ```

2. **Limpar tudo**
   ```bash
   ./clean-whatsapp-sessions.sh
   rm -f logs/*.log
   ```

3. **Aguardar 30 segundos**
   ```bash
   sleep 30
   ```

4. **Reiniciar**
   ```bash
   ./start-local-dev.sh
   ```

5. **Tentar conexão novamente**

## 💡 Dicas Importantes

1. **Escaneie Rapidamente**: QR code expira em ~20 segundos
2. **Uma Tentativa por Vez**: Não tente múltiplas conexões simultâneas
3. **WhatsApp Ativo**: Mantenha WhatsApp aberto no celular
4. **Conexão Estável**: Use WiFi estável durante conexão
5. **Aguarde "Ready"**: Só envie mensagens após ver "is ready!" nos logs

## 🎯 Próximos Passos

Após conexão estável:
1. Teste envio de mensagens
2. Verifique respostas da IA
3. Monitore logs por 5-10 minutos
4. Teste reconexão após reinicialização

---

**Se o problema persistir, pode ser necessário:**
- Atualizar versão do whatsapp-web.js
- Usar biblioteca alternativa (Baileys, etc.)
- Implementar WhatsApp Business API oficial
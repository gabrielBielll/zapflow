#!/bin/bash

echo "🔍 Monitorando conexão WhatsApp..."
echo "📱 QR Code gerado! Escaneie com seu WhatsApp agora!"
echo ""
echo "📊 Logs em tempo real:"
echo "----------------------------------------"

# Monitorar logs do gateway em tempo real
tail -f logs/gateway.log | while read line; do
    echo "$(date '+%H:%M:%S') | $line"
    
    # Detectar eventos importantes
    if [[ $line == *"is ready!"* ]]; then
        echo "🎉 ✅ CONECTADO COM SUCESSO!"
        echo "💬 Agora você pode enviar mensagens para o WhatsApp"
    elif [[ $line == *"Connection closed"* ]]; then
        echo "⚠️  ❌ CONEXÃO PERDIDA"
    elif [[ $line == *"logged out"* ]]; then
        echo "🚪 ❌ DESLOGADO - Precisa reconectar"
    elif [[ $line == *"Received message"* ]]; then
        echo "📨 ✅ MENSAGEM RECEBIDA"
    elif [[ $line == *"AI response sent"* ]]; then
        echo "🤖 ✅ RESPOSTA IA ENVIADA"
    fi
done
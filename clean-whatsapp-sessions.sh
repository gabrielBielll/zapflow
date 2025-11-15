#!/bin/bash

echo "🧹 Limpando sessões do WhatsApp..."

# Parar o gateway service se estiver rodando
if pgrep -f "gateway" > /dev/null; then
    echo "🛑 Parando Gateway Service..."
    pkill -f "gateway"
    sleep 2
fi

# Limpar diretórios de autenticação e cache
echo "🗑️  Removendo arquivos de sessão..."
rm -rf packages/gateway/.wwebjs_auth/*
rm -rf packages/gateway/.wwebjs_cache/*

echo "✅ Sessões do WhatsApp limpas!"
echo ""
echo "💡 Para reconectar:"
echo "   1. Reinicie os serviços: ./start-local-dev.sh"
echo "   2. Acesse http://localhost:3000"
echo "   3. Vá para WhatsApp > Conectar WhatsApp"
echo "   4. Escaneie o novo QR code"
#!/bin/bash

# 🚀 ZapFlow - Script de Desenvolvimento Local
# Este script inicia todos os serviços localmente apontando para produção

echo "🚀 Iniciando ZapFlow em modo desenvolvimento local..."
echo "📊 Usando banco de dados de produção (CockroachDB)"
echo "🤖 Usando Gemini API de produção"
echo ""

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Porta $1 já está em uso!"
        return 1
    else
        return 0
    fi
}

# Verificar portas necessárias
echo "🔍 Verificando portas disponíveis..."
check_port 3000 || exit 1
check_port 4000 || exit 1  
check_port 8080 || exit 1

echo "✅ Todas as portas estão disponíveis!"
echo ""

# Função para iniciar serviços em background
start_service() {
    local service_name=$1
    local service_path=$2
    local service_command=$3
    local service_port=$4
    
    echo "🔄 Iniciando $service_name na porta $service_port..."
    cd "$service_path"
    
    # Criar arquivo de log
    mkdir -p ../../logs
    local log_file="../../logs/$service_name.log"
    
    # Iniciar serviço em background
    nohup $service_command > "$log_file" 2>&1 &
    local pid=$!
    
    # Salvar PID para poder parar depois
    echo $pid > "../../logs/$service_name.pid"
    
    echo "✅ $service_name iniciado (PID: $pid)"
    echo "📋 Logs: $log_file"
    
    cd - > /dev/null
}

# Criar diretório de logs
mkdir -p logs

echo "🚀 Iniciando serviços..."
echo ""

# 1. Iniciar Core API (Backend Clojure)
echo "1️⃣ Core API (Backend Clojure)"
start_service "core-api" "packages/core-api" "lein run" "8080"
echo ""

# 2. Iniciar AI Service (Node.js)
echo "2️⃣ AI Service (Serviço de IA)"
start_service "ai-service" "packages/ai-service" "npm run dev" "4000"
echo ""

# 3. Iniciar Frontend (Next.js)
echo "3️⃣ Frontend (Next.js)"
start_service "frontend" "packages/frontend" "npm run dev" "3000"
echo ""

echo "🎉 Todos os serviços foram iniciados!"
echo ""
echo "📱 Acesse a aplicação:"
echo "   Frontend: http://localhost:3000"
echo "   Core API: http://localhost:8080"
echo "   AI Service: http://localhost:4000"
echo ""
echo "📊 Monitoramento:"
echo "   Logs Core API: tail -f logs/core-api.log"
echo "   Logs AI Service: tail -f logs/ai-service.log"  
echo "   Logs Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 Para parar todos os serviços:"
echo "   ./stop-local-dev.sh"
echo ""
echo "⏳ Aguardando serviços iniciarem (30 segundos)..."

# Aguardar serviços iniciarem
sleep 30

echo ""
echo "🔍 Verificando status dos serviços..."

# Verificar se os serviços estão rodando
check_service() {
    local service_name=$1
    local service_url=$2
    
    if curl -s "$service_url" > /dev/null 2>&1; then
        echo "✅ $service_name: OK"
    else
        echo "❌ $service_name: Falha na conexão"
    fi
}

check_service "Frontend" "http://localhost:3000"
check_service "Core API" "http://localhost:8080/api/v1/frontend/assistants"
check_service "AI Service" "http://localhost:4000/health"

echo ""
echo "🎯 Desenvolvimento local configurado com sucesso!"
echo "💡 Dica: Use 'tail -f logs/*.log' para monitorar todos os logs"
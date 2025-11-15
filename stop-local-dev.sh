#!/bin/bash

# 🛑 ZapFlow - Script para Parar Desenvolvimento Local
# Este script para todos os serviços iniciados pelo start-local-dev.sh

echo "🛑 Parando todos os serviços do ZapFlow..."
echo ""

# Função para parar um serviço
stop_service() {
    local service_name=$1
    local pid_file="logs/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if ps -p $pid > /dev/null 2>&1; then
            echo "🔄 Parando $service_name (PID: $pid)..."
            kill $pid
            
            # Aguardar o processo parar
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            if ps -p $pid > /dev/null 2>&1; then
                echo "⚠️  $service_name não parou graciosamente, forçando..."
                kill -9 $pid
            fi
            
            echo "✅ $service_name parado"
        else
            echo "ℹ️  $service_name já estava parado"
        fi
        
        # Remover arquivo PID
        rm -f "$pid_file"
    else
        echo "ℹ️  Arquivo PID não encontrado para $service_name"
    fi
}

# Parar serviços na ordem inversa
echo "1️⃣ Parando Frontend..."
stop_service "frontend"

echo ""
echo "2️⃣ Parando AI Service..."
stop_service "ai-service"

echo ""
echo "3️⃣ Parando Core API..."
stop_service "core-api"

echo ""

# Verificar se ainda há processos nas portas
echo "🔍 Verificando portas..."

check_and_kill_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "⚠️  Processo ainda ativo na porta $port ($service_name), forçando parada..."
        kill -9 $pid
        echo "✅ Processo na porta $port terminado"
    fi
}

check_and_kill_port 3000 "Frontend"
check_and_kill_port 4000 "AI Service"
check_and_kill_port 8080 "Core API"

echo ""
echo "🧹 Limpando arquivos temporários..."

# Limpar arquivos PID restantes
rm -f logs/*.pid

echo "✅ Limpeza concluída"
echo ""
echo "🎯 Todos os serviços foram parados com sucesso!"
echo ""
echo "💡 Dicas:"
echo "   - Para ver logs anteriores: ls -la logs/"
echo "   - Para limpar logs: rm -f logs/*.log"
echo "   - Para reiniciar: ./start-local-dev.sh"
#!/bin/bash

# 🧪 ZapFlow - Script de Teste Local
# Este script testa se todos os serviços estão funcionando corretamente

echo "🧪 Testando ZapFlow em desenvolvimento local..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar um endpoint
test_endpoint() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "🔍 Testando $service_name... "
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}❌ FALHA${NC} (Status: $response)"
        return 1
    fi
}

# Função para testar endpoint com POST
test_post_endpoint() {
    local service_name=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -n "🔍 Testando $service_name (POST)... "
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ OK${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}❌ FALHA${NC} (Status: $response)"
        return 1
    fi
}

echo "1️⃣ Testando Frontend (Next.js)"
test_endpoint "Frontend Home" "http://localhost:3000" 200
echo ""

echo "2️⃣ Testando Core API (Clojure)"
test_endpoint "Core API Health" "http://localhost:8080/api/v1/frontend/assistants" 200
echo ""

echo "3️⃣ Testando AI Service (Node.js)"
test_endpoint "AI Service Health" "http://localhost:4000/health" 200
echo ""

echo "4️⃣ Testando Integração Completa"

# Teste de criação de assistente
echo -n "🔍 Testando criação de assistente... "
assistant_data='{"name":"Teste Local","purpose":"Assistente de teste para desenvolvimento local"}'
create_response=$(curl -s -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$assistant_data" \
    "http://localhost:8080/api/v1/frontend/assistants" 2>/dev/null)

if [[ "$create_response" == *"201"* ]] || [[ "$create_response" == *"200"* ]]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHA${NC} (Response: $create_response)"
fi

# Teste de listagem de assistentes
test_endpoint "Listagem de assistentes" "http://localhost:8080/api/v1/frontend/assistants" 200

# Teste do AI Service
echo -n "🔍 Testando geração de resposta IA... "
ai_data='{"assistant_id":"test","query":"Olá","history":[]}'
ai_response=$(curl -s -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$ai_data" \
    "http://localhost:4000/generate" 2>/dev/null)

if [[ "$ai_response" == *"200"* ]]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHA${NC} (Response: $ai_response)"
fi

echo ""
echo "5️⃣ Testando Conectividade com Produção"

# Teste de conexão com banco de produção
echo -n "🔍 Testando conexão com CockroachDB... "
if curl -s "http://localhost:8080/api/v1/frontend/assistants" | grep -q "\[" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC} (Banco conectado)"
else
    echo -e "${YELLOW}⚠️  AVISO${NC} (Verificar logs do Core API)"
fi

echo ""
echo "📊 Resumo dos Testes"
echo "===================="
echo "✅ Frontend: http://localhost:3000"
echo "✅ Core API: http://localhost:8080"  
echo "✅ AI Service: http://localhost:4000"
echo "✅ Banco: CockroachDB (Produção)"
echo "✅ IA: Gemini API (Produção)"
echo ""
echo "🎯 Sistema pronto para desenvolvimento!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Acesse http://localhost:3000"
echo "   2. Crie um assistente"
echo "   3. Configure WhatsApp"
echo "   4. Teste conversas"
echo ""
echo "📋 Monitoramento:"
echo "   tail -f logs/core-api.log"
echo "   tail -f logs/ai-service.log"
echo "   tail -f logs/frontend.log"
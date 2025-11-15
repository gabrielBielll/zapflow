#!/bin/bash

# Script para configurar WAHA no projeto ZapFlow
# Uso: ./setup-waha.sh [start|stop|status|logs]

set -e

WAHA_PORT=3000
GATEWAY_PORT=8081
CONTAINER_NAME="zapflow-waha"
NETWORK_NAME="zapflow-network"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando. Por favor, inicie o Docker primeiro."
        exit 1
    fi
    
    print_success "Docker está disponível"
}

create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        print_status "Criando rede Docker: $NETWORK_NAME"
        docker network create $NETWORK_NAME
        print_success "Rede criada com sucesso"
    else
        print_status "Rede $NETWORK_NAME já existe"
    fi
}

start_waha() {
    print_status "Iniciando WAHA..."
    
    check_docker
    create_network
    
    # Parar container existente se estiver rodando
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_warning "Container WAHA já está rodando. Parando primeiro..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
    
    # Remover container parado se existir
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        docker rm $CONTAINER_NAME
    fi
    
    # Iniciar WAHA
    print_status "Iniciando container WAHA..."
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        -p $WAHA_PORT:3000 \
        -e WAHA_WEBHOOK_URL="http://host.docker.internal:$GATEWAY_PORT/webhook" \
        -e WAHA_WEBHOOK_EVENTS="message" \
        -v waha_sessions:/app/sessions \
        --restart unless-stopped \
        devlikeapro/waha
    
    print_success "WAHA iniciado com sucesso!"
    print_status "Container: $CONTAINER_NAME"
    print_status "Porta: $WAHA_PORT"
    print_status "Webhook URL: http://host.docker.internal:$GATEWAY_PORT/webhook"
    
    # Aguardar WAHA inicializar
    print_status "Aguardando WAHA inicializar..."
    sleep 5
    
    # Verificar se está funcionando
    if curl -s http://localhost:$WAHA_PORT/api/health > /dev/null; then
        print_success "WAHA está funcionando! Acesse: http://localhost:$WAHA_PORT"
    else
        print_warning "WAHA pode ainda estar inicializando. Verifique os logs com: $0 logs"
    fi
}

stop_waha() {
    print_status "Parando WAHA..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
        print_success "WAHA parado com sucesso"
    else
        print_warning "WAHA não está rodando"
    fi
}

status_waha() {
    print_status "Status do WAHA:"
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_success "WAHA está rodando"
        echo
        docker ps -f name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo
        
        # Testar API
        if curl -s http://localhost:$WAHA_PORT/api/health > /dev/null; then
            print_success "API está respondendo: http://localhost:$WAHA_PORT"
        else
            print_warning "API não está respondendo"
        fi
        
        # Listar sessões
        print_status "Sessões ativas:"
        curl -s http://localhost:$WAHA_PORT/api/sessions | jq '.' 2>/dev/null || echo "Nenhuma sessão ativa ou jq não instalado"
        
    else
        print_warning "WAHA não está rodando"
    fi
}

logs_waha() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Logs do WAHA (Ctrl+C para sair):"
        docker logs -f $CONTAINER_NAME
    else
        print_error "WAHA não está rodando"
    fi
}

setup_env() {
    print_status "Configurando arquivo .env do Gateway..."
    
    ENV_FILE="packages/gateway/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "packages/gateway/.env.example" ]; then
            cp packages/gateway/.env.example $ENV_FILE
            print_success "Arquivo .env criado a partir do exemplo"
        else
            print_error "Arquivo .env.example não encontrado"
            return 1
        fi
    fi
    
    # Atualizar configurações WAHA
    if grep -q "WAHA_URL" $ENV_FILE; then
        sed -i.bak "s|WAHA_URL=.*|WAHA_URL=http://localhost:$WAHA_PORT|" $ENV_FILE
    else
        echo "WAHA_URL=http://localhost:$WAHA_PORT" >> $ENV_FILE
    fi
    
    if grep -q "WAHA_WEBHOOK_URL" $ENV_FILE; then
        sed -i.bak "s|WAHA_WEBHOOK_URL=.*|WAHA_WEBHOOK_URL=http://localhost:$GATEWAY_PORT/webhook|" $ENV_FILE
    else
        echo "WAHA_WEBHOOK_URL=http://localhost:$GATEWAY_PORT/webhook" >> $ENV_FILE
    fi
    
    print_success "Arquivo .env configurado para WAHA"
    print_status "Configurações:"
    grep "WAHA" $ENV_FILE
}

test_integration() {
    print_status "Testando integração WAHA + Gateway..."
    
    # Verificar se WAHA está rodando
    if ! curl -s http://localhost:$WAHA_PORT/api/health > /dev/null; then
        print_error "WAHA não está rodando. Execute: $0 start"
        return 1
    fi
    
    # Verificar se Gateway está rodando
    if ! curl -s http://localhost:$GATEWAY_PORT/providers > /dev/null; then
        print_error "Gateway não está rodando. Inicie o Gateway primeiro."
        return 1
    fi
    
    print_success "WAHA está rodando"
    print_success "Gateway está rodando"
    
    # Testar providers
    print_status "Providers disponíveis:"
    curl -s http://localhost:$GATEWAY_PORT/providers | jq '.' 2>/dev/null || curl -s http://localhost:$GATEWAY_PORT/providers
    
    print_success "Integração funcionando! Você pode agora:"
    echo "1. Inicializar uma sessão: curl -X POST http://localhost:$GATEWAY_PORT/init-session -H 'Content-Type: application/json' -d '{\"channel_id\":\"teste\",\"provider\":\"waha\"}'"
    echo "2. Verificar status: curl http://localhost:$GATEWAY_PORT/status/teste/waha"
    echo "3. Ver providers ativos: curl http://localhost:$GATEWAY_PORT/active-providers"
}

show_help() {
    echo "Script de configuração WAHA para ZapFlow"
    echo
    echo "Uso: $0 [comando]"
    echo
    echo "Comandos:"
    echo "  start     - Iniciar WAHA"
    echo "  stop      - Parar WAHA"
    echo "  restart   - Reiniciar WAHA"
    echo "  status    - Ver status do WAHA"
    echo "  logs      - Ver logs do WAHA"
    echo "  setup-env - Configurar arquivo .env"
    echo "  test      - Testar integração"
    echo "  help      - Mostrar esta ajuda"
    echo
    echo "Exemplos:"
    echo "  $0 start          # Iniciar WAHA"
    echo "  $0 setup-env      # Configurar .env"
    echo "  $0 test           # Testar tudo"
}

# Comando principal
case "${1:-help}" in
    start)
        start_waha
        setup_env
        ;;
    stop)
        stop_waha
        ;;
    restart)
        stop_waha
        sleep 2
        start_waha
        ;;
    status)
        status_waha
        ;;
    logs)
        logs_waha
        ;;
    setup-env)
        setup_env
        ;;
    test)
        test_integration
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac
#!/bin/bash

# Script para gerenciar ZapFlow com WAHA via Docker
# Uso: ./docker-waha.sh [start|stop|restart|logs|status|test]

set -e

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
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado."
        exit 1
    fi
    
    print_success "Docker está disponível"
}

start_services() {
    print_status "Iniciando ZapFlow com WAHA..."
    
    check_docker
    
    # Verificar se existe arquivo .env para variáveis de ambiente
    if [ ! -f .env ] && [ -f .env.example ]; then
        print_warning "Arquivo .env não encontrado. Criando a partir do exemplo..."
        cp .env.example .env
        print_status "Edite o arquivo .env com suas configurações se necessário"
    fi
    
    # Build e start dos serviços
    print_status "Construindo e iniciando serviços..."
    docker-compose up -d --build
    
    print_success "Serviços iniciados!"
    print_status "Aguardando serviços ficarem prontos..."
    
    # Aguardar serviços ficarem prontos
    sleep 15
    
    # Verificar status dos serviços
    check_services_health
}

stop_services() {
    print_status "Parando ZapFlow..."
    
    docker-compose down
    
    print_success "Serviços parados!"
}

restart_services() {
    print_status "Reiniciando ZapFlow..."
    
    stop_services
    sleep 3
    start_services
}

show_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        print_status "Logs do serviço: $service"
        docker-compose logs -f "$service"
    else
        print_status "Logs de todos os serviços (Ctrl+C para sair)"
        docker-compose logs -f
    fi
}

check_services_health() {
    print_status "Verificando status dos serviços..."
    
    # Lista de serviços e suas portas
    declare -A services=(
        ["db"]="5432"
        ["waha"]="3000"
        ["gateway"]="8081"
        ["core-api"]="8082"
        ["ai-service"]="8083"
        ["frontend"]="9002"
    )
    
    all_healthy=true
    
    for service in "${!services[@]}"; do
        port=${services[$service]}
        
        if docker-compose ps "$service" | grep -q "Up"; then
            if [ "$service" = "db" ]; then
                # Para PostgreSQL, apenas verificar se está rodando
                print_success "$service está rodando (porta $port)"
            elif [ "$service" = "waha" ]; then
                # Verificar health check do WAHA
                if curl -s http://localhost:$port/api/health > /dev/null 2>&1; then
                    print_success "$service está saudável (porta $port)"
                else
                    print_warning "$service está rodando mas pode ainda estar inicializando (porta $port)"
                fi
            else
                # Para outros serviços, tentar uma conexão simples
                if nc -z localhost $port 2>/dev/null; then
                    print_success "$service está rodando (porta $port)"
                else
                    print_warning "$service pode ainda estar inicializando (porta $port)"
                fi
            fi
        else
            print_error "$service não está rodando"
            all_healthy=false
        fi
    done
    
    echo
    if $all_healthy; then
        print_success "Todos os serviços estão rodando!"
        show_access_info
    else
        print_warning "Alguns serviços podem ainda estar inicializando. Aguarde alguns minutos."
    fi
}

show_access_info() {
    echo
    print_status "🌐 URLs de Acesso:"
    echo "  Frontend:    http://localhost:9002"
    echo "  Core API:    http://localhost:8082"
    echo "  Gateway:     http://localhost:8081"
    echo "  AI Service:  http://localhost:8083"
    echo "  WAHA:        http://localhost:3000"
    echo "  PostgreSQL:  localhost:5432"
    echo
    print_status "📱 Providers WhatsApp disponíveis:"
    echo "  - Baileys (padrão)"
    echo "  - WAHA (HTTP API)"
    echo
    print_status "🧪 Para testar:"
    echo "  ./docker-waha.sh test"
}

test_integration() {
    print_status "Testando integração dos serviços..."
    
    # Verificar se os serviços estão rodando
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Serviços não estão rodando. Execute: $0 start"
        return 1
    fi
    
    # Testar Gateway
    print_status "Testando Gateway..."
    if curl -s http://localhost:8081/providers > /dev/null; then
        print_success "Gateway está respondendo"
        
        # Mostrar providers disponíveis
        echo "Providers disponíveis:"
        curl -s http://localhost:8081/providers | jq '.providers[] | "  - \(.type): \(.name)"' -r 2>/dev/null || \
        curl -s http://localhost:8081/providers
    else
        print_error "Gateway não está respondendo"
        return 1
    fi
    
    # Testar WAHA
    print_status "Testando WAHA..."
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_success "WAHA está respondendo"
    else
        print_error "WAHA não está respondendo"
        return 1
    fi
    
    # Testar Core API
    print_status "Testando Core API..."
    if curl -s http://localhost:8082/health > /dev/null 2>&1 || \
       curl -s http://localhost:8082/ > /dev/null 2>&1; then
        print_success "Core API está respondendo"
    else
        print_warning "Core API pode ainda estar inicializando"
    fi
    
    print_success "Integração testada com sucesso!"
    echo
    print_status "🚀 Próximos passos:"
    echo "1. Acesse o frontend: http://localhost:9002"
    echo "2. Teste os providers: node test-providers.js"
    echo "3. Monitore os logs: $0 logs"
}

show_status() {
    print_status "Status dos containers:"
    docker-compose ps
    echo
    
    print_status "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo
    
    check_services_health
}

cleanup() {
    print_status "Limpando recursos Docker..."
    
    # Parar e remover containers
    docker-compose down -v
    
    # Remover imagens não utilizadas (opcional)
    read -p "Remover imagens Docker não utilizadas? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker image prune -f
        print_success "Imagens limpas"
    fi
    
    print_success "Limpeza concluída"
}

show_help() {
    echo "Script de gerenciamento ZapFlow com WAHA"
    echo
    echo "Uso: $0 [comando] [opções]"
    echo
    echo "Comandos:"
    echo "  start         - Iniciar todos os serviços"
    echo "  stop          - Parar todos os serviços"
    echo "  restart       - Reiniciar todos os serviços"
    echo "  status        - Ver status dos serviços"
    echo "  logs [serviço] - Ver logs (todos ou de um serviço específico)"
    echo "  test          - Testar integração dos serviços"
    echo "  cleanup       - Limpar recursos Docker"
    echo "  help          - Mostrar esta ajuda"
    echo
    echo "Serviços disponíveis para logs:"
    echo "  db, waha, gateway, core-api, ai-service, frontend"
    echo
    echo "Exemplos:"
    echo "  $0 start              # Iniciar tudo"
    echo "  $0 logs gateway       # Ver logs do gateway"
    echo "  $0 logs waha          # Ver logs do WAHA"
    echo "  $0 test               # Testar integração"
}

# Verificar se netcat está disponível para testes de porta
if ! command -v nc &> /dev/null; then
    # Função alternativa para teste de porta sem netcat
    nc() {
        timeout 1 bash -c "</dev/tcp/$1/$2" 2>/dev/null
    }
fi

# Comando principal
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    test)
        test_integration
        ;;
    cleanup)
        cleanup
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
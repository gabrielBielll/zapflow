# ZapFlow

Bem-vindo ao ZapFlow!

O ZapFlow é uma plataforma de código aberto para a criação de assistentes virtuais inteligentes para WhatsApp, projetada para automação de vendas e atendimento ao cliente.

## 🚀 Quick Start

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js](https://nodejs.org/) 18+ (para testes locais)
- Chave da API do Google Gemini (opcional para testes completos)

### 1. Configurar Variáveis de Ambiente

```bash
# Opcional: Para testar funcionalidade completa da IA
export GEMINI_API_KEY=sua_chave_aqui
```

### 2. Executar Localmente

```bash
# Instalar dependências para testes
npm install

# Iniciar todos os serviços
npm run dev

# OU executar teste completo (inicia, testa e para os serviços)
npm run test:local
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:9002
- **Core API**: http://localhost:8082
- **Gateway**: http://localhost:8081
- **AI Service**: http://localhost:8083

### 4. Testar o Fluxo Completo

1. Acesse http://localhost:9002
2. Crie um novo assistente
3. Vá para a seção "WhatsApp" no dashboard
4. Clique em "Conectar WhatsApp" e escaneie o QR code
5. Envie uma mensagem para o número conectado para testar

## 📚 Documentação

### Arquitetura e Deploy

- **[Arquitetura](./ARCHITECTURE.md)** - Visão completa dos microsserviços
- **[Deploy Local](./DEPLOYMENT.md)** - Guia detalhado para desenvolvimento
- **[Deploy Render](./RENDER_DEPLOYMENT.md)** - Instruções para produção

### Estrutura do Projeto

```
packages/
├── frontend/     # Interface Next.js para gerenciar assistentes
├── gateway/      # Serviço Node.js para conexão WhatsApp
├── core-api/     # API principal em Clojure
└── ai-service/   # Serviço de IA com Genkit e Gemini
```

## 🧪 Testes

```bash
# Testar integração (serviços devem estar rodando)
npm run test:integration

# Teste completo local (inicia, testa e para serviços)
npm run test:local
```

## 🚀 Deploy para Produção

### Render (Recomendado)

1. Faça fork/clone do repositório
2. Conecte no [Render](https://render.com)
3. Siga as instruções em [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### Docker Compose (Servidor próprio)

```bash
# Produção com docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Inicia todos os serviços
npm run dev:detached # Inicia em background
npm run stop         # Para todos os serviços
npm run test:local   # Teste completo local
```

### Estrutura de Desenvolvimento

- **Frontend**: React/Next.js com TypeScript
- **Gateway**: Node.js com whatsapp-web.js
- **Core API**: Clojure com Ring/Reitit
- **AI Service**: Node.js com Google Genkit
- **Banco**: PostgreSQL

## 📋 Status do Projeto

✅ **Funcionalidades Implementadas:**
- ✅ Criação e gerenciamento de assistentes
- ✅ Conexão WhatsApp via QR code com interface visual
- ✅ Processamento de mensagens com IA (Gemini + RAG)
- ✅ Interface web completa com dashboard
- ✅ Deploy automatizado no Render
- ✅ Fluxo completo de ponta a ponta funcional
- ✅ Testes de integração automatizados
- ✅ Tratamento de erros e logging

🔄 **Próximas Funcionalidades:**
- Chatbots baseados em fluxos
- Triagem automatizada
- Métricas e analytics
- Upload de documentos para RAG
- Configuração de personalidade dos assistentes

📚 **Documentação Adicional:**
- [Checkpoint de Desenvolvimento](./docs/CHECKPOINT.md) - Estado atual e histórico
- [Bloqueios Conhecidos](./docs/frontend_verification_blocker.md) - Problemas identificados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: Veja os arquivos `.md` na raiz do projeto
- **Issues**: Abra uma issue no GitHub
- **Discussões**: Use as GitHub Discussions para perguntas

---

**Desenvolvido com ❤️ para automatizar atendimento no WhatsApp**

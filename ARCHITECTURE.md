# Arquitetura do Projeto: ZapFlow

## Visão Geral

O ZapFlow é uma plataforma para criação de assistentes virtuais inteligentes para WhatsApp, focada em automação de vendas e atendimento ao cliente. A arquitetura é baseada em um modelo de microsserviços, projetada para ser escalável, flexível e de fácil manutenção.

Este documento detalha a estrutura de cada serviço, suas responsabilidades e como eles interagem. Para informações sobre como executar o projeto, consulte o [Guia de Implantação (DEPLOYMENT.md)](./DEPLOYMENT.md).

## Diagrama da Arquitetura

```
┌─────────────────┐      ┌──────────┐      ┌─────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│  Usuário Final  │◄───►│ WhatsApp │◄───►│  2. Gateway WhatsApp  │◄───►│  3. Core API (Clojure)  │◄───►│  4. AI Service (Genkit)  │
└─────────────────┘      └──────────┘      └─────────────────────┘      └─────────────────────────┘      └────────────────────────┘
                                                                                     ▲
                                                                                     │
                                                                                     ▼
┌───────────────────┐      ┌───────────────────────────────┐                       │
│  Dono do Negócio  │◄───►│  1. Frontend (React/Next.js)  ├───────────────────────┘
└───────────────────┘      └───────────────────────────────┘
```

---

## Componentes

### 1. Frontend (`frontend`)

-   **Tecnologia:** Next.js (React) com TypeScript.
-   **Porta Local:** `9002`
-   **Responsabilidades:**
    -   **Painel de Gerenciamento:** Interface web para que o dono do negócio possa:
        -   **Conectar:** Exibir o QR Code gerado pelo `gateway` para conectar a conta do WhatsApp.
        -   **Configurar a IA:** Fazer o upload de documentos (PDFs, TXTs) para treinar a base de conhecimento (RAG).
        -   **Customizar:** Definir a personalidade e o tom de voz do assistente.
        -   **Monitorar:** Visualizar histórico de conversas e métricas de desempenho.
    -   **BFF (Backend for Frontend):** Camada de servidor do Next.js que atua como um intermediário, simplificando as chamadas do cliente para os serviços de backend (`core-api`).

### 2. WhatsApp Gateway (`gateway`)

-   **Tecnologia:** Node.js com a biblioteca `whatsapp-web.js`.
-   **Porta Local:** `8081`
-   **Responsabilidades:**
    -   **Conexão com WhatsApp:** Manter uma conexão persistente com o WhatsApp, agindo como um "celular virtual".
    -   **Autenticação:** Gerar o QR Code para que o usuário possa autenticar sua conta.
    -   **Receptor de Mensagens:** Receber mensagens dos clientes e encaminhá-las para a `core-api` via webhook.
    -   **Remetente de Mensagens:** Enviar as respostas geradas pela IA de volta para os clientes no WhatsApp.

### 3. Core API (`core-api`)

-   **Tecnologia:** Clojure.
-   **Porta Local:** `8082`
-   **Responsabilidades:**
    -   **Orquestrador Central:** Atuar como o cérebro da aplicação, coordenando o fluxo de dados entre o `frontend`, `gateway` e `ai-service`.
    -   **Lógica de Negócio:** Gerenciar as configurações dos assistentes, usuários e integrações.
    -   **Ponte de Comunicação:** Servir como o ponto central para todas as comunicações de serviço.
    -   **Persistência de Dados:** Salvar o histórico de conversas e as configurações dos assistentes em um banco de dados (CockroachDB/PostgreSQL).

### 4. AI Service (`ai-service`)

-   **Tecnologia:** Node.js com Google AI Genkit.
-   **Porta Local:** `8083`
-   **Responsabilidades:**
    -   **RAG (Retrieval-Augmented Generation):**
        -   Indexar e armazenar a base de conhecimento a partir dos documentos enviados pelo `frontend`.
        -   Buscar informações relevantes nos documentos para responder às perguntas dos clientes.
    -   **Geração de Linguagem Natural:** Utilizar Modelos de Linguagem Grandes (LLMs) como o Gemini para gerar respostas inteligentes, coerentes e personalizadas com base no contexto do RAG.

---

## Comunicação entre Serviços

A comunicação é feita principalmente por meio de APIs REST e Webhooks.

-   **Frontend → Core API:**
    -   `GET /api/assistants/:id/settings`: Obtém as configurações de um assistente.
    -   `POST /api/assistants/:id/settings`: Atualiza a personalidade e o tom de voz.
    -   `POST /api/rag/upload`: Envia um documento para ser indexado pelo `ai-service`.
    -   `GET /api/assistants/:id/conversations`: Obtém o histórico de conversas.

-   **Gateway → Core API:**
    -   `POST /webhook/whatsapp/message`: Envia uma nova mensagem recebida de um cliente.
    -   `POST /webhook/whatsapp/status`: Notifica sobre o status da conexão (ex: `ready`, `disconnected`).

-   **Core API → Gateway:**
    -   `POST /send-message`: Solicita o envio de uma mensagem de resposta a um cliente.
    -   `GET /status`: Verifica o estado da conexão do WhatsApp.

-   **Core API → AI Service:**
    -   `POST /generate-response`: Envia o texto de uma mensagem para que a IA gere uma resposta.
    -   `POST /index-document`: Envia o conteúdo de um documento para ser processado e indexado pelo RAG.

## Configuração e Variáveis de Ambiente

As seguintes variáveis de ambiente são usadas no `docker-compose.yml` para o ambiente de desenvolvimento:

-   **`frontend`:**
    -   `NODE_ENV=development`
-   **`gateway`:**
    -   `NODE_ENV=development`
    -   `CORE_API_URL`: (Necessário, a ser adicionado) URL da `core-api` (ex: `http://core-api:8080`).
-   **`core-api`:**
    -   `APP_ENV=development`
    -   `DATABASE_URL`: (Necessário, a ser adicionado) String de conexão para o banco de dados.
    -   `AI_SERVICE_URL`: (Necessário, a ser adicionado) URL do `ai-service` (ex: `http://ai-service:8080`).
-   **`ai-service`:**
    -   `NODE_ENV=development`
    -   `GEMINI_API_KEY`: (Necessário, a ser adicionado) Chave da API para o modelo Gemini do Google.

---

## Fluxo de Dados (Exemplo de Conversa)

1.  **Cliente** envia uma mensagem no WhatsApp.
2.  **Gateway** a recebe e a encaminha para o endpoint `POST /webhook/whatsapp/message` da **Core API**.
3.  **Core API** recebe a mensagem, identifica o assistente correspondente e envia a pergunta para o endpoint `POST /generate-response` do **AI Service**.
4.  **AI Service** usa o RAG para buscar informações na base de conhecimento, gera uma resposta com o LLM e a devolve para a **Core API**.
5.  **Core API** recebe a resposta e a envia para o endpoint `POST /send-message` do **Gateway**.
6.  **Gateway** envia a mensagem de resposta para o **Cliente** no WhatsApp.

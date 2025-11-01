# Arquitetura do Projeto: ZapFlow

## Visão Geral

O ZapFlow é uma plataforma para criação de assistentes virtuais inteligentes para WhatsApp, com foco em automação de vendas e atendimento ao cliente. A arquitetura é baseada em um modelo de microsserviços, projetada para ser escalável, flexível e de fácil manutenção. Inicialmente, todos os serviços coexistirão em um único monorepo para facilitar o desenvolvimento, com a implantação final sendo feita em serviços separados na plataforma Render.

## Diagrama da Arquitetura

```
[ Usuário Final ] <--> [ WhatsApp ] <--> [ 2. Gateway WhatsApp ] <--> [ 3. Core API (Clojure) ] <--> [ 4. AI Service (Genkit) ]
                                                                             ^
                                                                             |
                                                                             v
[ Dono do Negócio ] <--> [ 1. Frontend (React/Next.js) ] --------------------'
```

---

## Componentes

### 1. Frontend (UI Panel & BFF)

- **Tecnologia:** Next.js (React) com TypeScript.
- **Responsabilidades:**
    - **UI Panel:** Interface de gerenciamento para o dono do negócio.
        - **Conexão:** Exibir o QR Code gerado pelo Gateway para conectar a conta do WhatsApp.
        - **Configuração da IA:** Permitir o upload de documentos (PDFs, TXTs) para treinar a base de conhecimento (RAG).
        - **Customização:** Definir a personalidade e o tom de voz do assistente.
        - **Dashboard:** Visualizar histórico de conversas e métricas de desempenho.
    - **BFF (Backend for Frontend):** Camada de servidor do Next.js que simplifica a comunicação entre o painel e os serviços de backend.

### 2. WhatsApp Gateway

- **Tecnologia:** Node.js com a biblioteca `whatsapp-web.js`.
- **Responsabilidades:**
    - Manter uma conexão persistente com o WhatsApp, agindo como um "celular virtual".
    - Gerar o QR Code para autenticação.
    - Receber mensagens de clientes e encaminhá-las para a Core API via webhook.
    - Enviar as respostas geradas pela IA de volta para os clientes no WhatsApp.

### 3. Core API

- **Tecnologia:** Clojure.
- **Responsabilidades:**
    - **Cérebro da Aplicação:** Orquestrar o fluxo de dados entre todos os outros serviços.
    - **Lógica de Negócio:** Gerenciar as configurações dos chatbots, usuários e integrações.
    - **Ponte de Comunicação:** Receber as mensagens do Gateway, enviá-las para o Serviço de IA para processamento e encaminhar a resposta de volta ao Gateway.
    - **Persistência de Dados:** Salvar o histórico de conversas e as configurações em um banco de dados.

### 4. AI Service

- **Tecnologia:** Google AI Genkit.
- **Responsabilidades:**
    - **RAG (Retrieval-Augmented Generation):**
        - Indexar e armazenar a base de conhecimento a partir dos documentos enviados.
        - Buscar informações relevantes para responder às perguntas dos clientes.
    - **Geração de Linguagem Natural:** Utilizar modelos de linguagem (ex: Gemini) para gerar respostas inteligentes, coerentes e personalizadas.

---

## Funcionalidades Avançadas Planejadas

### Observer AI

Um serviço de IA secundário que opera em segundo plano, analisando as conversas para gerar insights de negócio.

- **Análise de Churn:** Identificar clientes em risco com base no tom, tempo de resposta e conteúdo da conversa.
- **KPIs e Métricas:** Extrair indicadores de desempenho, como taxa de conversão, tempo médio de atendimento e satisfação do cliente.
- **Sugestão de Follow-ups:** Indicar à IA principal quando um cliente precisa de um acompanhamento, com base no histórico da conversa.

### Agent Cloning

Uma funcionalidade que permite treinar a IA para replicar o estilo de comunicação de uma pessoa específica, como um vendedor de alta performance.

- **Treinamento:** A plataforma receberá exemplos de conversas bem-sucedidas.
- **Análise de Estilo:** A IA analisará o tom, vocabulário, ritmo e estratégias de comunicação usadas nos exemplos.
- **Emulação:** O chatbot passará a responder aos clientes mimetizando o estilo do "agente clonado", aumentando a eficácia e a personalização do atendimento.

---

## Fluxo de Dados (Exemplo de Conversa)

1.  **Cliente** envia uma mensagem no WhatsApp.
2.  **Gateway** a recebe e a encaminha para o endpoint `/webhook/whatsapp` da **Core API**.
3.  **Core API** recebe a mensagem, identifica o chatbot correspondente e envia a pergunta para o **AI Service**.
4.  **AI Service** busca na base de conhecimento (RAG), gera uma resposta com o modelo de linguagem e a devolve para a **Core API**.
5.  **Core API** envia a resposta para o **Gateway**.
6.  **Gateway** envia a mensagem de resposta para o **Cliente** no WhatsApp.

## Implantação (Deployment)

- **Plataforma:** Render.
- **Estratégia:** Cada componente (Frontend, Gateway, Core API) será implantado como um serviço independente no Render, garantindo o isolamento e a escalabilidade de cada parte da aplicação.

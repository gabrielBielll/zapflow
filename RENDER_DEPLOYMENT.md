# Deploy no Render - Guia Completo

Este guia explica como fazer o deploy do ZapFlow na plataforma Render usando o plano gratuito.

## Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório do projeto no GitHub/GitLab
3. Chave da API do Google Gemini

## Opção 1: Deploy Automático com render.yaml

### 1. Conectar Repositório

1. Faça login no Render
2. Clique em "New +" → "Blueprint"
3. Conecte seu repositório GitHub/GitLab
4. O Render detectará automaticamente o arquivo `render.yaml`

### 2. Configurar Variáveis de Ambiente

Durante o processo de deploy, você precisará configurar manualmente:

- **GEMINI_API_KEY**: Sua chave da API do Google Gemini

### 3. Aguardar Deploy

O Render criará automaticamente:
- Banco de dados PostgreSQL
- 4 serviços web (core-api, ai-service, gateway, frontend)
- Todas as conexões entre serviços

## Opção 2: Deploy Manual (Serviço por Serviço)

### 1. Criar Banco de Dados PostgreSQL

1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `zapflow-db`
   - **Database:** `zapflow`
   - **User:** `zapflow`
   - **Plan:** Free
3. Anote a **Internal Connection String** após a criação

### 2. Deploy do Core API

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório
3. Configure:
   - **Name:** `zapflow-core-api`
   - **Environment:** Docker
   - **Dockerfile Path:** `./packages/core-api/Dockerfile`
   - **Docker Context:** `./packages/core-api`

#### Variáveis de Ambiente:

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cole a **Internal Connection String** do seu banco de dados PostgreSQL. | Conecta ao banco de dados que você criou. |
| `AI_SERVICE_URL` | `http://ai-service:10000` | URL interna para o serviço de IA. |
| `GATEWAY_URL` | `http://gateway:10000` | URL interna para o serviço de gateway. |

----

### 3. Deploy do AI Service

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório
3. Configure:
   - **Name:** `zapflow-ai-service`
   - **Environment:** Docker
   - **Dockerfile Path:** `./packages/ai-service/Dockerfile`
   - **Docker Context:** `./packages/ai-service`

#### Variáveis de Ambiente:

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `sua-chave-de-api-do-google` | Chave da API do Google para o modelo Gemini. |
| `NODE_ENV` | `production` | Ambiente de produção. |
| `PORT` | `10000` | Porta que o Render usará para expor o serviço. |

----

### 4. Deploy do Gateway

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório
3. Configure:
   - **Name:** `zapflow-gateway`
   - **Environment:** Docker
   - **Dockerfile Path:** `./packages/gateway/Dockerfile`
   - **Docker Context:** `./packages/gateway`

#### Variáveis de Ambiente:

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `CORE_API_URL` | `http://core-api:10000` | URL interna para o `core-api`. |
| `NODE_ENV` | `production` | Ambiente de produção. |
| `PORT` | `10000` | Porta que o Render usará para expor o serviço. |

----

### 5. Deploy do Frontend

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório
3. Configure:
   - **Name:** `zapflow-frontend`
   - **Environment:** Docker
   - **Dockerfile Path:** `./packages/frontend/Dockerfile`
   - **Docker Context:** `./packages/frontend`

#### Variáveis de Ambiente:

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CORE_API_URL` | A URL pública do seu serviço `core-api` no Render (ex: `https://core-api-123.onrender.com`). | Permite que o navegador do cliente se comunique com sua API. |
| `NODE_ENV` | `production` | Ambiente de produção. |

----

## Testando o Deploy

1. Acesse a URL do frontend fornecida pelo Render
2. Crie um novo assistente
3. Vá para a seção WhatsApp
4. Conecte seu WhatsApp escaneando o QR code
5. Envie uma mensagem para testar a resposta automática

## Troubleshooting

### Serviços não conseguem se comunicar
- Verifique se as URLs internas estão corretas
- Certifique-se de que todos os serviços estão rodando

### Erro de conexão com banco de dados
- Verifique se a `DATABASE_URL` está correta
- Aguarde alguns minutos para o banco inicializar

### AI Service não responde
- Verifique se a `GEMINI_API_KEY` está configurada
- Verifique os logs do serviço para erros

### WhatsApp não conecta
- Verifique se o Gateway está rodando
- Verifique se as URLs de webhook estão corretas

## Limitações do Plano Gratuito

- Serviços podem "dormir" após 15 minutos de inatividade
- 750 horas de uso por mês (suficiente para testes)
- Banco de dados PostgreSQL com 1GB de armazenamento
- Conexões limitadas ao banco de dados

Para uso em produção, considere upgradar para um plano pago.
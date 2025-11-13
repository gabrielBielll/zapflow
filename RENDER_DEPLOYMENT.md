# Guia de Implantação no Render

Este guia detalha como implantar a aplicação ZapFlow na plataforma Render. A arquitetura é composta por quatro serviços principais que devem ser configurados separadamente.

## Estrutura dos Serviços

Você precisará criar os seguintes serviços na sua conta Render:

1.  **`frontend`**: Um **Static Site** para a aplicação Next.js.
2.  **`gateway`**: Um **Web Service** para o gateway do WhatsApp.
3.  **`core-api`**: Um **Web Service** para a API principal em Clojure.
4.  **`ai-service`**: Um **Web Service** para o serviço de IA com Genkit.
5.  **`database`**: Um **PostgreSQL** para o banco de dados.

---

## 1. Configuração do Banco de Dados (`database`)

1.  Crie um novo serviço do tipo **PostgreSQL** no Render.
2.  Dê um nome a ele, por exemplo, `zapflow-db`.
3.  Após a criação, vá para a página do banco de dados e copie a **Internal Connection String**. Você usará essa string na configuração do `core-api`.

---

## 2. Configuração do `core-api`

-   **Tipo de Serviço**: `Web Service`
-   **Nome do Serviço**: `core-api`
-   **Repositório**: Conecte ao seu repositório do GitHub/GitLab.
-   **Root Directory**: `packages/core-api`
-   **Build Command**: `lein uberjar`
-   **Start Command**: `java -jar target/core-api-0.1.0-SNAPSHOT-standalone.jar`

#### Variáveis de Ambiente (`core-api`)

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cole a **Internal Connection String** do seu banco de dados PostgreSQL. | Conecta ao banco de dados que você criou. |
| `AI_SERVICE_URL` | `http://ai-service:10000` | URL interna para o serviço de IA. |
| `GATEWAY_URL` | `http://gateway:10000` | URL interna para o serviço de gateway. |

---

## 3. Configuração do `ai-service`

-   **Tipo de Serviço**: `Web Service`
-   **Nome do Serviço**: `ai-service`
-   **Repositório**: Conecte ao seu repositório.
-   **Root Directory**: `packages/ai-service`
-   **Build Command**: `npm install`
-   **Start Command**: `npm start`

#### Variáveis de Ambiente (`ai-service`)

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `sua-chave-de-api-do-google` | Chave da API do Google para o modelo Gemini. |
| `PORT` | `10000` | Porta que o Render usará para expor o serviço. |

---

## 4. Configuração do `gateway`

-   **Tipo de Serviço**: `Web Service`
-   **Nome do Serviço**: `gateway`
-   **Repositório**: Conecte ao seu repositório.
-   **Root Directory**: `packages/gateway`
-   **Build Command**: `npm install`
-   **Start Command**: `node index.js`

#### Variáveis de Ambiente (`gateway`)

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `CORE_API_URL` | `http://core-api:10000` | URL interna para o `core-api`. |
| `PORT` | `10000` | Porta que o Render usará para expor o serviço. |

---

## 5. Configuração do `frontend`

-   **Tipo de Serviço**: `Static Site`
-   **Nome do Serviço**: `frontend`
-   **Repositório**: Conecte ao seu repositório.
-   **Root Directory**: `packages/frontend`
-   **Build Command**: `npm install && npm run build`
-   **Publish Directory**: `out`

#### Variáveis de Ambiente (`frontend`)

| Chave | Valor | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CORE_API_URL` | A URL pública do seu serviço `core-api` no Render (ex: `https://core-api-123.onrender.com`). | Permite que o navegador do cliente se comunique com sua API. |

---

## Resumo e Ordem de Implantação

1.  Crie o serviço de banco de dados **PostgreSQL** primeiro para obter a URL de conexão.
2.  Crie os serviços de backend: **`core-api`**, **`ai-service`**, e **`gateway`**. Preencha as variáveis de ambiente usando os nomes dos serviços para comunicação interna.
3.  Crie o serviço **`frontend`** por último. Use a URL pública gerada pelo Render para o `core-api` em suas variáveis de ambiente.

Com essa configuração, os serviços se comunicarão internamente através da rede privada do Render, e o frontend estará acessível publicamente para os usuários.

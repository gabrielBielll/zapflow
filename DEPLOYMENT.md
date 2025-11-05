# Guia de Implantação (Deployment)

Este documento descreve como configurar e executar o projeto localmente usando Docker e como fazer a implantação na plataforma Render.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com o Docker Desktop)

## Desenvolvimento Local com Docker Compose

Para executar todos os serviços da aplicação (`frontend`, `gateway`, `core-api`, `ai-service`) em seu ambiente local, utilize o Docker Compose.

1.  **Construa e inicie os containers:**
    Na raiz do projeto, execute o seguinte comando:

    ```bash
    docker-compose up --build
    ```

    Este comando irá construir a imagem Docker de cada serviço e iniciá-los.

2.  **Acessando os serviços:**
    - **Frontend:** [http://localhost:9002](http://localhost:9002)
    - **Gateway:** `http://localhost:8081`
    - **Core API:** `http://localhost:8082`
    - **AI Service:** `http://localhost:8083`

3.  **Para parar os containers:**
    Pressione `Ctrl + C` no terminal onde o `docker-compose` está rodando, e depois execute:

    ```bash
    docker-compose down
    ```

## Implantação na Render

A Render pode construir e implantar serviços diretamente a partir de um `Dockerfile`.

### Limitações do Plano Gratuito da Render

O plano gratuito da Render permite a criação de **um Web Service gratuito** e um banco de dados PostgreSQL gratuito (compatível com CockroachDB). Como nosso projeto é composto por quatro "Web Services" (`frontend`, `gateway`, `core-api`, `ai-service`), **não é possível implantar a aplicação completa no plano gratuito**.

Você precisará escolher **um serviço** para implantar. Para uma funcionalidade mínima, recomendamos implantar a `core-api` ou o `frontend`. Para ter a aplicação completa funcionando, será necessário fazer o upgrade para um plano pago na Render, que permite a criação de múltiplos "Web Services".

### Passos para Implantar um Serviço na Render

Vamos usar o `frontend` como exemplo:

1.  **Crie uma conta na Render** e faça o login.
2.  **Vá para o Dashboard** e clique em **"New +"** e selecione **"Web Service"**.
3.  **Conecte seu repositório do GitHub/GitLab**.
4.  **Configure o serviço:**
    - **Name:** Dê um nome ao seu serviço (ex: `zapflow-frontend`).
    - **Root Directory:** Deixe em branco se o `Dockerfile` está na raiz, ou aponte para o diretório do serviço se necessário. No nosso caso, como vamos apontar para um Dockerfile específico, isso não é tão relevante.
    - **Environment:** Selecione **`Docker`**.
    - **Dockerfile Path:** Especifique o caminho para o `Dockerfile` do serviço que você quer implantar. Exemplo: `./packages/frontend/Dockerfile`.
    - **Porta:** A Render detecta a porta exposta no `Dockerfile` automaticamente. No caso do `frontend`, é a `9002`.

5.  **Clique em "Create Web Service"**.

A Render irá construir a imagem Docker a partir do seu repositório e fará a implantação. Você pode seguir este mesmo processo para implantar qualquer um dos outros serviços, mas lembre-se que cada um consumirá uma instância de "Web Service".

# Guia de Implantação (Deployment)

Este documento descreve como configurar e executar o projeto localmente usando Docker e como fazer a implantação na plataforma Render. Para um entendimento completo da arquitetura, consulte o [ARCHITECTURE.md](./ARCHITECTURE.md).

## Pré-requisitos

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com o Docker Desktop)

## Desenvolvimento Local com Docker Compose

O `docker-compose.yml` na raiz do projeto está configurado para construir e orquestrar todos os serviços da aplicação (`frontend`, `gateway`, `core-api`, `ai-service`).

### 1. Construindo e Iniciando os Containers

Na raiz do projeto, execute o seguinte comando:

```bash
docker-compose up --build
```

-   `--build`: Esta flag força a reconstrução das imagens Docker a partir dos `Dockerfile` de cada serviço. É útil para garantir que as alterações no código ou nas dependências sejam aplicadas.

Este comando irá iniciar todos os serviços em modo "attached", o que significa que os logs de todos os containers serão exibidos no seu terminal.

### 2. Acessando os Serviços

Após a inicialização, os serviços estarão disponíveis nos seguintes endereços:

-   **Frontend:** [http://localhost:9002](http://localhost:9002)
-   **Gateway:** `http://localhost:8081`
-   **Core API:** `http://localhost:8082`
-   **AI Service:** `http://localhost:8083`

### 3. Visualizando os Logs

Para depurar um serviço específico, é útil visualizar seus logs de forma isolada.

-   **Para ver os logs de todos os serviços (em tempo real):**
    O comando `docker-compose up` já faz isso.

-   **Para ver os logs de um serviço específico:**
    Se os containers já estiverem rodando (por exemplo, em modo "detached" com `docker-compose up -d`), você pode usar o comando `logs`.

    ```bash
    # Exemplo para ver os logs do core-api
    docker-compose logs -f core-api

    # Exemplo para ver os logs do gateway
    docker-compose logs -f gateway
    ```
    -   `-f`: Segue a saída dos logs em tempo real.

### 4. Parando os Containers

Para parar todos os serviços, pressione `Ctrl + C` no terminal onde o `docker-compose` está rodando. Em seguida, para garantir que os containers e as redes sejam removidos, execute:

```bash
docker-compose down
```

## Implantação na Render

A Render pode construir e implantar serviços diretamente a partir de um `Dockerfile`.

### Plano Gratuito da Render

O plano gratuito da Render é uma ótima opção para hospedar projetos como o ZapFlow. Ele permite a criação de múltiplos "Web Services" gratuitos, além de um banco de dados PostgreSQL, o que o torna ideal para uma arquitetura de microsserviços.

É possível implantar todos os serviços (`frontend`, `gateway`, `core-api`, `ai-service`) e o banco de dados no plano gratuito, embora existam algumas limitações de uso que devem ser consultadas na [documentação oficial da Render](https://render.com/docs/free).

### Passos para Implantar um Serviço na Render

O processo para implantar cada serviço é o mesmo. Vamos usar o `frontend` como exemplo:

1.  **Crie uma conta na Render** e faça o login.
2.  **Vá para o Dashboard**, clique em **"New +"** e selecione **"Web Service"**.
3.  **Conecte seu repositório do GitHub/GitLab**.
4.  **Configure o serviço:**
    -   **Name:** Dê um nome ao seu serviço (ex: `zapflow-frontend`).
    -   **Environment:** Selecione **`Docker`**.
    -   **Dockerfile Path:** Especifique o caminho para o `Dockerfile` do serviço que você quer implantar (ex: `./packages/frontend/Dockerfile`).
    -   **Porta:** A Render detecta a porta exposta no `Dockerfile` automaticamente.

5.  **Adicione as Variáveis de Ambiente:**
    -   Na seção "Environment", adicione as variáveis necessárias para cada serviço, conforme documentado no [ARCHITECTURE.md](./ARCHITECTURE.md).

6.  **Clique em "Create Web Service"**.

Repita este processo para cada serviço (`gateway`, `core-api`, `ai-service`) que você deseja implantar. A Render irá construir a imagem Docker e fará a implantação, fornecendo uma URL pública para cada serviço.

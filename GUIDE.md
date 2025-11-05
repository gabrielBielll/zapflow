# Guia de Usuário - ZapFlow

Este guia explica como configurar e utilizar o painel de controle do ZapFlow.

## Sobre o ZapFlow e o Estado Atual do Projeto

O ZapFlow é uma plataforma projetada para criar assistentes virtuais inteligentes para WhatsApp. A arquitetura completa, descrita em `ARCHITECTURE.md`, inclui um Frontend (este painel), um Gateway para conectar-se ao WhatsApp e uma API central (Core API) para orquestrar as operações.

**Importante:** No estado atual, apenas o **Frontend (Painel de Controle)** foi implementado. Os outros serviços (Gateway e Core API) ainda não foram desenvolvidos. Portanto, a aplicação pode ser executada visualmente, mas não terá a funcionalidade completa de se conectar ao WhatsApp ou de processar conversas, pois os componentes de backend ainda não existem.

## Pré-requisitos

Para executar este projeto, você precisará ter o seguinte software instalado em sua máquina:

-   [Node.js](https://nodejs.org/) (versão 20.x ou superior)
-   [npm](https://www.npmjs.com/) (geralmente vem instalado com o Node.js)

## Como Configurar e Executar o Projeto

Siga os passos abaixo para executar o painel de controle em seu ambiente local.

### 1. Instalar as Dependências

Navegue até a raiz do projeto e execute o seguinte comando no seu terminal para instalar todas as dependências necessárias:

```bash
npm install
```

### 2. Executar o Servidor de Desenvolvimento

Após a instalação das dependências, inicie o servidor de desenvolvimento do Next.js com o comando:

```bash
npm run dev
```

A aplicação estará disponível em seu navegador no seguinte endereço: [http://localhost:9002](http://localhost:9002).

## Funcionalidades Atuais

Como apenas o painel de controle está implementado, as seguintes seções estão disponíveis para visualização e interação, embora sem conexão com o backend.

-   **/ (Página Inicial) e /dashboard**: Apresenta a interface principal do painel, onde futuramente serão exibidos os dashboards com métricas e o status da conexão.
-   **/create**: Uma página de exemplo para o fluxo de criação de um novo assistente de IA.

Atualmente, estas seções contêm componentes de interface estáticos ou com dados de exemplo, pois a lógica de backend para gerenciar os assistentes ainda precisa ser criada.

---

## Como Fazer o Deploy no Render

As instruções a seguir descrevem como fazer o deploy **apenas do painel de controle (Frontend)** na plataforma [Render](https://render.com/).

**Aviso:** Conforme mencionado, esta ação publicará apenas a interface visual. As funcionalidades que dependem do backend não irão funcionar.

### Passo a Passo para o Deploy

1.  **Crie uma Conta no Render:** Se você ainda não tiver uma, crie uma conta no site do Render.

2.  **Conecte seu Repositório Git:**
    *   No seu dashboard do Render, clique em **"New +"** e selecione **"Web Service"**.
    *   Conecte sua conta do GitHub, GitLab ou Bitbucket e autorize o Render a acessar seus repositórios.
    *   Selecione o repositório que contém o projeto ZapFlow.

3.  **Configure o Serviço Web:**
    *   **Name:** Dê um nome único para o seu serviço (ex: `zapflow-panel`).
    *   **Region:** Escolha a região mais próxima de você ou de seus usuários.
    *   **Branch:** Selecione a branch que você deseja implantar (geralmente `main` ou `master`).
    *   **Runtime:** Render deve detectar automaticamente que é um projeto Node.js.
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`

4.  **Crie o Serviço:**
    *   Clique em **"Create Web Service"**. O Render irá clonar seu repositório, instalar as dependências e executar o build.
    *   O primeiro deploy pode levar alguns minutos. Você pode acompanhar o progresso nos logs.

5.  **Acesse sua Aplicação:**
    *   Após a conclusão do deploy, o Render fornecerá uma URL pública (ex: `https-zapflow-panel.onrender.com`). Sua aplicação Next.js estará disponível nesse endereço.

É isso! Seu painel de controle do ZapFlow estará no ar. Lembre-se que, para a plataforma se tornar totalmente funcional, os outros serviços da arquitetura precisarão ser desenvolvidos e implantados separadamente.

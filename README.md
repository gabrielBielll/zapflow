# ZapFlow

Bem-vindo ao ZapFlow!

O ZapFlow é uma plataforma de código aberto para a criação de assistentes virtuais inteligentes para WhatsApp, projetada para automação de vendas e atendimento ao cliente.

## Começando

Para entender como o sistema funciona e como colocar o ambiente de desenvolvimento para rodar, siga os documentos abaixo.

### 1. Entendendo a Arquitetura

Para ter uma visão completa dos microsserviços, como eles se comunicam e quais são suas responsabilidades, leia nosso guia de arquitetura.

-   **[Leia o `ARCHITECTURE.md`](./ARCHITECTURE.md)**

### 2. Executando o Projeto Localmente

Nosso ambiente de desenvolvimento é gerenciado com Docker Compose, facilitando a execução de todos os serviços com um único comando.

-   **[Siga o `DEPLOYMENT.md`](./DEPLOYMENT.md)**

---

## Estrutura do Projeto

O projeto é um monorepo que contém os seguintes serviços principais na pasta `packages/`:

-   **`frontend`**: O painel de controle em Next.js para gerenciar os assistentes.
-   **`gateway`**: O serviço Node.js que conecta-se à API do WhatsApp.
-   **`core-api`**: O cérebro do sistema em Clojure, que orquestra a comunicação.
-   **`ai-service`**: O serviço em Node.js com Genkit para processamento de linguagem natural.

Para mais detalhes, a [arquitetura](./ARCHITECTURE.md) está documentada em detalhes.

# Core API

Este serviço é a **Core API**, o cérebro do ZapFlow, construído em Clojure.

## Responsabilidades

-   Orquestrar o fluxo de dados entre todos os outros serviços (`frontend`, `gateway`, `ai-service`).
-   Gerenciar a lógica de negócio, como as configurações dos assistentes e os usuários.
-   Persistir os dados em um banco de dados.

Para mais detalhes sobre a arquitetura e como este serviço se integra com os outros, consulte o [documento de arquitetura principal](../../ARCHITECTURE.md).

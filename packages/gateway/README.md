# Gateway

Este serviço é o **WhatsApp Gateway**, responsável por conectar-se à API do WhatsApp e atuar como a ponte entre o WhatsApp e a `core-api` do ZapFlow.

## Responsabilidades

-   Manter uma conexão persistente com o WhatsApp.
-   Gerar o QR Code para autenticação.
-   Receber mensagens de clientes e encaminhá-las para a `core-api`.
-   Enviar as respostas geradas pela IA de volta para os clientes.

Para mais detalhes sobre a arquitetura e como este serviço se integra com os outros, consulte o [documento de arquitetura principal](../../ARCHITECTURE.md).

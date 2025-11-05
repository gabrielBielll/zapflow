# Checkpoint de Desenvolvimento - ZapFlow

Este documento serve como um ponto de verificação para o estado atual de desenvolvimento do projeto ZapFlow. Ele resume o que já foi concluído, quais são os próximos passos e quaisquer impedimentos conhecidos.

## O Que Está Pronto?

Até o momento, o seguinte componente foi implementado:

-   **Frontend (Painel de Controle):** A interface de usuário, desenvolvida em Next.js, está criada. Ela inclui as páginas principais, como o dashboard e a criação de assistentes. No entanto, a interface ainda não possui integração com o backend, o que significa que as funcionalidades não estão operacionais.

Consulte o [Guia de Usuário (GUIDE.md)](../GUIDE.md) para mais detalhes sobre como executar o frontend.

## Próximos Passos

Para que a plataforma seja funcional, os seguintes serviços de backend precisam ser desenvolvidos:

1.  **Core API (Clojure):**
    -   **Responsabilidade:** Orquestrar a comunicação entre todos os serviços.
    -   **Status:** Esqueleto inicial existente, mas a lógica de negócios e os endpoints precisam ser implementados.

2.  **WhatsApp Gateway (Node.js):**
    -   **Responsabilidade:** Conectar-se à API do WhatsApp para enviar e receber mensagens.
    -   **Status:** Esqueleto inicial existente, mas a integração com a biblioteca `whatsapp-web.js` e a comunicação com a Core API precisam ser desenvolvidas.

3.  **AI Service (Genkit):**
    -   **Responsabilidade:** Processar as mensagens recebidas e gerar respostas inteligentes usando RAG e modelos de linguagem.
    -   **Status:** A ser desenvolvido.

## Bloqueios Conhecidos

-   **Falha na Verificação do Frontend com Playwright:** Atualmente, os testes de verificação visual automatizados para o frontend estão falhando com o erro `net::ERR_CONNECTION_REFUSED`. Isso impede a geração de screenshots e a verificação completa do frontend em um ambiente de sandbox. Mais detalhes podem ser encontrados em [frontend_verification_blocker.md](./frontend_verification_blocker.md).

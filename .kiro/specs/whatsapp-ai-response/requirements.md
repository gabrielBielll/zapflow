# Requirements Document

## Introduction

Esta funcionalidade tem como objetivo implementar um sistema básico onde a IA responde automaticamente às mensagens recebidas no WhatsApp através da integração com WAHA (WhatsApp HTTP API). O foco é estabelecer a conexão básica entre o recebimento de mensagens via webhook e o envio de respostas geradas pela IA, sem necessidade de persistência em banco de dados.

## Requirements

### Requirement 1

**User Story:** Como um usuário que envia mensagem para o WhatsApp conectado, eu quero receber uma resposta automática da IA, para que eu possa interagir com o sistema de forma natural.

#### Acceptance Criteria

1. WHEN uma mensagem é recebida no WhatsApp THEN o sistema SHALL capturar a mensagem via webhook do WAHA
2. WHEN uma mensagem é capturada THEN o sistema SHALL processar o conteúdo da mensagem
3. WHEN o conteúdo é processado THEN o sistema SHALL gerar uma resposta usando a IA
4. WHEN uma resposta é gerada THEN o sistema SHALL enviar a resposta de volta para o remetente via WAHA API
5. IF a mensagem for do próprio bot THEN o sistema SHALL ignorar a mensagem para evitar loops

### Requirement 2

**User Story:** Como desenvolvedor, eu quero que o sistema use conhecimento hardcoded da DeepSaude, para que as respostas sejam relevantes ao contexto médico sem depender de banco de dados.

#### Acceptance Criteria

1. WHEN a IA gera uma resposta THEN o sistema SHALL usar o conhecimento hardcoded existente em deepSaudeKnowledge.ts
2. WHEN não há conhecimento específico disponível THEN o sistema SHALL fornecer uma resposta genérica mas útil
3. WHEN uma resposta é gerada THEN ela SHALL ser contextualizada para o domínio de saúde

### Requirement 3

**User Story:** Como administrador do sistema, eu quero que o webhook do WAHA seja configurado corretamente, para que as mensagens sejam recebidas em tempo real.

#### Acceptance Criteria

1. WHEN o sistema inicia THEN ele SHALL configurar o webhook do WAHA para apontar para o endpoint correto
2. WHEN uma mensagem chega no WhatsApp THEN o WAHA SHALL enviar o webhook para o sistema
3. IF o webhook falhar THEN o sistema SHALL registrar o erro nos logs
4. WHEN o webhook é recebido THEN o sistema SHALL validar a estrutura da mensagem

### Requirement 4

**User Story:** Como desenvolvedor, eu quero que o sistema tenha tratamento básico de erros, para que falhas não quebrem o fluxo de resposta.

#### Acceptance Criteria

1. IF a IA service falhar THEN o sistema SHALL enviar uma mensagem de erro amigável
2. IF o WAHA API falhar THEN o sistema SHALL registrar o erro e tentar novamente uma vez
3. IF o webhook receber dados inválidos THEN o sistema SHALL registrar o erro e ignorar a mensagem
4. WHEN ocorrer qualquer erro THEN o sistema SHALL continuar funcionando para próximas mensagens

### Requirement 5

**User Story:** Como usuário final, eu quero receber respostas rápidas e relevantes, para que a experiência de chat seja fluida.

#### Acceptance Criteria

1. WHEN uma mensagem é recebida THEN a resposta SHALL ser enviada em menos de 10 segundos
2. WHEN a resposta é enviada THEN ela SHALL ser clara e contextualizada
3. IF a mensagem contém uma pergunta médica THEN a resposta SHALL usar o conhecimento da DeepSaude
4. WHEN múltiplas mensagens chegam simultaneamente THEN cada uma SHALL ser processada independentemente
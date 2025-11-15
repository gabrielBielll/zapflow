# Requirements Document

## Introduction

Esta funcionalidade visa implementar uma base de conhecimento estática hardcoded no sistema para permitir que o assistente de IA responda com informações específicas da clínica Deep Saúde. O objetivo é testar a capacidade da IA de utilizar informações contextuais específicas para gerar respostas mais precisas e relevantes.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero hardcodar uma base de conhecimento estática no AI Service, para que o assistente possa responder com informações específicas da clínica.

#### Acceptance Criteria

1. WHEN o AI Service é inicializado THEN o sistema SHALL carregar a base de conhecimento estática da Deep Saúde
2. WHEN uma mensagem é processada THEN o sistema SHALL incluir o contexto da base de conhecimento no prompt
3. WHEN a IA não encontrar informação na base THEN o sistema SHALL responder "Informação não disponível no momento."
4. IF a base de conhecimento não for carregada THEN o sistema SHALL funcionar normalmente sem contexto adicional

### Requirement 2

**User Story:** Como usuário, eu quero que o assistente responda apenas com informações da base de conhecimento, para que as respostas sejam precisas e confiáveis.

#### Acceptance Criteria

1. WHEN eu pergunto sobre horários THEN o sistema SHALL responder com "Segunda a sexta, das 08:00 às 21:00"
2. WHEN eu pergunto sobre preços THEN o sistema SHALL responder com "R$ 100, R$ 130 ou R$ 200 por sessão"
3. WHEN eu pergunto sobre modalidade THEN o sistema SHALL responder "Atendimento exclusivamente online"
4. WHEN eu pergunto algo não disponível na base THEN o sistema SHALL responder exatamente "Informação não disponível no momento."

### Requirement 3

**User Story:** Como usuário, eu quero que as respostas sejam em português brasileiro e linguagem clara, para que a comunicação seja natural e compreensível.

#### Acceptance Criteria

1. WHEN o assistente responde THEN o sistema SHALL usar linguagem clara e objetiva
2. WHEN o assistente responde THEN o sistema SHALL usar português brasileiro
3. WHEN o assistente responde THEN o sistema SHALL manter tom profissional mas acessível
4. IF a pergunta for ambígua THEN o sistema SHALL pedir esclarecimento de forma educada
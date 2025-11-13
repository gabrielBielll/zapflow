# Requirements Document

## Introduction

Esta funcionalidade visa completar as integrações faltantes no sistema ZapFlow existente para permitir o fluxo completo de ponta a ponta: conectar WhatsApp via QR code, criar um assistente, e testar respostas automatizadas da IA. O objetivo é identificar e implementar apenas os componentes que estão faltando para que o sistema funcione completamente no Render.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero completar as configurações de ambiente faltantes, para que todos os serviços se comuniquem corretamente no Render.

#### Acceptance Criteria

1. WHEN o docker-compose.yml é executado THEN o sistema SHALL ter todas as variáveis de ambiente necessárias configuradas
2. WHEN os serviços são implantados no Render THEN o sistema SHALL usar as URLs internas corretas para comunicação entre serviços
3. WHEN o AI Service é inicializado THEN o sistema SHALL ter acesso à chave da API do Gemini
4. IF alguma variável de ambiente estiver faltando THEN o sistema SHALL falhar com mensagem clara

### Requirement 2

**User Story:** Como usuário, eu quero acessar uma interface para conectar WhatsApp via QR code, para que eu possa estabelecer a conexão com meu número.

#### Acceptance Criteria

1. WHEN eu acesso o frontend THEN o sistema SHALL ter uma página/seção para conexão WhatsApp
2. WHEN eu clico para conectar WhatsApp THEN o sistema SHALL chamar o gateway para gerar QR code
3. WHEN o QR code é gerado THEN o sistema SHALL exibir o código na interface
4. WHEN eu escaneio o QR code THEN o sistema SHALL confirmar a conexão estabelecida

### Requirement 3

**User Story:** Como usuário, eu quero criar um assistente conectado ao meu WhatsApp, para que mensagens recebidas sejam processadas por esse assistente.

#### Acceptance Criteria

1. WHEN eu crio um assistente THEN o sistema SHALL associar o assistente ao meu número de WhatsApp
2. WHEN um assistente é criado THEN o sistema SHALL armazenar as configurações no banco de dados
3. WHEN mensagens chegam no WhatsApp THEN o sistema SHALL identificar qual assistente deve processar
4. IF não houver assistente associado THEN o sistema SHALL retornar erro 404

### Requirement 4

**User Story:** Como usuário, eu quero que o AI Service processe mensagens e gere respostas, para que o assistente responda automaticamente no WhatsApp.

#### Acceptance Criteria

1. WHEN o AI Service recebe uma requisição THEN o sistema SHALL processar a mensagem usando Gemini
2. WHEN uma resposta é gerada THEN o sistema SHALL retornar a resposta para o Core API
3. WHEN o Core API recebe a resposta THEN o sistema SHALL enviar via Gateway para o WhatsApp
4. IF o AI Service falhar THEN o sistema SHALL retornar mensagem de erro padrão

### Requirement 5

**User Story:** Como desenvolvedor, eu quero que o banco de dados seja configurado corretamente, para que o sistema persista dados de assistentes e conversas.

#### Acceptance Criteria

1. WHEN o sistema é inicializado THEN o sistema SHALL conectar ao banco de dados PostgreSQL
2. WHEN um assistente é criado THEN o sistema SHALL persistir no banco
3. WHEN conversas acontecem THEN o sistema SHALL armazenar histórico no banco
4. IF a conexão com banco falhar THEN o sistema SHALL exibir erro claro

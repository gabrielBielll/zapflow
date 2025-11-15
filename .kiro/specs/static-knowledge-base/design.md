# Design Document

## Overview

Esta funcionalidade implementa uma base de conhecimento estática hardcoded no AI Service para fornecer informações específicas da clínica Deep Saúde. A implementação modifica o fluxo de geração de respostas para incluir contexto específico da clínica, garantindo respostas precisas e controladas.

## Architecture

A implementação segue uma arquitetura de contexto estático que se integra ao fluxo existente de geração de respostas:

```
User Message → AI Service → Static Knowledge Base → Enhanced Prompt → Gemini API → Response
```

### Components Integration

1. **Static Knowledge Base Module**: Módulo que contém as informações hardcoded da clínica
2. **Enhanced Prompt Builder**: Função que combina o contexto estático com a mensagem do usuário
3. **Response Validator**: Validador que garante que respostas seguem as regras estabelecidas

## Components and Interfaces

### 1. Static Knowledge Base Module

```typescript
interface KnowledgeBase {
  clinicInfo: {
    name: string;
    modality: string;
    schedule: string;
    prices: string[];
  };
  rules: {
    unavailableResponse: string;
    language: string;
    tone: string;
  };
}
```

**Responsabilidades:**
- Armazenar informações estáticas da clínica Deep Saúde
- Fornecer interface para acessar informações específicas
- Manter regras de resposta e comportamento

### 2. Enhanced Prompt Builder

```typescript
interface PromptBuilder {
  buildPromptWithKnowledge(query: string, history: ChatMessage[], knowledge: KnowledgeBase): string;
}
```

**Responsabilidades:**
- Combinar contexto da base de conhecimento com a query do usuário
- Estruturar prompt para garantir aderência às regras
- Incluir instruções específicas sobre comportamento esperado

### 3. Response Validator

```typescript
interface ResponseValidator {
  validateResponse(response: string, knowledge: KnowledgeBase): boolean;
  sanitizeResponse(response: string, knowledge: KnowledgeBase): string;
}
```

**Responsabilidades:**
- Validar se a resposta está dentro dos parâmetros esperados
- Aplicar fallback para "Informação não disponível no momento" quando necessário
- Garantir que não há informações inventadas

## Data Models

### Knowledge Base Structure

```typescript
const DEEP_SAUDE_KNOWLEDGE: KnowledgeBase = {
  clinicInfo: {
    name: "Deep Saúde",
    modality: "Atendimento exclusivamente online",
    schedule: "Segunda a sexta, das 08:00 às 21:00",
    prices: ["R$ 100", "R$ 130", "R$ 200"],
    description: "Clínica de psicologia online"
  },
  rules: {
    unavailableResponse: "Informação não disponível no momento.",
    language: "pt-BR",
    tone: "profissional mas acessível"
  }
};
```

### Enhanced Prompt Template

```typescript
const PROMPT_TEMPLATE = `
Você é um assistente de atendimento da ${clinicInfo.name}, uma ${clinicInfo.description}.

REGRAS IMPORTANTES:
- Responda SOMENTE com informações presentes na base de conhecimento abaixo
- Se a informação solicitada não estiver disponível, responda exatamente: "${rules.unavailableResponse}"
- Não invente valores, horários, políticas ou meios de pagamento
- Use linguagem clara, objetiva e em ${rules.language}

INFORMAÇÕES DA CLÍNICA:
- Modalidade: ${clinicInfo.modality}
- Horário de atendimento: ${clinicInfo.schedule}
- Preços por sessão: ${clinicInfo.prices.join(", ")} por sessão

Histórico da conversa:
{history}

Pergunta do usuário: {query}

Resposta:
`;
```

## Error Handling

### 1. Knowledge Base Loading Errors
- **Cenário**: Falha ao carregar base de conhecimento estática
- **Tratamento**: Log do erro e continuação com funcionamento normal sem contexto adicional
- **Fallback**: Sistema funciona normalmente usando apenas o prompt padrão

### 2. Invalid Response Detection
- **Cenário**: IA gera resposta com informações não presentes na base
- **Tratamento**: Aplicar sanitização automática ou fallback para resposta padrão
- **Fallback**: "Informação não disponível no momento."

### 3. Prompt Building Errors
- **Cenário**: Erro na construção do prompt com contexto
- **Tratamento**: Log do erro e uso do prompt padrão sem contexto adicional
- **Fallback**: Geração de resposta sem contexto da base de conhecimento

## Testing Strategy

### 1. Unit Tests
- **Knowledge Base Module**: Testar carregamento e acesso às informações
- **Prompt Builder**: Testar construção correta do prompt com diferentes inputs
- **Response Validator**: Testar validação e sanitização de respostas

### 2. Integration Tests
- **End-to-End Flow**: Testar fluxo completo com perguntas específicas da clínica
- **Fallback Scenarios**: Testar comportamento quando informação não está disponível
- **Error Scenarios**: Testar comportamento em cenários de erro

### 3. Response Quality Tests
```typescript
const testCases = [
  {
    query: "Qual o horário de funcionamento?",
    expectedResponse: "Segunda a sexta, das 08:00 às 21:00"
  },
  {
    query: "Quanto custa uma sessão?",
    expectedResponse: "R$ 100, R$ 130 ou R$ 200 por sessão"
  },
  {
    query: "Vocês atendem presencialmente?",
    expectedResponse: "Atendimento exclusivamente online"
  },
  {
    query: "Qual a política de cancelamento?",
    expectedResponse: "Informação não disponível no momento."
  }
];
```

### 4. Performance Tests
- **Response Time**: Garantir que adição do contexto não impacta significativamente o tempo de resposta
- **Memory Usage**: Verificar que base de conhecimento estática não causa vazamentos de memória
- **Concurrent Requests**: Testar comportamento com múltiplas requisições simultâneas
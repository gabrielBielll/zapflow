# Implementation Plan

- [x] 1. Configurar webhook do WAHA no Gateway
  - Modificar o endpoint `/webhook` no Gateway para processar corretamente mensagens do WAHA
  - Implementar validação da estrutura de webhook recebida
  - Adicionar logs detalhados para debug
  - _Requirements: 1.1, 3.2, 4.3_

- [x] 2. Implementar detecção de mensagens próprias para evitar loops
  - Adicionar verificação do campo `fromMe` no webhook payload
  - Implementar lógica para ignorar mensagens enviadas pelo próprio bot
  - Adicionar logs quando mensagens próprias são detectadas
  - _Requirements: 1.5_

- [x] 3. Melhorar handler de webhook no Core API
  - Modificar `whatsapp-message-webhook-handler` em webhooks.clj
  - Implementar tratamento robusto de erros com fallback
  - Adicionar timeout de 10 segundos para chamadas ao AI Service
  - Garantir que respostas sejam enviadas de volta via Gateway
  - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 5.1_

- [x] 4. Configurar comunicação entre Core API e Gateway para envio de mensagens
  - Verificar e ajustar URL do Gateway no Core API
  - Implementar retry logic para falhas de envio
  - Adicionar logs de sucesso e erro no envio de mensagens
  - _Requirements: 1.4, 4.2_

- [x] 5. Testar integração AI Service com conhecimento hardcoded
  - Verificar se endpoint `/generate` está funcionando corretamente
  - Testar resposta usando conhecimento da DeepSaude
  - Implementar fallback para quando AI Service falhar
  - _Requirements: 2.1, 2.2, 2.3, 4.1_

- [x] 6. Melhorar formatação de números de telefone no WAHA Provider
  - Ajustar método `formatPhoneNumber` para padrão brasileiro
  - Implementar parsing robusto de números recebidos via webhook
  - Adicionar logs de números formatados para debug
  - _Requirements: 1.1, 1.4_

- [x] 7. Implementar configuração automática de webhook no WAHA
  - Modificar WahaProvider para configurar webhook automaticamente na inicialização
  - Definir URL do webhook como `http://gateway:8081/webhook`
  - Configurar eventos para `['message']`
  - _Requirements: 3.1, 3.2_

- [x] 8. Adicionar tratamento de erro abrangente
  - Implementar mensagens de erro amigáveis para usuários
  - Adicionar logs estruturados para facilitar debug
  - Implementar timeouts apropriados em todas as chamadas HTTP
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Criar teste de integração end-to-end
  - Implementar script de teste que simula webhook do WAHA
  - Testar fluxo completo: webhook → Core API → AI Service → resposta
  - Verificar se mensagem é enviada corretamente de volta
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2_

- [x] 10. Configurar logs para monitoramento
  - Adicionar logs estruturados em todos os componentes
  - Implementar log de métricas básicas (tempo de resposta, erros)
  - Configurar logs para facilitar troubleshooting
  - _Requirements: 4.3, 5.1_
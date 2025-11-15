# Implementation Plan

- [x] 1. Create static knowledge base module
  - Create new file `packages/ai-service/src/knowledge/deepSaudeKnowledge.ts`
  - Define KnowledgeBase interface with clinic information structure
  - Implement DEEP_SAUDE_KNOWLEDGE constant with hardcoded clinic data
  - Export knowledge base and interface for use in other modules
  - _Requirements: 1.1_

- [x] 2. Implement enhanced prompt builder
  - Create new file `packages/ai-service/src/utils/promptBuilder.ts`
  - Implement buildPromptWithKnowledge function that combines static knowledge with user query
  - Create prompt template that includes clinic rules and information
  - Add function to format chat history for inclusion in prompt
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 3. Create response validator module
  - Create new file `packages/ai-service/src/utils/responseValidator.ts`
  - Implement validateResponse function to check if response follows knowledge base rules
  - Create sanitizeResponse function to apply fallback when needed
  - Add logic to detect when AI invents information not in knowledge base
  - _Requirements: 1.3, 2.4, 3.4_

- [x] 4. Modify generateResponse function to use static knowledge
  - Update generateResponse function in `packages/ai-service/src/index.ts`
  - Import and integrate static knowledge base module
  - Replace current prompt building with enhanced prompt builder
  - Add response validation before returning result
  - _Requirements: 1.2, 1.3_

- [x] 5. Add error handling for knowledge base integration
  - Implement try-catch blocks around knowledge base operations
  - Add fallback behavior when knowledge base fails to load
  - Create logging for knowledge base related errors
  - Ensure system continues working normally if knowledge base fails
  - _Requirements: 1.4_

- [ ] 6. Create unit tests for knowledge base module
  - Create test file `packages/ai-service/src/__tests__/deepSaudeKnowledge.test.ts`
  - Write tests for knowledge base data structure validation
  - Test access to clinic information properties
  - Verify knowledge base constants are properly defined
  - _Requirements: 1.1_

- [ ] 7. Create unit tests for prompt builder
  - Create test file `packages/ai-service/src/__tests__/promptBuilder.test.ts`
  - Test prompt building with different user queries
  - Verify clinic information is properly included in prompts
  - Test chat history formatting in prompts
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ] 8. Create unit tests for response validator
  - Create test file `packages/ai-service/src/__tests__/responseValidator.test.ts`
  - Test validation of responses that follow knowledge base rules
  - Test detection of responses with invented information
  - Verify fallback response is applied when needed
  - _Requirements: 1.3, 2.4_

- [ ] 9. Create integration tests for enhanced AI service
  - Create test file `packages/ai-service/src/__tests__/knowledgeIntegration.test.ts`
  - Test complete flow from query to response with static knowledge
  - Verify responses for specific Deep Saúde questions (schedule, prices, modality)
  - Test fallback behavior for questions not in knowledge base
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Update AI service HTTP endpoints to use enhanced functionality
  - Modify /generate endpoint to use new knowledge-enhanced generateResponse
  - Add error handling for knowledge base failures in HTTP endpoints
  - Update endpoint documentation to reflect new behavior
  - Test endpoints with curl commands to verify functionality
  - _Requirements: 1.2, 1.3, 1.4_
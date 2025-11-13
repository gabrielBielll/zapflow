// TODO: Os testes estão atualmente bloqueados por problemas de configuração do Jest/TypeScript com o Genkit.
// A resolução de tipos para os módulos do Genkit está falhando no ambiente de teste,
// embora o código do serviço em si (`src/index.ts`) esteja correto e compile.
// É necessário revisar a configuração do Jest (`jest.config.js`, `tsconfig.json`)
// para garantir que os módulos do Genkit sejam resolvidos corretamente durante os testes.

import { ai, indexDocument, generateResponse } from '../index';

// Spy on the genkit instance methods before any tests run
const indexSpy = jest.spyOn(ai, 'index').mockResolvedValue(undefined);
const retrieveSpy = jest.spyOn(ai, 'retrieve').mockResolvedValue([]);
const generateSpy = jest.spyOn(ai, 'generate').mockResolvedValue({ text: () => '' } as any);


describe('ZapFlow AI Flows', () => {
  const assistantId = 'test-assistant-123';
  const sourceId = 'test-doc-456';
  const testContent = `
    O produto principal da ZapFlow é o "ZapFlow-Max".
    O ZapFlow-Max custa R$ 100 por mês.
    Ele permite integrações com até 5 sistemas externos.
  `;

  beforeEach(() => {
    // Reset mocks before each test
    indexSpy.mockClear();
    retrieveSpy.mockClear();
    generateSpy.mockClear();
  });

  it('should index a document successfully', async () => {
    const result = await indexDocument.run({
      assistant_id: assistantId,
      source_id: sourceId,
      content: testContent,
    });

    // Verify that the indexer was called
    expect(indexSpy).toHaveBeenCalled();
    const indexedDocs = indexSpy.mock.calls[0][0].documents;

    // Add checks to ensure indexedDocs and its metadata are not empty/undefined
    expect(indexedDocs.length).toBeGreaterThan(0);
    if (indexedDocs.length > 0) {
        expect(indexedDocs[0].metadata).toBeDefined();
        if (indexedDocs[0].metadata) {
            expect(indexedDocs[0].metadata.assistant_id).toBe(assistantId);
            expect(indexedDocs[0].metadata.source_id).toBe(sourceId);
        }
    }

    // Verify the output
    expect(result.status).toBe('success');
    expect(result.chunks_indexed).toBe(indexedDocs.length);
  });

  it('should generate a response using RAG context', async () => {
    // Mock retriever
    retrieveSpy.mockResolvedValue([
      { text: () => 'O ZapFlow-Max custa R$ 100 por mês.' }
    ] as any);

    // Mock LLM
    const mockResponse = 'O custo do ZapFlow-Max é de R$ 100 por mês.';
    generateSpy.mockResolvedValue({
      text: () => mockResponse
    } as any);

    const result = await generateResponse.run({
      assistant_id: assistantId,
      query: 'Quanto custa o ZapFlow-Max?',
      history: [],
    });

    // Verify retriever call
    expect(retrieveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { where: { assistant_id: assistantId }, k: 3 },
      })
    );

    // Verify prompt - Cast to any to access the prompt property
    const finalPrompt = (generateSpy.mock.calls[0][0] as any).prompt;
    expect(finalPrompt).toContain('O ZapFlow-Max custa R$ 100 por mês.');

    // Verify response
    expect(result.response).toBe(mockResponse);
  });

  it('should generate a response without RAG if no documents are found', async () => {
    // Mock retriever to return empty
    retrieveSpy.mockResolvedValue([]);

    const mockResponse = "Desculpe, não tenho informações sobre o preço.";
    generateSpy.mockResolvedValue({
      text: () => mockResponse
    } as any);

    const result = await generateResponse.run({
      assistant_id: assistantId,
      query: 'Quanto custa?',
      history: [],
    });

    // Verify prompt - Cast to any to access the prompt property
    const finalPrompt = (generateSpy.mock.calls[0][0] as any).prompt;
    expect(finalPrompt).toContain('No relevant information found');

    // Verify response
    expect(result.response).toBe(mockResponse);
  });
});

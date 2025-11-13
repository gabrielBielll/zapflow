import request from 'supertest';
import { app } from '../index'; // Import the express app
import path from 'path';

// Mocking fs.readFileSync to avoid actual file system reads in tests
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readFileSync: jest.fn(),
}));

import fs from 'fs';

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('RAG Endpoints', () => {
  const testFilePath = path.resolve(__dirname, '../../src/test-document.txt');
  const testFileContent = `
    Este é um documento de teste sobre o Produto X.
    O Produto X é uma ferramenta de software inovadora que ajuda equipes a colaborar de forma mais eficaz.
    O preço do Produto X é de R$ 50 por usuário, por mês.
    Para mais informações, entre em contato com o nosso suporte em suporte@produtox.com.
  `;

  beforeEach(() => {
    // Reset mocks before each test
    mockedFs.readFileSync.mockClear();
  });

  it('should index a document and then answer a question based on it', async () => {
    // Mock the file read for the indexing step
    mockedFs.readFileSync.mockReturnValue(Buffer.from(testFileContent));

    // 1. Index the document
    const indexResponse = await request(app)
      .post('/index-document')
      .send({
        document_id: 'doc-123',
        filepath: testFilePath,
      });

    expect(indexResponse.status).toBe(200);
    expect(indexResponse.body.status).toBe('indexing_completed');
    expect(indexResponse.body.chunks).toBeGreaterThan(0);

    // 2. Ask a question related to the document
    const chatResponse = await request(app)
      .post('/chat')
      .send({
        message: 'Qual é o preço do Produto X?',
      });

    expect(chatResponse.status).toBe(200);
    // Check if the response contains information from the document
    expect(chatResponse.body.response).toContain('R$ 50');
  });

  it('should state it does not know the answer if context is not in the document', async () => {
    // Mock the file read for the indexing step
    mockedFs.readFileSync.mockReturnValue(Buffer.from(testFileContent));

    // 1. Index the document
    await request(app)
      .post('/index-document')
      .send({
        document_id: 'doc-456',
        filepath: testFilePath,
      });

    // 2. Ask a question NOT related to the document
    const chatResponse = await request(app)
      .post('/chat')
      .send({
        message: 'Qual é a capital da França?',
      });

    expect(chatResponse.status).toBe(200);
    // Based on the prompt, it should say it doesn't know.
    // We check for a substring, as the exact phrasing might vary.
    expect(chatResponse.body.response.toLowerCase()).toContain("não sei");
  });
});

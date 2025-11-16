// Importações Corrigidas
import { genkit } from 'genkit';
import { defineFlow, z } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { chroma, chromaIndexerRef, chromaRetrieverRef } from 'genkitx-chromadb';
import express from 'express';
import { DEEP_SAUDE_KNOWLEDGE, DeepSaudeKnowledgeService } from './knowledge/deepSaudeKnowledge';
import { PromptBuilder, ChatMessage } from './utils/promptBuilder';
import { ResponseValidator } from './utils/responseValidator';

// Função para chamar a API do Gemini diretamente (baseada no exemplo HTML)
async function callGeminiDirectly(prompt: string): Promise<string> {
  const API_KEY = process.env.GOOGLE_GENAI_API_KEY;
  const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData?.error?.message || `Erro HTTP: ${response.status}`;
      throw new Error(errorMsg);
    }

    const result = await response.json();

    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return result.candidates[0].content.parts[0].text;
    } else {
      // Caso de bloqueio de segurança ou resposta vazia
      const blockReason = result.candidates?.[0]?.finishReason;
      if (blockReason === 'SAFETY' || blockReason === 'OTHER') {
        return "A resposta foi bloqueada por motivos de segurança.";
      } else {
        return "Não consegui processar a resposta. Tente novamente.";
      }
    }
  } catch (error) {
    console.error('Erro ao chamar API do Gemini diretamente:', error);
    throw error;
  }
}

// HARDCODED PRODUCTION VARIABLES FOR LOCAL DEVELOPMENT
// Switch between local and production by commenting/uncommenting lines

// PRODUCTION GEMINI API KEY
process.env.GOOGLE_GENAI_API_KEY = "AIzaSyBOKeSudS26b5J0xKL_sKOEqX7Z2zgzUm0";

// PRODUCTION CHROMA DB (if using external ChromaDB)
// process.env.CHROMA_URL = "https://your-chroma-instance.com";

// LOCAL CHROMA DB (default - uses local instance)
// No need to set CHROMA_URL for local development

// Configuração Simplificada (genkit) - sem ChromaDB para base de conhecimento estática
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

// Schemas
const IndexDocumentRequestSchema = z.object({
  assistant_id: z.string(),
  source_id: z.string(),
  content: z.string(),
});

const IndexDocumentResponseSchema = z.object({
  status: z.string(),
  chunks_indexed: z.number(),
});

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const GenerateResponseRequestSchema = z.object({
    assistant_id: z.string(),
    query: z.string(),
    history: z.array(ChatMessageSchema),
});

const GenerateResponseResponseSchema = z.object({
    response: z.string(),
});


// Helper function for indexing documents
export async function indexDocument(payload: any) {
  try {
    const { assistant_id, source_id, content } = payload;
    
    // Simple text chunking function
    const chunkSize = 1000;
    const chunkOverlap = 100;
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    
    const documents = chunks.map((chunk: string) => ({
      content: [{ text: chunk }],
      metadata: { assistant_id, source_id }
    }));

    await ai.index({
      indexer: chromaIndexerRef({ collectionName: 'zapflow_rag' }),
      documents,
    });

    return { status: 'success', chunks_indexed: documents.length };
  } catch (error) {
    console.error('Error indexing document:', error);
    throw new Error('Failed to index document in vector store.');
  }
}

// Helper function for generating responses with static knowledge base
export async function generateResponse(payload: any) {
  try {
    const { assistant_id, query, history } = payload;
    
    // Inicializar serviço de conhecimento
    const knowledgeService = new DeepSaudeKnowledgeService();
    const knowledgeBase = knowledgeService.getFullKnowledgeBase();
    
    // Converter histórico para o formato esperado
    const chatHistory: ChatMessage[] = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));

    let finalPrompt: string;
    
    try {
      // Validar parâmetros do prompt
      if (!PromptBuilder.validatePromptParams(query, knowledgeBase)) {
        throw new Error('Parâmetros inválidos para construção do prompt');
      }

      // Construir prompt com base de conhecimento estática
      finalPrompt = PromptBuilder.buildPromptWithKnowledge(query, chatHistory, knowledgeBase);
      
      console.log('Usando base de conhecimento estática da Deep Saúde');
    } catch (error) {
      console.error('Erro ao construir prompt com base de conhecimento:', error);
      // Fallback para prompt simples
      finalPrompt = PromptBuilder.buildSimplePrompt(query, chatHistory);
      console.log('Usando prompt simples como fallback');
    }

    // Gerar resposta usando API direta do Gemini (como no exemplo HTML)
    const response = await callGeminiDirectly(finalPrompt);
    
    let processedResponse = response;

    // Validar e sanitizar resposta
    try {
      processedResponse = ResponseValidator.processResponse(response, knowledgeBase);
    } catch (error) {
      console.error('Erro ao validar resposta:', error);
      processedResponse = knowledgeBase.rules.unavailableResponse;
    }

    return { response: processedResponse };
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    
    // Fallback para resposta de erro em português
    const fallbackResponse = "Desculpe, encontrei um erro ao gerar uma resposta. Tente novamente.";
    
    try {
      const knowledgeService = new DeepSaudeKnowledgeService();
      return { response: knowledgeService.getUnavailableResponse() };
    } catch {
      return { response: fallbackResponse };
    }
  }
}

// HTTP Server setup

const app = express();
app.use(express.json());

// PORT FOR DOCKER DEPLOYMENT
const PORT = 8080;  // AI Service runs on port 8080 in Docker

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

// Generate response endpoint
app.post('/generate', async (req, res) => {
  try {
    const { assistant_id, query, history } = req.body;
    
    if (!assistant_id || !query) {
      console.warn('Requisição inválida: assistant_id e query são obrigatórios');
      return res.status(400).json({ error: 'assistant_id and query are required' });
    }

    console.log(`Processando requisição para assistant_id: ${assistant_id}, query: "${query}"`);

    const result = await generateResponse({ 
      assistant_id, 
      query, 
      history: history || [] 
    });
    
    console.log('Resposta gerada com sucesso');
    res.json(result);
  } catch (error) {
    console.error('Erro no endpoint /generate:', error);
    
    // Tentar usar resposta de fallback da base de conhecimento
    try {
      const knowledgeService = new DeepSaudeKnowledgeService();
      const fallbackResponse = knowledgeService.getUnavailableResponse();
      
      res.status(200).json({ response: fallbackResponse });
    } catch (fallbackError) {
      console.error('Erro ao acessar resposta de fallback:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to generate response',
        message: 'Desculpe, encontrei um erro ao gerar uma resposta. Tente novamente.'
      });
    }
  }
});

// Index document endpoint
app.post('/index-document', async (req, res) => {
  try {
    const { assistant_id, source_id, content } = req.body;
    
    if (!assistant_id || !source_id || !content) {
      return res.status(400).json({ 
        error: 'assistant_id, source_id, and content are required' 
      });
    }

    const result = await indexDocument({ assistant_id, source_id, content });
    
    res.json(result);
  } catch (error) {
    console.error('Error in /index-document endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to index document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

if (require.main === module) {
  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`AI Service HTTP server listening on port ${PORT}`);
  });
}

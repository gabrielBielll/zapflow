// Importações Corrigidas
import { genkit } from 'genkit';
import { defineFlow, z } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { chroma, chromaIndexerRef, chromaRetrieverRef } from 'genkitx-chromadb';
import express from 'express';

// HARDCODED PRODUCTION VARIABLES FOR LOCAL DEVELOPMENT
// Switch between local and production by commenting/uncommenting lines

// PRODUCTION GEMINI API KEY
process.env.GOOGLE_GENAI_API_KEY = "AIzaSyBOKeSudS26b5J0xKL_sKOEqX7Z2zgzUm0";

// PRODUCTION CHROMA DB (if using external ChromaDB)
// process.env.CHROMA_URL = "https://your-chroma-instance.com";

// LOCAL CHROMA DB (default - uses local instance)
// No need to set CHROMA_URL for local development

// Configuração Correta (genkit)
export const ai = genkit({
  plugins: [
    googleAI(),
    chroma([
      {
        collectionName: 'zapflow_rag',
        embedder: googleAI.embedder('text-embedding-004'),
      },
    ]),
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

// Helper function for generating responses
export async function generateResponse(payload: any) {
  try {
    const { assistant_id, query, history } = payload;
    let ragContext = "No relevant information found in the knowledge base.";

    try {
      const retrievedDocs = await ai.retrieve({
        retriever: chromaRetrieverRef({ collectionName: 'zapflow_rag' }),
        query,
        options: { where: { assistant_id }, k: 3 },
      });
      if (retrievedDocs.length > 0) {
          ragContext = retrievedDocs.map((doc: any) => doc.text).join('\n---\n');
      }
    } catch (error) {
        console.error('Error retrieving from vector store:', error);
        // Proceed without RAG context if the vector store fails
    }

    const personalityPrompt = "You are a helpful and friendly assistant.";
    const finalPrompt = `
      ${personalityPrompt}
      Context:
      ${ragContext}
      Chat History:
      ${history.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
      User's Question:
      ${query}
    `;

    const llmResponse = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: finalPrompt,
    });

    return { response: llmResponse.text };
  } catch (error) {
      console.error('Error generating LLM response:', error);
      return { response: "I'm sorry, I encountered an error while generating a response. Please try again." };
  }
}

// HTTP Server setup

const app = express();
app.use(express.json());

// HARDCODED PORT FOR LOCAL DEVELOPMENT
const PORT = 4000;  // AI Service runs on port 4000 locally

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

// Generate response endpoint
app.post('/generate', async (req, res) => {
  try {
    const { assistant_id, query, history } = req.body;
    
    if (!assistant_id || !query) {
      return res.status(400).json({ error: 'assistant_id and query are required' });
    }

    const result = await generateResponse({ 
      assistant_id, 
      query, 
      history: history || [] 
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error in /generate endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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

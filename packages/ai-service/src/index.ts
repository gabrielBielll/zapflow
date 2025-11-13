import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z, embed } from 'genkit/ai';
import express from 'express';
import bodyParser from 'body-parser';
import { VectorDB } from 'imvectordb';
import * as fs from 'fs';
const pdf = require('pdf-parse');

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
});

const textEmbedding004 = googleAI.embedder('text-embedding-004');

// Initialize in-memory vector database
const db = new VectorDB();

// Define the chat flow
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input: string) => {
    // 1. Create an embedding for the user's input
    const queryEmbedding = await embed({
        embedder: textEmbedding004,
        content: input,
    });

    // 2. Search for relevant context in the vector DB
    const searchResults = await db.query(queryEmbedding, 3);
    const context = searchResults.map(r => r.document.metadata.text).join('\n---\n');

    // 3. Construct the prompt with the retrieved context
    const augmentedPrompt = `
      You are a helpful assistant. Answer the user's question based on the following context.
      If the context does not contain the answer, say that you don't know.

      Context:
      ${context}

      User's Question:
      ${input}
    `;

    // 4. Generate a response using the augmented prompt
    const { output } = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: augmentedPrompt,
      output: { schema: z.string() }
    });

    if (!output) {
      throw new Error('Failed to generate a response.');
    }
    return output;
  },
);

// Create Express server
export const app = express();
const port = 4000;

app.use(bodyParser.json());

// Define the /chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: 'Message is required' });
  }

  try {
    const response = await chatFlow.run(message);
    res.send({ response });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to process chat message' });
  }
});

// Define the /index-document endpoint
app.post('/index-document', async (req, res) => {
  const { document_id, filepath } = req.body;

  if (!document_id || !filepath) {
    return res.status(400).send({ error: 'document_id and filepath are required' });
  }

  console.log(`Indexing document ${document_id} from ${filepath}`);

  try {
    const fileBuffer = fs.readFileSync(filepath);
    let textContent = '';

    if (filepath.endsWith('.pdf')) {
        const data = await pdf(fileBuffer);
        textContent = data.text;
    } else if (filepath.endsWith('.txt')) {
        textContent = fileBuffer.toString('utf-8');
    } else {
        return res.status(400).send({ error: 'Unsupported file type' });
    }

    // Simple chunking strategy
    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < textContent.length; i += chunkSize) {
        chunks.push(textContent.substring(i, i + chunkSize));
    }

    // Process and add each chunk individually
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await embed({
            embedder: textEmbedding004,
            content: chunk
        });

        await db.add({
            id: `${document_id}-chunk-${i}`,
            embedding: embedding,
            metadata: {
                text: chunk,
                documentId: document_id
            }
        });
    }

    console.log(`Successfully indexed ${chunks.length} chunks for document ${document_id}`);
    res.send({ status: 'indexing_completed', chunks: chunks.length });

  } catch (error) {
      console.error('Error indexing document:', error);
      res.status(500).send({ error: 'Failed to index document' });
  }
});

// Start the server if running directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`AI service listening on port ${port}`);
  });
}

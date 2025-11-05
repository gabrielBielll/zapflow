import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';
import express from 'express';
import bodyParser from 'body-parser';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
});

// Define the chat flow
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input: string) => {
    const { output } = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `User said: ${input}. Respond briefly.`,
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

// Start the server if running directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`AI service listening on port ${port}`);
  });
}

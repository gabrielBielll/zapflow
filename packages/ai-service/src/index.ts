import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { defineFlow, startFlowsServer } from 'genkit/server';
import * as z from 'zod';

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const chatFlow = defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (message) => {
    // Logic to interact with the Gemini Pro model will go here.
    // For now, we'll just return a placeholder.
    return `You said: ${message}`;
  }
);

startFlowsServer();

import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

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

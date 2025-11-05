import { ai, chatFlow } from '../index';
import { z } from 'zod';

describe('chatFlow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the output from the ai.generate call', async () => {
    const mockOutput = 'Mocked AI response';
    const generateSpy = jest.spyOn(ai, 'generate').mockResolvedValue({ output: mockOutput } as any);

    const result = await chatFlow('test message');

    expect(result).toBe(mockOutput);
    expect(generateSpy).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      prompt: 'User said: test message. Respond briefly.',
      output: { schema: expect.any(z.ZodString) },
    });
  });
});

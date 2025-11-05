import supertest from 'supertest';
import { app, chatFlow } from '../index';
import * as index from '../index';

describe('POST /chat', () => {
  let chatFlowSpy: jest.SpyInstance;

  afterEach(() => {
    chatFlowSpy.mockRestore();
  });

  it('should return a 200 response with the chatFlow output', async () => {
    const mockResponse = 'Hello from the mock!';
    chatFlowSpy = jest.spyOn(index.chatFlow, 'run').mockResolvedValue(mockResponse as any);

    const response = await supertest(app)
      .post('/chat')
      .send({ message: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ response: mockResponse });
    expect(chatFlowSpy).toHaveBeenCalledWith('test');
  });

  it('should return a 400 response if message is not provided', async () => {
    chatFlowSpy = jest.spyOn(index.chatFlow, 'run').mockResolvedValue('' as any);
    const response = await supertest(app)
      .post('/chat')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Message is required' });
  });

  it('should return a 500 response if chatFlow throws an error', async () => {
    chatFlowSpy = jest.spyOn(index.chatFlow, 'run').mockRejectedValue(new Error('Test error'));

    const response = await supertest(app)
      .post('/chat')
      .send({ message: 'test' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to process chat message' });
  });
});

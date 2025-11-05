const supertest = require('supertest');
const { createApp } = require('./index');

describe('POST /send-message', () => {
    let mockClient;
    let app;

    beforeEach(() => {
        mockClient = {
            sendMessage: jest.fn(),
        };
        app = createApp(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a 200 response when the message is sent successfully', async () => {
        mockClient.sendMessage.mockResolvedValue();

        const response = await supertest(app)
            .post('/send-message')
            .send({ to: '12345', message: 'Hello' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'Message sent' });
        expect(mockClient.sendMessage).toHaveBeenCalledWith('12345', 'Hello');
    });

    it('should return a 400 response if "to" is missing', async () => {
        const response = await supertest(app)
            .post('/send-message')
            .send({ message: 'Hello' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Parameters "to" and "message" are required.' });
    });

    it('should return a 400 response if "message" is missing', async () => {
        const response = await supertest(app)
            .post('/send-message')
            .send({ to: '12345' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Parameters "to" and "message" are required.' });
    });

    it('should return a 500 response if sendMessage throws an error', async () => {
        mockClient.sendMessage.mockRejectedValue(new Error('Test error'));

        const response = await supertest(app)
            .post('/send-message')
            .send({ to: '12345', message: 'Hello' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Failed to send message' });
    });
});

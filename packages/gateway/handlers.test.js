const { handleQr, handleReady, handleMessage } = require('./handlers');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

jest.mock('axios');
jest.mock('qrcode-terminal');

describe('Gateway Handlers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleQr', () => {
        it('should generate a QR code', () => {
            const qr = 'test-qr-code';
            handleQr(qr);
            expect(qrcode.generate).toHaveBeenCalledWith(qr, { small: true });
        });
    });

    describe('handleReady', () => {
        it('should log a ready message', () => {
            const consoleSpy = jest.spyOn(console, 'log');
            handleReady();
            expect(consoleSpy).toHaveBeenCalledWith('Client is ready!');
        });
    });

    describe('handleMessage', () => {
        it('should send the message to the Core API', async () => {
            const message = { body: 'hello' };
            axios.post.mockResolvedValue({ status: 200 });

            await handleMessage(message);

            expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/webhook/whatsapp', message);
        });

        it('should log an error if sending the message fails', async () => {
            const message = { body: 'hello' };
            const error = new Error('Network Error');
            axios.post.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'error');

            await handleMessage(message);

            expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/webhook/whatsapp', message);
            expect(consoleSpy).toHaveBeenCalledWith('Error sending message to Core API:', error.message);
        });
    });
});

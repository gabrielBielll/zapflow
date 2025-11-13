// services/gatewayService.ts
import axios from 'axios';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5001';

export const getQRCode = async (): Promise<string> => {
  try {
    const response = await axios.get(`${GATEWAY_URL}/qr-code`);
    return response.data.qrCode;
  } catch (error) {
    console.error('Error fetching QR code:', error);
    throw new Error('Failed to fetch QR code');
  }
};

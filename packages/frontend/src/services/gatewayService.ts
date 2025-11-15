// services/gatewayService.ts
import axios from 'axios';
import { GATEWAY_URL } from '../config/environment';

export const getQRCode = async (channelId: string): Promise<string> => {
  try {
    const response = await axios.post(`${GATEWAY_URL}/init-session`, {
      channel_id: channelId
    });
    return response.data.qr_string;
  } catch (error) {
    console.error('Error fetching QR code:', error);
    throw new Error('Failed to fetch QR code');
  }
};

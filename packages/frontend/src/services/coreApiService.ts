// services/coreApiService.ts
import axios from 'axios';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'https://zflow-core-api.onrender.com';

export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${CORE_API_URL}/api/rag/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const updateAssistantSettings = async (assistantId: string, settings: { personality: string; ragEnabled: boolean }): Promise<any> => {
  try {
    const response = await axios.put(`${CORE_API_URL}/api/assistants/${assistantId}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating assistant settings:', error);
    throw new Error('Failed to update assistant settings');
  }
}

export const getConversationHistory = async (assistantId: string): Promise<any[]> => {
    try {
        const response = await axios.get(`${CORE_API_URL}/api/assistants/${assistantId}/conversations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw new Error('Failed to fetch conversation history');
    }
}

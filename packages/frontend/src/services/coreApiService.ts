// services/coreApiService.ts
import axios from 'axios';
import { CORE_API_URL } from '../config/environment';

export const uploadFile = async (assistantId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${CORE_API_URL}/api/v1/frontend/assistants/${assistantId}/knowledge/upload`, formData, {
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
    const response = await axios.put(`${CORE_API_URL}/api/v1/frontend/assistants/${assistantId}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating assistant settings:', error);
    throw new Error('Failed to update assistant settings');
  }
}

export const getConversationHistory = async (assistantId: string): Promise<any[]> => {
    try {
        const response = await axios.get(`${CORE_API_URL}/api/v1/frontend/assistants/${assistantId}/conversations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw new Error('Failed to fetch conversation history');
    }
}

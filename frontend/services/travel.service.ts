import { fetchWithAuth } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export const TravelService = {
  createRequest: async (data: any) => {
    return fetchWithAuth(`${API_BASE}/travel-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getRequests: async () => {
    return fetchWithAuth(`${API_BASE}/travel-requests`);
  }
};

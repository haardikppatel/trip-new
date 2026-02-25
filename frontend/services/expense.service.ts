import { fetchWithAuth } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export const ExpenseService = {
  submitExpense: async (data: any) => {
    return fetchWithAuth(`${API_BASE}/expenses/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getExpenses: async () => {
    return fetchWithAuth(`${API_BASE}/expenses`);
  }
};

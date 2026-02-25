export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // In a real app, get token from Supabase session
  const token = 'mock-jwt-token';
  
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

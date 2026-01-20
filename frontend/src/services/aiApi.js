const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const askOpenRouter = async (prompt) => {
  const response = await fetch(`${API_BASE}/api/openrouter/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get AI response');
  }
  
  return data;
};

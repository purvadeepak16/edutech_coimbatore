export const askOpenRouter = async (prompt) => {
  const response = await fetch('/api/openrouter/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return response.json();
};

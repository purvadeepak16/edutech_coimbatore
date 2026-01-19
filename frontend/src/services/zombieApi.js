// Build a consistent base URL for the zombie API.
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/zombie`
    : '/api/zombie';

// Create new survivor
export const createSurvivor = async (name) => {
    const response = await fetch(`${API_BASE}/survivors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return response.json();
};

// Make decision
export const makeDecision = async (survivorId, decision) => {
    const response = await fetch(`${API_BASE}/survivors/${survivorId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
    });
    return response.json();
};

// Get leaderboard
export const getLeaderboard = async () => {
    const response = await fetch(`${API_BASE}/leaderboard`);
    return response.json();
};

// Add to leaderboard
export const addToLeaderboard = async (entry) => {
    const response = await fetch(`${API_BASE}/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return response.json();
};

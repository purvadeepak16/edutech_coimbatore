import { Brain, Zap, Sparkles } from 'lucide-react';

/**
 * Game Configuration
 * Source of truth for all gamification features
 * 
 * Backend APIs:
 * - games-backend runs on separate port (games_backend/server.js)
 * - Endpoints: /api/whack-a-mole, /api/memory-card
 */

const GAMES_BACKEND_URL = import.meta.env.VITE_GAMES_API_URL || 'http://localhost:5001';

export const GAMES_CONFIG = [
  {
    id: 'zombie-survival',
    title: 'Zombie Survival',
    description: 'A mindful decision-making game to sharpen your reflexes and focus. Can you survive the 14-day quarantine?',
    icon: Brain,
    color: 'soft-pink',
    difficulty: 'Medium',
    route: '/zombie-survival',
    apiEndpoint: null, // Uses main backend zombie routes
    locked: false,
    enabled: true,
  },
  {
    id: 'memory-card',
    title: 'Memory Match',
    description: 'Test your memory by matching pairs of cards. Challenge yourself with increasing difficulty levels!',
    icon: Sparkles,
    color: 'soft-purple',
    difficulty: 'Easy',
    route: '/memory-game',
    apiEndpoint: `${GAMES_BACKEND_URL}/api/memory-card`,
    locked: false,
    enabled: true,
  },
  {
    id: 'whack-a-mole',
    title: 'Whack-A-Mole',
    description: 'Quick reflexes game! Whack the moles as they pop up. Speed increases as you score higher!',
    icon: Zap,
    color: 'soft-teal',
    difficulty: 'Hard',
    route: '/whack-a-mole',
    apiEndpoint: `${GAMES_BACKEND_URL}/api/whack-a-mole`,
    locked: false,
    enabled: true,
  },
];

/**
 * Get active games (enabled and not locked for current user)
 */
export const getActiveGames = (userProgress = {}) => {
  return GAMES_CONFIG.filter(game => {
    if (!game.enabled) return false;
    if (game.locked && !userProgress[game.id]?.unlocked) return false;
    return true;
  });
};

/**
 * Get game by ID
 */
export const getGameById = (id) => {
  return GAMES_CONFIG.find(game => game.id === id);
};

export default GAMES_CONFIG;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from './GameCard';
import { getActiveGames } from '../config/games.config';
import './GamesGrid.css';

/**
 * GamesGrid Component
 * 
 * Dynamically renders all enabled games from games.config.js
 * Automatically scales when games are added/removed from config
 * Handles locked/progress states per game
 * 
 * Props:
 * - userProgress: Object mapping gameId to { unlocked, progress, completed }
 */
const GamesGrid = ({ userProgress = {}, isPlayBlocked = false }) => {
  const navigate = useNavigate();
  const activeGames = getActiveGames(userProgress);

  const handleGameClick = (game) => {
    if (!game.locked && game.route) {
      navigate(game.route);
    }
  };

  if (activeGames.length === 0) {
    return (
      <div className="games-grid-empty">
        <p>No games available at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="games-grid">
      {activeGames.map((game) => {
        const gameProgress = userProgress[game.id] || {};
        
        return (
          <GameCard
            key={game.id}
            title={game.title}
            description={game.description}
            icon={game.icon}
            color={game.color}
            difficulty={game.difficulty}
            locked={(game.locked && !gameProgress.unlocked) || isPlayBlocked}
            progress={gameProgress.progress || null}
            completed={gameProgress.completed || false}
            onClick={() => handleGameClick(game)}
          />
        );
      })}
    </div>
  );
};

export default GamesGrid;

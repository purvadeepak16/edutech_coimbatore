import React from 'react';
import { Gamepad2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './GameCard.css';

/**
 * GameCard Component
 * 
 * Design Reference: Zombie AI card from GamificationSection
 * Maintains exact layout, spacing, typography, and button placement
 * 
 * Props:
 * - title: Game name
 * - description: Game description  
 * - icon: Lucide icon component
 * - color: CSS variable color name (e.g., 'soft-pink', 'soft-teal')
 * - difficulty: 'Easy', 'Medium', or 'Hard'
 * - locked: Boolean, if true shows lock icon and disables interaction
 * - progress: Optional progress percentage (0-100)
 * - completed: Boolean, shows completion badge
 * - onClick: Handler for Start Game button
 */
const GameCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = 'soft-pink', 
  difficulty = 'Medium',
  locked = false,
  progress = null,
  completed = false,
  onClick 
}) => {
  const handleClick = () => {
    if (!locked && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`game-card ${locked ? 'game-card-locked' : ''}`}
      style={{ borderColor: `var(--color-${color})` }}
    >
      {/* Header: Icon + Difficulty Badge */}
      <div className="game-card-header">
        <div 
          className="game-icon-box" 
          style={{ backgroundColor: `var(--color-${color}-light)` }}
        >
          {locked ? (
            <Lock size={32} color="var(--color-text-tertiary)" />
          ) : (
            <Icon size={32} color={`var(--color-${color})`} />
          )}
        </div>
        <div className="difficulty-tag">{difficulty}</div>
      </div>

      {/* Content: Title + Description */}
      <div className="game-card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {/* Progress Bar (if in progress) */}
      {progress !== null && !locked && !completed && (
        <div className="game-progress-container">
          <div className="game-progress-bar" style={{ width: `${progress}%` }}></div>
          <span className="game-progress-text">{progress}% Complete</span>
        </div>
      )}

      {/* Completion Badge */}
      {completed && (
        <div className="game-completed-badge">
          ✓ Completed
        </div>
      )}

      {/* Footer: Start Button */}
      <div className="game-card-footer">
        <Button 
          className="game-start-btn" 
          onClick={handleClick}
          disabled={locked}
        >
          <Gamepad2 size={18} />
          <span>{locked ? 'Locked' : completed ? 'Play Again' : 'Start Game'}</span>
        </Button>
        
        {locked && (
          <span className="lock-hint">Complete previous games to unlock</span>
        )}
      </div>
    </div>
  );
};

export default GameCard;

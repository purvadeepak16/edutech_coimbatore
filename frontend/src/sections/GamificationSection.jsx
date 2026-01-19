import React from 'react';
import { Gamepad2, Brain, Trophy, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import './GamificationSection.css';

const GameCard = ({ title, description, icon: Icon, color, difficulty, onClick }) => (
    <div className="game-card" style={{ borderColor: `var(--color-${color})` }}>
        <div className="game-card-header">
            <div className="game-icon-box" style={{ backgroundColor: `var(--color-${color}-light)` }}>
                <Icon size={32} color={`var(--color-${color})`} />
            </div>
            <div className="difficulty-tag">{difficulty}</div>
        </div>
        <div className="game-card-content">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
        <div className="game-card-footer">
            <Button className="game-start-btn" onClick={onClick}>
                <Gamepad2 size={18} />
                <span>Start Game</span>
            </Button>
        </div>
    </div>
);

const GamificationSection = () => {
    const navigate = useNavigate();
    const games = [
        {
            title: "Zombie Survival",
            description: "A mindful decision-making game to sharpen your reflexes and focus. Can you survive the 14-day quarantine?",
            icon: Brain,
            color: "soft-pink",
            difficulty: "Medium",
            onClick: () => navigate('/zombie-survival')
        },
        {
            title: "Quick Quiz",
            description: "Battle against the AI in a rapid-fire trivia round based on your syllabus.",
            icon: Zap,
            color: "soft-teal",
            difficulty: "Hard"
        },
        {
            title: "Syllabus Sprint",
            description: "A timed exploration of your notes. Find the key concepts before time runs out!",
            icon: Trophy,
            color: "soft-yellow",
            difficulty: "Easy"
        }
    ];

    return (
        <section className="gamification-container">
            <div className="stats-row">
                <div className="stat-summary-card">
                    <div className="stat-icon-circle">
                        <Star fill="var(--color-warning)" color="var(--color-warning)" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Points</span>
                        <span className="stat-value">12.4k</span>
                    </div>
                </div>
                <div className="stat-summary-card">
                    <div className="stat-icon-circle">
                        <Trophy color="var(--color-soft-purple)" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Rank</span>
                        <span className="stat-value">Gold IV</span>
                    </div>
                </div>
            </div>

            <div className="games-grid">
                {games.map((game, index) => (
                    <GameCard key={index} {...game} />
                ))}
            </div>
        </section>
    );
};

export default GamificationSection;

import React from 'react';
import { Star, Trophy } from 'lucide-react';
import GamesGrid from '../components/GamesGrid';
import './GamificationSection.css';

const GamificationSection = () => {
    // TODO: Replace with actual user progress from context/API
    const userProgress = {
        'zombie-survival': { unlocked: true, progress: null, completed: false },
        'memory-card': { unlocked: true, progress: null, completed: false },
        'whack-a-mole': { unlocked: true, progress: null, completed: false },
    };

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

            <GamesGrid userProgress={userProgress} />
        </section>
    );
};

export default GamificationSection;

import React from 'react';
import GamificationSection from '../sections/GamificationSection';

const AchievementsPage = () => {
    return (
        <div className="achievements-page">
            <div className="page-header">
                <h1>🏅 Achievements & Badges</h1>
                <p>Celebrate your milestones and stay motivated</p>
            </div>
            <GamificationSection />
        </div>
    );
};

export default AchievementsPage;

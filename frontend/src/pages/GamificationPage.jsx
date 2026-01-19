import React from 'react';
import GamificationSection from '../sections/GamificationSection';
import './PageStyles.css';

const GamificationPage = () => {
    return (
        <div className="gamification-page">
            <div className="page-header">
                <h1>🎮 Gamification Hub</h1>
                <p>Learn faster, earn rewards, and stay consistent.</p>
            </div>
            <GamificationSection />
        </div>
    );
};

export default GamificationPage;

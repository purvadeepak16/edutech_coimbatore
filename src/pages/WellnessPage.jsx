import React from 'react';
import WellnessSection from '../sections/WellnessSection';

const WellnessPage = () => {
    return (
        <div className="wellness-page">
            <div className="page-header">
                <h1>🌿 Wellness & Balance</h1>
                <p>Maintaining a healthy mind for better learning</p>
            </div>
            <WellnessSection />
        </div>
    );
};

export default WellnessPage;

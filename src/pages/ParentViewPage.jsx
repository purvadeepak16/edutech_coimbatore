import React from 'react';
import ParentDashboardSection from '../sections/ParentDashboardSection';

const ParentViewPage = () => {
    return (
        <div className="parent-view-page">
            <div className="page-header">
                <h1>👨‍👩‍👧 Parent Dashboard</h1>
                <p>Monitoring progress and providing support</p>
            </div>
            <ParentDashboardSection />
        </div>
    );
};

export default ParentViewPage;

import React from 'react';
import LoadBalancingSection from '../sections/LoadBalancingSection';

const SchedulePage = () => {
    return (
        <div className="schedule-page">
            <div className="page-header">
                <h1>📅 Study Schedule</h1>
                <p>Smart load balanced schedule for optimal learning</p>
            </div>
            <LoadBalancingSection />
        </div>
    );
};

export default SchedulePage;

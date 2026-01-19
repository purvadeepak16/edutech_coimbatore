import React from 'react';
import AssessmentsSection from '../sections/AssessmentsSection';

const AssessmentsPage = () => {
    return (
        <div className="assessments-page">
            <div className="page-header">
                <h1>📋 Assessments</h1>
                <p>Multi-level tests to ensure true mastery</p>
            </div>
            <AssessmentsSection />
        </div>
    );
};

export default AssessmentsPage;

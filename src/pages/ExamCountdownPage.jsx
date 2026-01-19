import React from 'react';
import ExamCountdownSection from '../sections/ExamCountdownSection';

const ExamCountdownPage = () => {
    return (
        <div className="exam-countdown-page">
            <div className="page-header">
                <h1>⏱️ Exam Countdown</h1>
                <p>Stay focused and track your remaining preparation time</p>
            </div>
            <ExamCountdownSection />
        </div>
    );
};

export default ExamCountdownPage;

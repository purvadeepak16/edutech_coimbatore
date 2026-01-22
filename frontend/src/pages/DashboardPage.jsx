import React, { useState } from 'react';
import GreetingSection from '../sections/GreetingSection';
import StudyPlanSection from '../sections/StudyPlanSection';
import StudyCalendar from '../components/StudyCalendar';
import LearningModeSection from '../sections/LearningModeSection';
import ActiveSessionSection from '../sections/ActiveSessionSection';
import QuickActionsBar from '../sections/QuickActionsBar';
import TodaysPlanSummary from '../components/TodaysPlanSummary';
import ConnectMentorButton from '../components/ConnectMentorButton';
import MentorListModal from '../components/MentorListModal';
import './DashboardPage.css';

const DashboardPage = () => {
    const [showMentorModal, setShowMentorModal] = useState(false);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header-actions">
                <ConnectMentorButton onClick={() => setShowMentorModal(true)} />
            </div>
            
            <GreetingSection />
            <TodaysPlanSummary />
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: '1' }}>
                    <StudyPlanSection />
                </div>
                <div style={{ width: '350px' }}>
                    <StudyCalendar />
                </div>
            </div>
            <LearningModeSection />
            <ActiveSessionSection />
            <QuickActionsBar />

            {/* Mentor Connection Modal */}
            <MentorListModal 
                isOpen={showMentorModal}
                onClose={() => setShowMentorModal(false)}
            />
        </div>
    );
};

export default DashboardPage;

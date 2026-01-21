import React from 'react';
import GreetingSection from '../sections/GreetingSection';
import StudyPlanSection from '../sections/StudyPlanSection';
import StudyCalendar from '../components/StudyCalendar';
import LearningModeSection from '../sections/LearningModeSection';
import ActiveSessionSection from '../sections/ActiveSessionSection';
import QuickActionsBar from '../sections/QuickActionsBar';
import TodaysPlanSummary from '../components/TodaysPlanSummary';

const DashboardPage = () => {
    return (
        <>
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
        </>
    );
};

export default DashboardPage;

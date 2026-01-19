import React from 'react';
import GreetingSection from '../sections/GreetingSection';
import StudyPlanSection from '../sections/StudyPlanSection';
import LearningModeSection from '../sections/LearningModeSection';
import ActiveSessionSection from '../sections/ActiveSessionSection';
import QuickActionsBar from '../sections/QuickActionsBar';

const DashboardPage = () => {
    return (
        <>
            <GreetingSection />
            <StudyPlanSection />
            <LearningModeSection />
            <ActiveSessionSection />
            <QuickActionsBar />
        </>
    );
};

export default DashboardPage;

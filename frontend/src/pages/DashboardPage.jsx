import React from 'react';
import GreetingSection from '../sections/GreetingSection';
import StudyPlanSection from '../sections/StudyPlanSection';
import StudyCalendar from '../components/StudyCalendar';
import LearningModeSection from '../sections/LearningModeSection';
import ActiveSessionSection from '../sections/ActiveSessionSection';
import QuickActionsBar from '../sections/QuickActionsBar';

const DashboardPage = () => {
    // Mock schedule data - replace with actual data from context/API
    const mockSchedule = {
        syllabus: {
            subject: 'Biology',
            startDate: '2026-01-20',
            endDate: '2026-04-20'
        },
        schedule: [
            {
                date: '2026-01-21',
                day: 1,
                topics: ['Cell Structure', 'Cell Membrane'],
                topicCount: 2,
                units: ['Unit 1: Cell Biology']
            },
            {
                date: '2026-01-22',
                day: 2,
                topics: ['Mitochondria', 'Nucleus'],
                topicCount: 2,
                units: ['Unit 1: Cell Biology']
            },
            {
                date: '2026-01-23',
                day: 3,
                topics: ['DNA Structure', 'RNA Types'],
                topicCount: 2,
                units: ['Unit 2: Genetics']
            }
        ]
    };

    return (
        <>
            <GreetingSection />
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: '1' }}>
                    <StudyPlanSection />
                </div>
                <div style={{ width: '350px' }}>
                    <StudyCalendar dailySchedule={mockSchedule} />
                </div>
            </div>
            <LearningModeSection />
            <ActiveSessionSection />
            <QuickActionsBar />
        </>
    );
};

export default DashboardPage;

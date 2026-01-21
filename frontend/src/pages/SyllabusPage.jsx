import React from 'react';
import SyllabusIngestion from '../components/SyllabusIngestion';
import { useAuth } from '../context/AuthContext';
import AllSchedulesView from '../components/AllSchedulesView';

const SyllabusPage = () => {
    const { currentUser } = useAuth();
    return (
        <div className="syllabus-page">
            <SyllabusIngestion />
            {/* Show all confirmed schedules below the ingestion form */}
            {currentUser && <AllSchedulesView userId={currentUser.uid} />}
        </div>
    );
};

export default SyllabusPage;

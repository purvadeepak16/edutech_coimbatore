import React from 'react';
import SyllabusIngestionSection from '../sections/SyllabusIngestionSection';

const SyllabusPage = () => {
    return (
        <div className="syllabus-page">
            <div className="page-header">
                <h1>📚 Syllabus Ingestion</h1>
                <p>Upload and organize your course materials</p>
            </div>
            <SyllabusIngestionSection />
        </div>
    );
};

export default SyllabusPage;

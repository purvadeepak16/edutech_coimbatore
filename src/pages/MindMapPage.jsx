import React from 'react';
import KnowledgeGraphSection from '../sections/KnowledgeGraphSection';

const MindMapPage = () => {
    return (
        <div className="mindmap-page">
            <div className="page-header">
                <h1>🧠 Knowledge Mind Map</h1>
                <p>Visualize your learning journey and topic dependencies</p>
            </div>
            <KnowledgeGraphSection />
        </div>
    );
};

export default MindMapPage;

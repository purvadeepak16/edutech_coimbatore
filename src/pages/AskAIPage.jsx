import React from 'react';
import AIDoubtSolverSection from '../sections/AIDoubtSolverSection';

const AskAIPage = () => {
    return (
        <div className="ask-ai-page">
            <div className="page-header">
                <h1>✨ Ask AI</h1>
                <p>Get instant, context-aware answers to all your doubts</p>
            </div>
            <AIDoubtSolverSection />
        </div>
    );
};

export default AskAIPage;

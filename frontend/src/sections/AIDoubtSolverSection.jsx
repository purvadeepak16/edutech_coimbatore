import React, { useState } from 'react';
import { Lightbulb, Send, Clock, ThumbsUp, ArrowRight } from 'lucide-react';
import aiRobotImg from '../assets/ai-robot.png';
import './AIDoubtSolverSection.css';

const DoubtItem = ({ question, time, confidence, isLast }) => (
    <div className={`doubt-item ${isLast ? 'last' : ''}`}>
        <div className="doubt-content">
            <p className="doubt-question">"{question}"</p>
            <div className="doubt-meta">
                <span className="meta-time">
                    <Clock size={12} /> {time}
                </span>
                <span className="meta-confidence">
                    <ThumbsUp size={12} /> +{confidence}% confid.
                </span>
            </div>
        </div>
    </div>
);

const AIDoubtSolverSection = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState(null);
    const [error, setError] = useState(null);

    const onSend = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setAnswer(null);
        setError(null);
        try {
            const { askOpenRouter } = await import('../services/aiApi');
            const res = await askOpenRouter(query);
            if (res?.answer) setAnswer(res.answer);
            else if (res?.raw) setAnswer(JSON.stringify(res.raw));
            else setError('No response from AI');
        } catch (err) {
            setError(err?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <section className="ai-doubt-section">
            {/* Animated Robot Mascot */}
            <div className="ai-robot-mascot">
                <img src={aiRobotImg} alt="AI Assistant" className="robot-image" />
                <div className="robot-speech-bubble">
                    <p>Ask me anything! 🤖</p>
                </div>
            </div>

            <div className="doubt-card">
                <div className="card-header">
                    <div className="icon-wrapper">
                        <Lightbulb size={24} color="var(--color-white)" fill="var(--color-white)" />
                    </div>
                    <h3>Ask AI Your Doubts</h3>
                </div>

                <div className="input-container">
                    <input
                        type="text"
                        placeholder="What's confusing you?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <button className="send-btn" onClick={onSend} disabled={loading}>
                        {loading ? 'Thinking...' : <Send size={18} />}
                    </button>
                </div>

                <div className="ai-response">
                    {error && <div className="ai-error">Error: {error}</div>}
                    {answer && (
                        <div className="ai-answer">
                            <h4>AI Answer</h4>
                            <div className="ai-answer-text">{answer}</div>
                        </div>
                    )}
                </div>

                <div className="recent-questions">
                    <h4>Recent Questions:</h4>
                    <div className="questions-list">
                        <DoubtItem
                            question="Why photosynthesis needs sun?"
                            time="Answered 2h ago"
                            confidence="12"
                        />
                        <DoubtItem
                            question="Mitochondria structure?"
                            time="Answered 5h ago"
                            confidence="8"
                        />
                        <DoubtItem
                            question="Cell membrane function?"
                            time="Answered yesterday"
                            confidence="15"
                            isLast={true}
                        />
                    </div>
                </div>

                <button className="view-all-btn">
                    View All Doubts <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
};

export default AIDoubtSolverSection;

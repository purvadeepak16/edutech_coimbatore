import React, { useState } from 'react';
import { Calendar, Target, Brain, ArrowRight, Zap } from 'lucide-react';
import './ExamCountdownSection.css';

const ExamCountdownSection = () => {
    // Toggle for demonstration
    const [isUrgent] = useState(false);

    return (
        <section className={`exam-countdown-section ${isUrgent ? 'urgent' : 'normal'}`}>
            {isUrgent ? (
                <div className="countdown-content">
                    <div className="urgent-header">
                        <div className="urgent-icon">
                            <Zap size={24} color="var(--color-danger)" />
                        </div>
                        <h3>FINAL STRETCH: 7 days</h3>
                    </div>

                    <div className="urgent-features">
                        <div className="u-feature">🧠 Mock Tests Ready</div>
                        <div className="u-feature">💤 Sleep Tracking Enabled</div>
                        <div className="u-feature">🎯 High-ROI Topics Focus</div>
                    </div>

                    <div className="countdown-actions">
                        <button className="btn-urgent-primary">View Mocks</button>
                        <button className="btn-urgent-secondary">Stress Tools</button>
                    </div>
                </div>
            ) : (
                <div className="countdown-content">
                    <div className="normal-header">
                        <div className="header-left">
                            <Calendar size={20} className="header-icon" />
                            <h3>Biology Exam: 45 days</h3>
                        </div>
                        <div className="status-pill">
                            🎯 Status: On Track ✓
                        </div>
                    </div>

                    <div className="exam-progress">
                        <div className="progress-label-row">
                            <span>Coverage</span>
                            <span>35%</span>
                        </div>
                        <div className="ep-bar-bg">
                            <div className="ep-bar-fill" style={{ width: '35%' }}></div>
                        </div>
                        <div className="topics-count">Topics: 35/100 completed</div>
                    </div>

                    <div className="countdown-actions">
                        <button className="btn-normal-primary">View Strategy</button>
                        <button className="btn-normal-secondary">Schedule</button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ExamCountdownSection;

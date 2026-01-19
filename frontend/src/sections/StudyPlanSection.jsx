import React from 'react';
import { Headphones, BookOpen, FileText, ChevronRight, Clock } from 'lucide-react';
import './StudyPlanSection.css';

const TimelineItem = ({ time, icon: Icon, title, subtitle, duration, progress, status, color, isLast }) => (
    <div className="timeline-item">
        <div className="time-column">
            <span className="time-label">{time}</span>
            {!isLast && <div className="time-line"></div>}
        </div>

        <div className="task-card" style={{ backgroundColor: color }}>
            <div className="task-header">
                <div className="task-info">
                    <div className="task-icon">
                        <Icon size={20} color="var(--color-navy)" />
                    </div>
                    <div>
                        <h3>{title}</h3>
                        <span className="task-subtitle">{subtitle}</span>
                    </div>
                </div>
                <div className="task-duration">
                    <Clock size={14} />
                    <span>{duration}</span>
                </div>
            </div>

            {progress !== undefined && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <div className="task-actions">
                {status === 'Pending' ? (
                    <span className="status-pending">⏳ Pending</span>
                ) : (
                    <span className="progress-text">{progress}% Completed</span>
                )}
                <div className="action-buttons">
                    <button className="btn-start">Start</button>
                    <button className="btn-secondary">Reschedule</button>
                </div>
            </div>
        </div>
    </div>
);

const StudyPlanSection = () => {
    return (
        <section className="study-plan-section">
            <div className="section-header">
                <div>
                    <h2>📅 Today's Plan</h2>
                    <p>You're on track! 4 hours remaining</p>
                </div>
                <div className="status-badge">
                    🟢 Well Balanced
                </div>
            </div>

            <div className="timeline">
                <TimelineItem
                    time="2:00 PM"
                    icon={Headphones}
                    title="Audio Learning"
                    subtitle="Biology - Chapter 5: Cells"
                    duration="1.5 hours"
                    progress={45}
                    color="var(--color-soft-pink-light)"
                />
                <TimelineItem
                    time="3:30 PM"
                    icon={BookOpen}
                    title="Reading Notes"
                    subtitle="Chemistry - Bonding"
                    duration="1 hour"
                    progress={0}
                    color="var(--color-soft-blue-light)"
                />
                <TimelineItem
                    time="4:30 PM"
                    icon={FileText}
                    title="Assessment"
                    subtitle="Biology Ch. 5 - Basic Test"
                    duration="30 min"
                    status="Pending"
                    color="var(--color-cream)"
                    isLast={true}
                />
            </div>

            <button className="view-full-week">
                View full week schedule <ChevronRight size={16} />
            </button>
        </section>
    );
};

export default StudyPlanSection;

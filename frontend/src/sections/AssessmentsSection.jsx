import React from 'react';
import { FileText, Brain, Target, Calendar, BarChart2 } from 'lucide-react';
import './AssessmentsSection.css';

const TestCard = ({
    title,
    status,
    icon: Icon,
    questions,
    time,
    passScore,
    requirement,
    progress,
    color,
    isLocked
}) => {
    return (
        <div className={`test-card ${isLocked ? 'locked' : ''}`}>
            <div className="test-header">
                <div className={`icon-circle ${isLocked ? 'gray' : ''}`} style={!isLocked ? { borderColor: color } : {}}>
                    <Icon size={20} color={isLocked ? 'var(--color-gray-light)' : color} />
                </div>
                <div className="status-chip" style={!isLocked ? { borderColor: color } : {}}>
                    {isLocked ? '🔒 Locked' : '✓ Available'}
                </div>
            </div>

            <h3 className="test-title">{title}</h3>

            {isLocked ? (
                <div className="locked-details">
                    <p className="requirement">{requirement}</p>
                    <div className="progress-mini">
                        <span className="topics-badge">{progress}</span>
                    </div>
                    <button className="test-btn locked">
                        {status === 'Coming Soon' ? 'Coming Soon' : 'Unlock Soon'}
                    </button>
                </div>
            ) : (
                <div className="active-details">
                    <div className="test-meta">
                        <span>{questions} Questions</span> • <span>{time}</span>
                    </div>
                    <div className="pass-score">Pass: {passScore}</div>
                    <button className="test-btn primary" style={{ backgroundColor: color }}>
                        Start Test
                    </button>
                </div>
            )}
        </div>
    );
};

const AssessmentsSection = () => {
    return (
        <section className="assessments-section">
            <h2 className="section-title">Tests Unlock as You Master</h2>

            <div className="tests-grid">
                <TestCard
                    title="Basic Test"
                    icon={FileText}
                    status="Available"
                    questions="10"
                    time="15 min"
                    passScore="70%+"
                    color="var(--color-soft-teal)" // Using teal as light green replacement for harmony
                />
                <TestCard
                    title="Advanced Test"
                    icon={Brain}
                    status="Locked"
                    requirement="Complete Basic 70%+"
                    progress="1/1 ✓"
                    color="var(--color-soft-yellow)" // Amber equivalent
                    isLocked={true}
                />
                <TestCard
                    title="Scenario Test"
                    icon={Target}
                    status="Coming Soon"
                    requirement="Complete Advanced 75%+"
                    progress="0/1"
                    color="var(--color-soft-pink-light)" // Red-ish equivalent
                    isLocked={true}
                />
            </div>

            <div className="results-table-container">
                <h3>Last 3 Results</h3>
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Topic</th>
                            <th>Score</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Today, 10:30 AM</td>
                            <td>Bio: Cell Structure</td>
                            <td className="score-cell">85%</td>
                            <td>12m</td>
                            <td><span className="sc-status pass">Passed</span></td>
                        </tr>
                        <tr>
                            <td>Yesterday</td>
                            <td>Chem: Bonding</td>
                            <td className="score-cell">62%</td>
                            <td>14m</td>
                            <td><span className="sc-status fail">Review</span></td>
                        </tr>
                        <tr>
                            <td>Jan 12</td>
                            <td>Physics: Mechanics</td>
                            <td className="score-cell">90%</td>
                            <td>15m</td>
                            <td><span className="sc-status pass">Passed</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AssessmentsSection;

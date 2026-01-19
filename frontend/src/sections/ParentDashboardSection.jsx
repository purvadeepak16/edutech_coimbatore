import React from 'react';
import { LineChart, Share2, Download, AlertTriangle, TrendingUp } from 'lucide-react';
import './ParentDashboardSection.css';

const ParentDashboardSection = () => {
    return (
        <section className="parent-dashboard-section" id="parent-view">
            <div className="section-header">
                <h2>👨‍👩‍👧 Parent / Guardian View</h2>
                <div className="header-actions">
                    <button className="btn-share"><Share2 size={16} /> Share Access</button>
                    <button className="btn-download"><Download size={16} /> Weekly Report</button>
                </div>
            </div>

            <div className="parent-grid">
                <div className="report-card summary-card">
                    <h3>Weekly Summary</h3>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="label">Study Hours</span>
                            <span className="value">32h</span>
                            <span className="trend positive">↑ 12%</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Focus Score</span>
                            <span className="value">8.5/10</span>
                            <span className="trend positive">↑ 0.5</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Tests Taken</span>
                            <span className="value">5</span>
                            <span className="trend neutral">-</span>
                        </div>
                    </div>
                </div>

                <div className="report-card weak-areas-card">
                    <h3><AlertTriangle size={18} className="alert-icon" /> Focus Areas</h3>
                    <ul className="weak-topics-list">
                        <li>
                            <span className="topic">Organic Chemistry</span>
                            <span className="score low">42% Mastery</span>
                        </li>
                        <li>
                            <span className="topic">Calculus - Integration</span>
                            <span className="score medium">55% Mastery</span>
                        </li>
                    </ul>
                    <p className="recommendation">Recommendation: Extra 2 hours scheduled for Chem this weekend.</p>
                </div>

                <div className="report-card trend-card">
                    <h3><TrendingUp size={18} /> Improvement Trend</h3>
                    <div className="mock-chart">
                        {/* CSS-only simple chart representation */}
                        <div className="bar" style={{ height: '40%' }} title="Week 1"></div>
                        <div className="bar" style={{ height: '55%' }} title="Week 2"></div>
                        <div className="bar" style={{ height: '45%' }} title="Week 3"></div>
                        <div className="bar" style={{ height: '70%' }} title="Week 4"></div>
                        <div className="bar active" style={{ height: '82%' }} title="Current"></div>
                    </div>
                    <p className="chart-label">Consistently improving over last 5 weeks.</p>
                </div>
            </div>
        </section>
    );
};

export default ParentDashboardSection;

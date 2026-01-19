import React from 'react';
import { Target, TrendingUp, Clock, Zap, AlertTriangle } from 'lucide-react';
import './CMSSection.css';

const MetricCard = ({ title, value, subvalue, color, icon: Icon, description }) => (
    <div className="metric-card" style={{ backgroundColor: color }}>
        <div className="metric-header">
            <span className="metric-title">{title}</span>
            <Icon size={16} color="var(--color-navy)" opacity={0.6} />
        </div>
        <div className="metric-value">{value}</div>
        {subvalue && <div className="metric-subvalue">{subvalue}</div>}
        <div className="metric-desc">{description}</div>
    </div>
);

const CMSSection = () => {
    return (
        <section className="cms-section">
            <div className="cms-main-display">
                <div className="circular-chart">
                    <svg viewBox="0 0 36 36" className="circular-chart-svg">
                        <path className="circle-bg"
                            d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className="circle"
                            strokeDasharray="78, 100"
                            d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="percentage">
                        <span className="score">78%</span>
                        <span className="label">Mastery Score</span>
                    </div>
                </div>

                <div className="chart-stats">
                    <div className="trend positive">
                        <TrendingUp size={16} /> +5% today
                    </div>
                    <div className="next-goal">
                        Next: 80% (78/80)
                    </div>
                </div>
            </div>

            <div className="metrics-grid">
                <MetricCard
                    title="Understanding"
                    value="78%"
                    description="Based on 15 attempts"
                    color="var(--color-soft-pink-light)"
                    icon={Target}
                />
                <MetricCard
                    title="Confidence"
                    value="HIGH 🔥"
                    description="Quick & correct answers"
                    color="var(--color-soft-teal)"
                    icon={Zap}
                />
                <MetricCard
                    title="Time Spent"
                    value="4.5 hrs"
                    description="Over 7 days"
                    color="var(--color-soft-yellow)"
                    icon={Clock}
                />
                <MetricCard
                    title="Efficiency"
                    value="2.3% /hr"
                    description="VS avg: 1.8%"
                    color="var(--color-soft-purple)"
                    icon={TrendingUp}
                />
            </div>

            <div className="ai-recommendation">
                <div className="rec-icon">
                    <AlertTriangle size={20} color="var(--color-warning)" />
                </div>
                <p><strong>Recommendation:</strong> Try visual mode for Mitochondria structure to improve retention.</p>
            </div>
        </section>
    );
};

export default CMSSection;

import React from 'react';
import { Flame, TrendingUp, Clock, Brain } from 'lucide-react';
import './GreetingSection.css';

const StatCard = ({ icon: Icon, image, value, label, color, accentColor, blobColor }) => (
    <div className="stat-card">
        <div className="stat-icon-wrapper" style={{ backgroundColor: color }}>
            <div className="stat-blob" style={{ backgroundColor: blobColor }}></div>
            {image ? (
                <img src={image} alt={label} className="stat-illustration" />
            ) : (
                <Icon className="stat-icon" />
            )}
        </div>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    </div>
);

const GreetingSection = () => {
    return (
        <section className="greeting-section">
            <div className="greeting-header">
                <h1>Hey Monark! 👋</h1>
                <p>"Let's have a great study session"</p>
            </div>

            <div className="stats-grid">
                <StatCard
                    icon={Flame}
                    value="17 days"
                    label="Streak"
                    color="#FFE4E6"
                    blobColor="#FECDD3"
                />
                <StatCard
                    icon={TrendingUp}
                    value="35%"
                    label="Progress"
                    color="#DBEAFE"
                    blobColor="#BFDBFE"
                />
                <StatCard
                    icon={Clock}
                    value="2.5 hr"
                    label="Today"
                    color="#FEF3C7"
                    blobColor="#FDE68A"
                />
                <StatCard
                    icon={Brain}
                    value="78%"
                    label="Mastery"
                    color="#F3E8FF"
                    blobColor="#E9D5FF"
                />
            </div>
        </section>
    );
};

export default GreetingSection;

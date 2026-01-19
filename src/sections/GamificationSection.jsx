import React from 'react';
import { Flame, Trophy, Rocket, Star } from 'lucide-react';
import './GamificationSection.css';

const BadgeCard = ({ title, subtitle, footer, icon: Icon, isLocked, progress }) => (
    <div className={`badge-card ${isLocked ? 'locked' : 'unlocked'}`}>
        <div className="badge-icon-wrapper">
            <Icon size={24} color={isLocked ? 'var(--color-gray-light)' : 'var(--color-warning)'} />
        </div>
        <div className="badge-content">
            <h4>{title}</h4>
            <div className="badge-details">
                <p>{subtitle}</p>
                <span className="badge-footer">{footer}</span>
            </div>
        </div>
    </div>
);

const GamificationSection = () => {
    return (
        <section className="gamification-section">
            <div className="streak-display">
                <div className="streak-icon-large">
                    <Flame size={48} fill="#F59E0B" color="#F59E0B" />
                </div>
                <div className="streak-info">
                    <h2>17 DAYS</h2>
                    <span className="streak-label">CURRENT STREAK</span>
                    <p className="streak-msg">You're on fire! 💪</p>
                </div>
            </div>

            <div className="badges-grid">
                <BadgeCard
                    title="Consistency Champ"
                    subtitle="Unlocked 18d ago"
                    footer="30-day streak"
                    icon={Trophy}
                />
                <BadgeCard
                    title="Speed Learner"
                    subtitle="3/5 topics"
                    footer="2 more to unlock"
                    icon={Rocket}
                    isLocked={true}
                />
                <BadgeCard
                    title="Scholar"
                    subtitle="Week 23: +15 pts"
                    footer="60% Progress"
                    icon={Star}
                    isLocked={true}
                />
            </div>

            <div className="weekly-progress">
                <div className="wp-header">
                    <span>Weekly Achievement</span>
                    <span>60%</span>
                </div>
                <div className="wp-bar-bg">
                    <div className="wp-bar-fill" style={{ width: '60%' }}></div>
                </div>
            </div>
        </section>
    );
};

export default GamificationSection;

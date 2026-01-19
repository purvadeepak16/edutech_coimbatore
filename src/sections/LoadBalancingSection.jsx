import React from 'react';
import { Calendar, AlertTriangle, Check } from 'lucide-react';
import './LoadBalancingSection.css';

const DayColumn = ({ day, hours, intensity, isToday }) => {
    const getHeight = (h) => Math.min(h * 20, 100); // 5 hours max visual

    const getColor = (i) => {
        if (i === 'high') return 'var(--color-danger)'; // Red dot
        if (i === 'med') return 'var(--color-warning)'; // Yellow dot
        return 'var(--color-success)'; // Green dot
    };

    return (
        <div className={`day-column ${isToday ? 'today' : ''}`}>
            <div className="day-hours">{hours > 0 ? hours : '-'}</div>
            <div className="bar-container">
                <div className="bar" style={{ height: `${getHeight(hours)}px` }}></div>
            </div>
            <div className="intensity-dot" style={{ backgroundColor: getColor(intensity) }}></div>
            <div className="day-label">{day}</div>
        </div>
    );
};

const LoadBalancingSection = () => {
    return (
        <section className="load-balancing-section">
            <div className="balancer-header">
                <div className="status-summary">
                    <h3>This week: 22 hours | Your availability: 20 hours</h3>
                    <div className="status-badge-lb">
                        ✓ Well Balanced (91%)
                    </div>
                </div>
            </div>

            <div className="weekly-calendar">
                <DayColumn day="Mon" hours={4.5} intensity="low" />
                <DayColumn day="Tue" hours={3.8} intensity="low" />
                <DayColumn day="Wed" hours={4.2} intensity="low" />
                <DayColumn day="Thu" hours={4.0} intensity="low" isToday={true} />
                <DayColumn day="Fri" hours={5.1} intensity="med" />
                <DayColumn day="Sat" hours={0} intensity="low" />
                <DayColumn day="Sun" hours={0} intensity="low" />
            </div>

            <div className="smart-alert">
                <div className="alert-content">
                    <AlertTriangle size={20} color="var(--color-navy)" />
                    <span>Tomorrow is tight. Move Chemistry to Thursday?</span>
                </div>
                <div className="alert-actions">
                    <button className="btn-accept">Accept</button>
                    <button className="btn-customize">Customize</button>
                </div>
            </div>
        </section>
    );
};

export default LoadBalancingSection;

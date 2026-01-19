import React from 'react';
import { Heart, Moon, Coffee, MessageCircle } from 'lucide-react';
import './WellnessSection.css';

const WellnessSection = () => {
    // Simulating "Healthy" state for now as per "Green" requirement in some parts, 
    // but let's make it conditionally renderable or just show the "Healthy" state as default happy path.
    // The Prompt asks for "If Healthy" logic display.
    const isHealthy = true;

    return (
        <section className={`wellness-section ${isHealthy ? 'healthy' : 'at-risk'}`}>
            <div className="wellness-header">
                <div className="icon-box">
                    <Heart size={24} color={isHealthy ? 'var(--color-success)' : 'var(--color-danger)'} fill={isHealthy ? 'var(--color-success)' : 'var(--color-danger)'} />
                </div>
                <div className="wellness-status">
                    <h3>{isHealthy ? "You're In Great Shape!" : "We Noticed Some Signs"}</h3>
                    <div className="wellness-metrics">
                        <span>Sleep: 8h</span> • <span>Study: 4h</span> • <span>Break: 2h</span>
                    </div>
                </div>
            </div>

            <div className="wellness-message">
                {isHealthy
                    ? "All green—keep it up! 😊"
                    : "Late-night studying • Accuracy dipping. Your wellbeing matters most."
                }
            </div>

            {!isHealthy && (
                <div className="wellness-actions">
                    <button className="action-btn">
                        <Coffee size={16} /> Take a Break
                    </button>
                    <button className="action-btn">
                        <Moon size={16} /> Lighter Day
                    </button>
                    <button className="action-btn">
                        <MessageCircle size={16} /> Connect
                    </button>
                </div>
            )}
        </section>
    );
};

export default WellnessSection;

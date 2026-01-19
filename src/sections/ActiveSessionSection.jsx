import React from 'react';
import { Play, SkipForward, Volume2, HelpCircle } from 'lucide-react';
import './ActiveSessionSection.css';

const ActiveSessionSection = () => {
    return (
        <section className="active-session-section">
            <h2 className="section-title">Now Learning</h2>

            <div className="session-card">
                <div className="session-header">
                    <div className="icon-badge">🎧</div>
                    <div>
                        <h3>Chapter 5: Photosynthesis</h3>
                        <span className="subtitle">Biology • Audio Mode</span>
                    </div>
                </div>

                <div className="audio-player">
                    <button className="play-btn">
                        <Play size={24} fill="currentColor" />
                    </button>

                    <div className="waveform-container">
                        {/* Simulated Waveform Bars */}
                        <div className="waveform">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="bar" style={{ height: `${Math.random() * 20 + 10}px` }}></div>
                            ))}
                        </div>
                        <div className="time-display">1:23 / 4:56</div>
                    </div>

                    <div className="player-controls">
                        <span className="speed-control">1.0x</span>
                        <Volume2 size={20} />
                    </div>
                </div>

                <div className="progress-container">
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: '72%' }}></div>
                    </div>
                    <span className="progress-label">72% Completed</span>
                </div>

                <div className="checkpoint-card">
                    <div className="checkpoint-header">
                        <HelpCircle size={16} />
                        <span>Quick Checkpoint</span>
                    </div>
                    <p className="question">"What are 3 products of photosynthesis?"</p>

                    <div className="options">
                        <button className="option">Glucose, oxygen, water</button>
                        <button className="option">CO2, hydrogen, glucose</button>
                        <button className="option">Glucose, nitrogen, oxygen</button>
                    </div>
                </div>

                <div className="session-actions">
                    <button className="mark-complete-btn">Mark Complete</button>
                    <button className="ask-ai-btn">Ask AI</button>
                </div>
            </div>
        </section>
    );
};

export default ActiveSessionSection;

import React from 'react';
import { Headphones, Eye, BookOpen, Podcast, Hash, Book } from 'lucide-react';
import './LearningModeSection.css';

const LearningCard = ({
    icon: Icon,
    title,
    subtitle,
    topics,
    buttonText,
    color,
    illustration: Illustration
}) => (
    <div className="learning-card">
        <div className="card-top">
            <div className="card-icon-wrapper" style={{ borderColor: color }}>
                <Icon size={24} color={color} />
            </div>
            <div className="illustration-wrapper">
                {Illustration && <Illustration size={64} style={{ opacity: 0.05, color: 'var(--color-navy)' }} />}
            </div>
        </div>

        <div className="card-content">
            <h3>{title}</h3>
            <p>{subtitle}</p>
            <div className="topics-badge" style={{ backgroundColor: color + '20' }}>{topics}</div>
        </div>

        <button className="start-btn" style={{ backgroundColor: color }}>
            {buttonText}
        </button>
    </div>
);

const LearningModeSection = () => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(83); // 1:23
    const [duration] = React.useState(276); // 4:56
    const [playbackSpeed, setPlaybackSpeed] = React.useState(1.0);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const cyclePlaybackSpeed = () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        setPlaybackSpeed(speeds[nextIndex]);
    };

    const progress = (currentTime / duration) * 100;

    return (
        <section className="learning-mode-section">
            <h2 className="section-title">How Would You Like to Learn Today?</h2>

            <div className="modes-grid">
                <LearningCard
                    icon={Headphones}
                    title="Listen & Learn"
                    subtitle="Perfect for commute"
                    topics="3 topics ready"
                    buttonText="Start Session"
                    color="var(--color-soft-pink)"
                    illustration={Podcast}
                />
                <LearningCard
                    icon={Eye}
                    title="See & Understand"
                    subtitle="Mind maps, diagrams"
                    topics="5 topics ready"
                    buttonText="Open Maps"
                    color="var(--color-soft-teal)"
                    illustration={Hash}
                />
                <LearningCard
                    icon={BookOpen}
                    title="Read & Master"
                    subtitle="Structured notes"
                    topics="4 topics ready"
                    buttonText="Start Reading"
                    color="var(--color-soft-yellow)"
                    illustration={Book}
                />
            </div>

            {/* Now Learning Section */}
            <div className="now-learning-section">
                <h2 className="section-title">Now Learning</h2>

                <div className="now-learning-card">
                    <div className="learning-header">
                        <div className="chapter-icon-simple"></div>
                        <div className="chapter-info">
                            <h3>Chapter 5: Photosynthesis</h3>
                            <p className="chapter-meta">Biology • Audio Mode</p>
                        </div>
                    </div>

                    <div className="audio-player-row">
                        <button className="play-button-circle" onClick={togglePlayPause}>
                            {isPlaying ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                            )}
                        </button>

                        <div className="player-main">
                            <div className="time-display-row">1:23 / 4:36</div>
                            <div className="progress-track-wrapper">
                                <div className="progress-track">
                                    <div className="progress-fill-active" style={{ width: '35%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="player-actions">
                            <button className="speed-btn-label">1x</button>
                            <button className="vol-btn-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="total-progress-row">
                        <div className="progress-bar-container-main">
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill-navy" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                        <span className="progress-percent">72% Completed</span>
                    </div>

                    <div className="checkpoint-footer">
                        <div className="checkpoint-label">
                            <span className="info-circle-icon">ⓘ</span>
                            <span>Quick Checkpoint</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LearningModeSection;

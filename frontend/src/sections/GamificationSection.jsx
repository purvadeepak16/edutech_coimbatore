import React, { useEffect, useRef, useState } from 'react';
import { Star, Trophy } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import GamesGrid from '../components/GamesGrid';
import './GamificationSection.css';

const STORAGE_KEY = 'gamification_elapsed_seconds';
const LAST_PLAY_END_KEY = 'gamification_last_play_end';

const GamificationSection = () => {
    // TODO: Replace with actual user progress from context/API
    const userProgress = {
        'zombie-survival': { unlocked: true, progress: null, completed: false },
        'memory-card': { unlocked: true, progress: null, completed: false },
        'whack-a-mole': { unlocked: true, progress: null, completed: false },
    };

    const location = useLocation();
    const [elapsed, setElapsed] = useState(() => {
        const v = localStorage.getItem(STORAGE_KEY);
        return v ? Number(v) : 0;
    });

    const [showInfoModal, setShowInfoModal] = useState(true);
    const [isPlayBlocked, setIsPlayBlocked] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const unblockTimeoutRef = useRef(null);

    const intervalRef = useRef(null);
    const runningRef = useRef(false);

    // Ensure only one active timer across the page
    const ensureSingleTimer = (start) => {
        // clear any global interval if present
        if (window.__gamificationInterval && window.__gamificationInterval !== intervalRef.current) {
            clearInterval(window.__gamificationInterval);
            window.__gamificationInterval = null;
            window.__gamificationRunning = false;
        }
        if (start) {
            window.__gamificationRunning = true;
        } else {
            window.__gamificationRunning = false;
        }
    };

    const startTimer = () => {
        if (runningRef.current) return;
        // only start if this route is active /gamification
        if (!location.pathname.startsWith('/gamification')) return;

        ensureSingleTimer(true);

        runningRef.current = true;
        intervalRef.current = setInterval(() => {
            setElapsed((e) => {
                const next = e + 1;
                try { localStorage.setItem(STORAGE_KEY, String(next)); } catch (err) {}
                return next;
            });
        }, 1000);

        // expose global reference so other instances know about it
        window.__gamificationInterval = intervalRef.current;
    };

    const stopTimer = () => {
        if (!runningRef.current && !window.__gamificationRunning) return;
        runningRef.current = false;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            if (window.__gamificationInterval === intervalRef.current) window.__gamificationInterval = null;
            intervalRef.current = null;
        }
        ensureSingleTimer(false);
    };

    const enableBlockingFor24h = () => {
        const now = Date.now();
        try { localStorage.setItem(LAST_PLAY_END_KEY, String(now)); } catch (err) {}
        setIsPlayBlocked(true);
        setShowBlockedModal(true);

        // schedule unblock after 24h
        const ms24h = 24 * 60 * 60 * 1000;
        if (unblockTimeoutRef.current) clearTimeout(unblockTimeoutRef.current);
        unblockTimeoutRef.current = setTimeout(() => {
            try { localStorage.removeItem(LAST_PLAY_END_KEY); } catch (err) {}
            setIsPlayBlocked(false);
            setShowBlockedModal(false);
            // reset elapsed so user gets fresh 10 minutes next time
            setElapsed(0);
            try { localStorage.setItem(STORAGE_KEY, '0'); } catch (err) {}
        }, ms24h);
    };

    // start timer when this component mounts (popup/page opens)
    useEffect(() => {
        startTimer();

        return () => {
            // keep elapsed persisted, but stop running when unmounting
            stopTimer();
            if (unblockTimeoutRef.current) clearTimeout(unblockTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pause timer when route changes away from gamification
    useEffect(() => {
        if (!location.pathname.startsWith('/gamification')) {
            stopTimer();
        } else {
            // when navigating back to gamification, resume
            startTimer();

            // when entering /gamification check 24h lock
            const v = localStorage.getItem(LAST_PLAY_END_KEY);
            if (v) {
                const lastEnd = Number(v);
                const ms24h = 24 * 60 * 60 * 1000;
                const diff = Date.now() - lastEnd;
                if (diff < ms24h) {
                    setIsPlayBlocked(true);
                    setShowBlockedModal(true);
                    // schedule remaining unblock
                    const remaining = ms24h - diff;
                    if (unblockTimeoutRef.current) clearTimeout(unblockTimeoutRef.current);
                    unblockTimeoutRef.current = setTimeout(() => {
                        try { localStorage.removeItem(LAST_PLAY_END_KEY); } catch (err) {}
                        setIsPlayBlocked(false);
                        setShowBlockedModal(false);
                        setElapsed(0);
                        try { localStorage.setItem(STORAGE_KEY, '0'); } catch (err) {}
                    }, remaining);
                } else {
                    try { localStorage.removeItem(LAST_PLAY_END_KEY); } catch (err) {}
                    setIsPlayBlocked(false);
                    setShowBlockedModal(false);
                }
            } else {
                // ensure info modal appears when entering
                setShowInfoModal(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Visibility and focus handling
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                stopTimer();
            } else if (document.visibilityState === 'visible') {
                // only resume if route is gamification
                if (location.pathname.startsWith('/gamification')) startTimer();
            }
        };

        const handleBlur = () => stopTimer();
        const handleFocus = () => {
            if (location.pathname.startsWith('/gamification')) startTimer();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // expose elapsed in UI for debugging / display
    const formatElapsed = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <section className="gamification-container">
            <div className="stats-row">
                <div className="stat-summary-card">
                    <div className="stat-icon-circle">
                        <Star fill="var(--color-warning)" color="var(--color-warning)" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Total Points</span>
                        <span className="stat-value">12.4k</span>
                    </div>
                </div>
                <div className="stat-summary-card">
                    <div className="stat-icon-circle">
                        <Trophy color="var(--color-soft-purple)" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">Rank</span>
                        <span className="stat-value">Gold IV</span>
                    </div>
                </div>
                <div className="stat-summary-card">
                    <div className="stat-details">
                        <span className="stat-label">Session Time</span>
                        <span className="stat-value">{formatElapsed(elapsed)}</span>
                    </div>
                </div>
            </div>

            <GamesGrid userProgress={userProgress} isPlayBlocked={isPlayBlocked} />

            {/* Info modal shown when entering gamification */}
            {showInfoModal && !isPlayBlocked && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Play Time Limit</h3>
                            <button className="modal-close" onClick={() => setShowInfoModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>You can play games for only 10 minutes.</p>
                            <p>Time left: {formatElapsed(Math.max(0, 600 - elapsed))}</p>
                        </div>
                        <div className="modal-actions">
                            <div className="modal-actions-right">
                                <button className="btn btn-primary" onClick={() => setShowInfoModal(false)}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Blocking modal shown during 24-hour lock */}
            {showBlockedModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Play Locked</h3>
                        </div>
                        <div className="modal-body">
                            <p>You can play games after 24 hours.</p>
                        </div>
                        <div className="modal-actions">
                            <div className="modal-actions-right">
                                {/* No close button to enforce blocking */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default GamificationSection;

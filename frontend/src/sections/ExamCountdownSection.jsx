import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ExamCountdownSection = ({ startDate, endDate }) => {
    const { currentUser } = useAuth();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date();
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (!start || !end) {
                setStatus('loading');
                return;
            }

            if (now < start) {
                setStatus('not-started');
                return;
            }

            if (now >= end) {
                setStatus('ended');
                return;
            }

            setStatus('active');
            const diff = end - now;
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    useEffect(() => {
        const fetchScheduleDates = async () => {
            if (startDate && endDate) return;
            
            try {
                const response = await fetch(`/api/syllabus/all-schedules/${currentUser?.uid}`);
                const data = await response.json();
                
                if (data.success && data.schedulesBySubject) {
                    const firstSchedule = Object.values(data.schedulesBySubject)[0];
                    if (firstSchedule && firstSchedule.length > 0) {
                        const dates = firstSchedule.map(d => new Date(d.date));
                        const minDate = new Date(Math.min(...dates));
                        const maxDate = new Date(Math.max(...dates));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch schedule dates:', error);
            }
        };

        if (currentUser) {
            fetchScheduleDates();
        }
    }, [currentUser, startDate, endDate]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const numberVariants = {
        initial: { scale: 1 },
        animate: { scale: 1 }
    };

    if (status === 'not-started') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full min-h-[calc(100vh-200px)] bg-gradient-to-br from-amber-50 via-orange-50 to-red-50"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center px-6"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-9xl mb-8"
                    >
                        ⏰
                    </motion.div>
                    <h2 className="text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
                        Countdown Not Started Yet
                    </h2>
                    <p className="text-xl text-gray-600">Your exam preparation begins soon</p>
                </motion.div>
            </motion.div>
        );
    }

    if (status === 'ended') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="flex items-center justify-center h-full min-h-[calc(100vh-200px)] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center px-6"
                >
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-9xl mb-8"
                    >
                        🎯
                    </motion.div>
                    <h2 className="text-7xl font-black text-gray-900 mb-5 tracking-tight">
                        Exam Day!
                    </h2>
                    <p className="text-2xl text-gray-700 font-medium">Best of luck — you've got this! 💪</p>
                </motion.div>
            </motion.div>
        );
    }

    if (status === 'loading' || !timeRemaining) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="text-7xl mb-6"
                    >
                        ⏳
                    </motion.div>
                    <p className="text-xl text-gray-600 font-medium">Loading your countdown...</p>
                </div>
            </div>
        );
    }

    const countdownUnits = [
        { value: timeRemaining.days, label: 'DAYS', bgColor: 'var(--color-soft-pink)', borderColor: 'var(--color-navy)' },
        { value: String(timeRemaining.hours).padStart(2, '0'), label: 'HOURS', bgColor: 'var(--color-soft-blue)', borderColor: 'var(--color-navy)' },
        { value: String(timeRemaining.minutes).padStart(2, '0'), label: 'MINUTES', bgColor: 'var(--color-soft-teal)', borderColor: 'var(--color-navy)' },
        { value: String(timeRemaining.seconds).padStart(2, '0'), label: 'SECONDS', bgColor: 'var(--color-soft-purple)', borderColor: 'var(--color-navy)' }
    ];

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: 'calc(100vh - 180px)',
            padding: '40px 32px',
            backgroundColor: 'var(--color-cream)'
        }}>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ width: '100%', maxWidth: '1400px' }}
            >
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >
                    <h1 style={{ 
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
                        fontWeight: '900', 
                        color: 'var(--color-navy)', 
                        marginBottom: '8px',
                        letterSpacing: '-0.02em'
                    }}>
                        Exam Countdown
                    </h1>
                    <p style={{ 
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)', 
                        color: 'var(--color-gray-text)', 
                        fontWeight: '500' 
                    }}>
                        Stay focused and keep preparing
                    </p>
                </motion.div>

                {/* Countdown Cards - Neo-Brutalism Style */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 'clamp(12px, 3vw, 32px)',
                    marginBottom: '48px'
                }}>
                    {countdownUnits.map((unit, index) => (
                        <motion.div
                            key={unit.label}
                            variants={cardVariants}
                            whileHover={{ 
                                y: -4,
                                boxShadow: '6px 6px 0px var(--color-navy)',
                                transition: { duration: 0.2 }
                            }}
                            style={{
                                backgroundColor: unit.bgColor,
                                border: '2.5px solid var(--color-navy)',
                                borderRadius: 'var(--card-radius)',
                                boxShadow: 'var(--neo-shadow)',
                                padding: 'clamp(24px, 5vw, 64px) clamp(16px, 3vw, 32px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 'clamp(140px, 20vw, 280px)',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            {/* Corner Brackets */}
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                width: 'clamp(12px, 2vw, 20px)',
                                height: 'clamp(12px, 2vw, 20px)',
                                borderLeft: '2px solid var(--color-navy)',
                                borderTop: '2px solid var(--color-navy)',
                                borderRadius: '4px 0 0 0'
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: 'clamp(12px, 2vw, 20px)',
                                height: 'clamp(12px, 2vw, 20px)',
                                borderRight: '2px solid var(--color-navy)',
                                borderTop: '2px solid var(--color-navy)',
                                borderRadius: '0 4px 0 0'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '8px',
                                width: 'clamp(12px, 2vw, 20px)',
                                height: 'clamp(12px, 2vw, 20px)',
                                borderLeft: '2px solid var(--color-navy)',
                                borderBottom: '2px solid var(--color-navy)',
                                borderRadius: '0 0 0 4px'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                width: 'clamp(12px, 2vw, 20px)',
                                height: 'clamp(12px, 2vw, 20px)',
                                borderRight: '2px solid var(--color-navy)',
                                borderBottom: '2px solid var(--color-navy)',
                                borderRadius: '0 0 4px 0'
                            }} />
                            
                            {/* Number */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={unit.value}
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 10, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                                        fontWeight: '900',
                                        color: 'var(--color-navy)',
                                        lineHeight: '1',
                                        marginBottom: 'clamp(8px, 2vw, 16px)',
                                        fontVariantNumeric: 'tabular-nums',
                                        letterSpacing: '-0.05em'
                                    }}
                                >
                                    {unit.value}
                                </motion.div>
                            </AnimatePresence>

                            {/* Label */}
                            <div style={{
                                fontSize: 'clamp(0.625rem, 1.5vw, 1rem)',
                                fontWeight: '800',
                                color: 'var(--color-navy)',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase'
                            }}>
                                {unit.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ textAlign: 'center' }}
                >
                    <motion.p
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            fontSize: 'clamp(1rem, 2.5vw, 1.75rem)',
                            color: 'var(--color-navy)',
                            fontWeight: '700'
                        }}
                    >
                        Every second counts 🚀
                    </motion.p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ExamCountdownSection;

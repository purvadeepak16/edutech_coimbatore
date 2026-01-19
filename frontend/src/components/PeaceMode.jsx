import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Music, Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import './PeaceMode.css';

const affirmations = [
    "You are capable of amazing things 💪",
    "Take it one step at a time 🌟",
    "Your effort matters more than perfection ✨",
    "You're doing better than you think 🌈",
    "Rest is productive too 😌",
    "You deserve this break 🌸",
    "Progress, not perfection 🎯",
    "You've got this! 💫",
    "Believe in yourself 🌺",
    "Every small step counts 🦋",
    "You are enough 💖",
    "Breathe. You're going to be okay 🌿",
];

const breathingPatterns = [
    { name: "Box Breathing", phases: [4, 4, 4, 4], labels: ["Breathe In", "Hold", "Breathe Out", "Hold"] },
    { name: "4-7-8 Technique", phases: [4, 7, 8, 0], labels: ["Breathe In", "Hold", "Breathe Out", ""] },
    { name: "Calm Breathing", phases: [4, 2, 6, 2], labels: ["Breathe In", "Hold", "Breathe Out", "Pause"] },
];

const sounds = [
    {
        id: 'rain',
        name: 'Rain',
        emoji: '🌧️',
        color: 'from-blue-500/20 to-cyan-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
            'https://cdn.pixabay.com/audio/2022/05/13/audio_2985d280d4.mp3'
        ]
    },
    {
        id: 'ocean',
        name: 'Ocean Waves',
        emoji: '🌊',
        color: 'from-teal-500/20 to-blue-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3',
            'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3'
        ]
    },
    {
        id: 'wind',
        name: 'Wind',
        emoji: '🍃',
        color: 'from-green-500/20 to-emerald-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2389/2389-preview.mp3'
        ]
    },
    {
        id: 'birds',
        name: 'Birds',
        emoji: '🐦',
        color: 'from-yellow-500/20 to-orange-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2387/2387-preview.mp3'
        ]
    },
    {
        id: 'fire',
        name: 'Fireplace',
        emoji: '🔥',
        color: 'from-orange-500/20 to-red-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2391/2391-preview.mp3'
        ]
    },
    {
        id: 'nature',
        name: 'Nature',
        emoji: '🌿',
        color: 'from-purple-500/20 to-pink-500/20',
        urls: [
            'https://assets.mixkit.co/active_storage/sfx/2392/2392-preview.mp3'
        ]
    },
];

const PeaceMode = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('breathe');
    const [breathing, setBreathing] = useState(false);
    const [breathPhase, setBreathPhase] = useState(0);
    const [breathCount, setBreathCount] = useState(0);
    const [selectedPattern, setSelectedPattern] = useState(0);
    const [affirmation, setAffirmation] = useState(affirmations[0]);
    const [soundPlaying, setSoundPlaying] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const audioRef = useRef(null);

    const pattern = breathingPatterns[selectedPattern];
    const currentPhase = pattern.phases[breathPhase];
    const currentLabel = pattern.labels[breathPhase];

    useEffect(() => {
        if (breathing && currentPhase > 0) {
            const timer = setTimeout(() => {
                const nextPhase = (breathPhase + 1) % pattern.phases.length;
                setBreathPhase(nextPhase);
                if (nextPhase === 0) setBreathCount(prev => prev + 1);
            }, currentPhase * 1000);
            return () => clearTimeout(timer);
        }
    }, [breathing, breathPhase, currentPhase, pattern.phases.length]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const startBreathing = () => {
        setBreathing(true);
        setBreathPhase(0);
        setBreathCount(0);
    };

    const stopBreathing = () => {
        setBreathing(false);
        setBreathPhase(0);
    };

    const getNewAffirmation = () => {
        const newAff = affirmations[Math.floor(Math.random() * affirmations.length)];
        setAffirmation(newAff);
    };

    const tryAudioUrl = async (urls, index = 0) => {
        if (index >= urls.length) {
            throw new Error('All audio URLs failed to load');
        }

        const audio = new Audio();
        audio.crossOrigin = 'anonymous';

        return new Promise((resolve, reject) => {
            audio.src = urls[index];
            audio.volume = volume;
            audio.loop = true;

            const handleCanPlay = () => {
                audio.removeEventListener('canplaythrough', handleCanPlay);
                audio.removeEventListener('error', handleError);
                resolve(audio);
            };

            const handleError = async () => {
                audio.removeEventListener('canplaythrough', handleCanPlay);
                audio.removeEventListener('error', handleError);

                console.log(`Audio URL ${index + 1} failed, trying next...`);

                try {
                    const nextAudio = await tryAudioUrl(urls, index + 1);
                    resolve(nextAudio);
                } catch (err) {
                    reject(err);
                }
            };

            audio.addEventListener('canplaythrough', handleCanPlay);
            audio.addEventListener('error', handleError);

            audio.load();
        });
    };

    const toggleSound = async (sound) => {
        if (soundPlaying === sound.id) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setSoundPlaying(null);
            setIsLoading(false);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }

            try {
                setIsLoading(true);
                const audio = await tryAudioUrl(sound.urls);
                await audio.play();
                audioRef.current = audio;
                setSoundPlaying(sound.id);
                setIsLoading(false);

                toast({
                    title: "🎵 Sound Playing",
                    description: `Now playing: ${sound.name}`,
                });
            } catch (error) {
                console.error('Error playing sound:', error);
                setIsLoading(false);
                setSoundPlaying(null);

                toast({
                    title: "Audio Error",
                    description: `Unable to play ${sound.name}. This sound may not be available.`,
                    variant: "destructive"
                });
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="peace-mode-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="peace-mode-container"
            >
                <div className="peace-mode-header">
                    <div className="peace-mode-title-group">
                        <div className="peace-mode-icon-box">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="peace-mode-title-text">
                            <h2>Peace Mode</h2>
                            <p>Take a mindful break</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="peace-mode-close-btn"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="peace-mode-tabs">
                    <button
                        onClick={() => setActiveTab('breathe')}
                        className={`peace-mode-tab-btn ${activeTab === 'breathe' ? 'active' : ''}`}
                    >
                        <Wind className="w-5 h-5 mx-auto mb-1" />
                        Breathe
                    </button>
                    <button
                        onClick={() => setActiveTab('affirmation')}
                        className={`peace-mode-tab-btn ${activeTab === 'affirmation' ? 'active' : ''}`}
                    >
                        Affirm
                    </button>
                    <button
                        onClick={() => setActiveTab('sounds')}
                        className={`peace-mode-tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
                    >
                        <Music className="w-5 h-5 mx-auto mb-1" />
                        Sounds
                    </button>
                </div>

                <div className="peace-mode-content">
                    <AnimatePresence mode="wait">
                        {activeTab === 'breathe' && (
                            <motion.div
                                key="breathe"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="breathing-patterns-list">
                                    {breathingPatterns.map((pat, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedPattern(idx);
                                                stopBreathing();
                                            }}
                                            className={`breathing-pattern-btn ${selectedPattern === idx ? 'active' : ''}`}
                                        >
                                            {pat.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="breathing-circle-container">
                                    <motion.div
                                        animate={{
                                            scale: breathing ? [1, 1.5, 1.5, 1] : 1,
                                            opacity: breathing ? [0.6, 1, 1, 0.6] : 0.8,
                                        }}
                                        transition={{
                                            duration: pattern.phases.reduce((a, b) => a + b, 0),
                                            repeat: breathing ? Infinity : 0,
                                            ease: "easeInOut",
                                        }}
                                        className="breathing-circle"
                                    >
                                        <div className="breathing-circle-text">
                                            <p>
                                                {breathing ? currentLabel : 'Ready'}
                                            </p>
                                            {breathing && (
                                                <p className="breath-count-text">{currentPhase}s</p>
                                            )}
                                        </div>
                                    </motion.div>

                                    {breathing && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="cycle-text"
                                        >
                                            Cycle {breathCount + 1}
                                        </motion.p>
                                    )}
                                </div>

                                <div className="breathing-controls">
                                    <Button
                                        onClick={breathing ? stopBreathing : startBreathing}
                                        className={`peace-mode-action-btn ${breathing ? 'btn-stop' : 'btn-primary'}`}
                                    >
                                        {breathing ? 'Stop' : 'Start Breathing'}
                                    </Button>
                                </div>

                                <p className="footer-tip">
                                    {pattern.name} helps reduce stress and anxiety
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'affirmation' && (
                            <motion.div
                                key="affirmation"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="affirmation-card">
                                    <motion.p
                                        key={affirmation}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="affirmation-text"
                                    >
                                        {affirmation}
                                    </motion.p>
                                </div>

                                <div className="flex justify-center">
                                    <Button
                                        onClick={getNewAffirmation}
                                        className="peace-mode-action-btn btn-primary"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        New Affirmation
                                    </Button>
                                </div>

                                <p className="footer-tip">
                                    Positive affirmations can boost confidence and reduce stress
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'sounds' && (
                            <motion.div
                                key="sounds"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <div className="sounds-grid">
                                    {sounds.map((sound) => (
                                        <button
                                            key={sound.id}
                                            onClick={() => toggleSound(sound)}
                                            disabled={isLoading && soundPlaying !== sound.id}
                                            className={`sound-btn sound-btn-${sound.id} ${soundPlaying === sound.id ? 'active' : ''}`}
                                        >
                                            <div className="sound-emoji">{sound.emoji}</div>
                                            <p className="sound-name">{sound.name}</p>
                                            {soundPlaying === sound.id && !isLoading && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    <Volume2 className="w-5 h-5 mx-auto text-white animate-pulse" />
                                                </motion.div>
                                            )}
                                            {isLoading && soundPlaying === sound.id && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <Loader2 className="w-5 h-5 mx-auto text-white animate-spin" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {soundPlaying && (
                                    <div className="volume-card">
                                        <div className="volume-control">
                                            {volume > 0 ? (
                                                <Volume2 className="w-5 h-5 text-white" />
                                            ) : (
                                                <VolumeX className="w-5 h-5 text-white" />
                                            )}
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={volume * 100}
                                                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                                                className="volume-slider"
                                            />
                                            <span className="volume-percent">{Math.round(volume * 100)}%</span>
                                        </div>
                                    </div>
                                )}

                                <p className="footer-tip">
                                    {soundPlaying
                                        ? 'Click the playing sound to stop it'
                                        : 'Click any sound to start playing calming audio'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PeaceMode;

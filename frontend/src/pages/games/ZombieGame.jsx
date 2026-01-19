import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Heart, Home, Soup, Users, Trophy, Gamepad2, ArrowLeft, Star, Skull } from 'lucide-react';
import {
    createSurvivor,
    makeDecision,
    getLeaderboard,
    addToLeaderboard
} from '@/services/zombieApi';
import { motion, AnimatePresence } from 'framer-motion';
import './ZombieGame.css';

export default function ZombieGame() {
    const [gameState, setGameState] = useState('menu');
    const [survivor, setSurvivor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [nameInput, setNameInput] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const data = await getLeaderboard();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    };

    const startGame = async () => {
        if (!nameInput.trim()) {
            toast({
                title: "Name Required",
                description: "Please enter your survivor name",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);
            const data = await createSurvivor(nameInput);
            // Normalize backend shape: server returns stats nested under `survivor.stats`.
            const normalized = data.survivor && data.survivor.stats
                ? { ...data.survivor, ...data.survivor.stats }
                : data.survivor;
            setSurvivor(normalized);
            setGameState('playing');
            toast({
                title: "Game Started! 🧟",
                description: `Welcome, ${data.survivor.name}. Survive 14 days to escape!`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start game",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (decision) => {
        if (!survivor) return;

        try {
            setLoading(true);
            const data = await makeDecision(survivor.id, decision);
            const normalized = data.survivor && data.survivor.stats
                ? { ...data.survivor, ...data.survivor.stats }
                : data.survivor;
            setSurvivor(normalized);

            toast({
                title: `Day ${data.survivor.day} Update`,
                description: data.message,
            });

            if (data.survivor.status === 'dead') {
                await handleGameOver(false, data.survivor);
            } else if (data.survivor.status === 'escaped') {
                await handleGameOver(true, data.survivor);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to make decision",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGameOver = async (survived, currentSurvivor) => {
        try {
            await addToLeaderboard({
                name: currentSurvivor.name,
                score: currentSurvivor.score,
                days: currentSurvivor.day,
                survived
            });
            setGameState('gameover');
        } catch (error) {
            console.error('Failed to add to leaderboard:', error);
            setGameState('gameover');
        }
    };

    const resetGame = () => {
        setGameState('menu');
        setSurvivor(null);
        setNameInput('');
        fetchLeaderboard();
    };


    if (gameState === 'menu') {
        return (
            <GameContainer>
                <div className="game-menu-container">
                    <motion.div
                        className="game-title-section"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="game-badge">
                            <Gamepad2 size={16} /> NEW MINI-GAME
                        </div>
                        <h1 className="game-main-title">
                            Zombie<br /><span>Survival</span>
                        </h1>
                        <p className="game-description">
                            A friendly decision-based game to refresh your focus between study sessions. 🧠✨
                        </p>
                    </motion.div>

                    <div className="menu-stack">
                        <motion.div
                            className="menu-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="input-group">
                                <label className="input-label">Enter Survivor Name</label>
                                <Input
                                    placeholder="E.g. Brave Survivor..."
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            startGame();
                                        }
                                    }}
                                    className="game-input-large"
                                />
                            </div>
                            <div className="menu-actions">
                                <Button
                                    onClick={startGame}
                                    disabled={loading}
                                    className="btn-game-primary"
                                >
                                    {loading ? 'PREPARING...' : 'START ADVENTURE 🚀'}
                                </Button>
                                <Button
                                    onClick={() => navigate('/gamification')}
                                    variant="ghost"
                                    className="btn-game-secondary"
                                    style={{ fontWeight: 800, color: '#6B7280', marginTop: '1rem', width: '100%' }}
                                >
                                    <ArrowLeft size={18} /> Back to Dashboard
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            className="menu-card leaderboard-card"
                            style={{ padding: 0, marginTop: '2rem' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="leaderboard-header">
                                <Trophy size={24} color="#F59E0B" />
                                <h2 className="leaderboard-title">Top Survivors</h2>
                            </div>
                            <div className="leaderboard-list">
                                {leaderboard.length > 0 ? (
                                    leaderboard.slice(0, 5).map((entry, i) => (
                                        <div key={i} className={`leaderboard-item ${i < 3 ? 'top-rank' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <span className="leaderboard-rank">{i + 1}</span>
                                                <span style={{ fontWeight: 800 }}>{entry.name}</span>
                                            </div>
                                            <div className="leaderboard-score">
                                                <div className="score-pts">{entry.score} pts</div>
                                                <div className="score-days">{entry.days} days</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                                        No survivors yet. Be the first!
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </GameContainer>
        );
    }

    if (gameState === 'gameover' && survivor) {
        const survived = survivor.status === 'escaped';
        return (
            <GameContainer>
                <motion.div
                    className="gameover-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className={`gameover-banner ${survived ? 'victory' : 'defeat'}`}>
                        {survived ? <Star size={80} fill="#2D3E50" /> : <Skull size={80} />}
                    </div>
                    <div className="gameover-content">
                        <h2 className="gameover-title">{survived ? 'Victory!' : 'Game Over'}</h2>
                        <p className="gameover-subtitle">
                            {survived ? "Escape pod launched successfully!" : "The horde swallowed your progress..."}
                        </p>

                        <div className="result-stats-row">
                            <div className="result-stat-box">
                                <div className="stat-label">Total Score</div>
                                <div className="result-val">{survivor.score}</div>
                            </div>
                            <div className="result-stat-box">
                                <div className="stat-label">Days Survived</div>
                                <div className="result-val">{survivor.day}</div>
                            </div>
                        </div>

                        <div className="menu-actions">
                            <Button onClick={resetGame} className="btn-game-primary">
                                TRY AGAIN
                            </Button>
                            <Button onClick={() => navigate('/gamification')} variant="ghost" className="btn-game-secondary" style={{ fontWeight: 800 }}>
                                BACK TO HUB
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </GameContainer>
        );
    }

    if (!survivor) return null;

    const stats = [
        { icon: <Heart color="#EF4444" fill="#EF4444" />, label: 'Health', value: Math.max(0, survivor.health), color: '#FEC8D8' },
        { icon: <Soup color="#D97706" />, label: 'Hunger', value: Math.max(0, survivor.hunger), color: '#FFF4C7' },
        { icon: <Star color="#A855F7" />, label: 'Morale', value: Math.max(0, survivor.morale), color: '#E9D5FF' },
        { icon: <Home color="#0891B2" />, label: 'Shelter', value: Math.max(0, survivor.shelter), color: '#A8D8E8' },
        { icon: <Users color="#059669" />, label: 'Allies', value: survivor.allies * 20, color: '#D1FAE5' },
    ];

    return (
        <div className="zombie-game-root">
            <div className="game-hud">
                <header className="hud-header">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="day-badge">Survival Log</span>
                        <h1 className="day-title">DAY {survivor.day}</h1>
                        <p className="survivor-name">Survivor: {survivor.name}</p>
                    </motion.div>
                    <Button
                        onClick={() => setGameState('menu')}
                        variant="outline"
                        style={{ border: '3px solid #2D3E50', borderRadius: '99px', fontWeight: 800 }}
                    >
                        QUIT RUN
                    </Button>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-widget"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="stat-accent-bar" style={{ backgroundColor: stat.color }}></div>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Decisions Section */}
                <div className="decisions-container">
                    <h2 className="decisions-section-title">Survival Choice</h2>
                    <div className="decisions-grid">
                        <DecisionButton
                            onClick={() => handleDecision('shelter')}
                            icon={<Home size={40} />}
                            title="Reinforce"
                            desc="Build shelter (+30 safety)"
                            color="#A8D8E8"
                            disabled={loading}
                            index={0}
                        />
                        <DecisionButton
                            onClick={() => handleDecision('food')}
                            icon={<Soup size={40} />}
                            title="Scavenge"
                            desc="Search for food"
                            color="#FFF4C7"
                            disabled={loading}
                            index={1}
                        />
                        <DecisionButton
                            onClick={() => handleDecision('allies')}
                            icon={<Users size={40} />}
                            title="Recruit"
                            desc="Find other survivors"
                            color="#D1FAE5"
                            disabled={loading}
                            index={2}
                        />
                        <DecisionButton
                            onClick={() => handleDecision('rest')}
                            icon={<Star size={40} />}
                            title="Meditate"
                            desc="Stay calm and rest"
                            color="#E9D5FF"
                            disabled={loading}
                            index={3}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


// Main Layout Wrapper
const GameContainer = ({ children }) => (
    <div className="zombie-game-root">
        {children}
    </div>
);

function DecisionButton({ onClick, icon, title, desc, disabled, color, index }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className="decision-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
        >
            <div className="decision-icon-wrapper" style={{ backgroundColor: color }}>
                {icon}
            </div>
            <div className="decision-info">
                <div className="decision-title">{title}</div>
                <div className="decision-desc">{desc}</div>
            </div>
        </motion.button>
    );
}

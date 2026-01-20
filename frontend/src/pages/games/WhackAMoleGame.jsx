import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './GamePage.css';

const API_BASE_URL = import.meta.env.VITE_GAMES_API_URL || "http://localhost:5002/api";

const DIFFICULTIES = {
  easy: { speed: 1200, minSpeed: 500, label: "Easy" },
  medium: { speed: 900, minSpeed: 320, label: "Medium" },
  hard: { speed: 600, minSpeed: 200, label: "Hard" },
};

const HOLE_COUNT = 9;
const GAME_LENGTH_SECONDS = 60;

function getRandomHole(exclude) {
  const candidates = Array.from({ length: HOLE_COUNT }, (_, i) => i).filter(
    (i) => i !== exclude
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const WhackAMoleGame = () => {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_LENGTH_SECONDS);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [moleIndex, setMoleIndex] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const moleSpeed = useMemo(() => {
    const speeds = DIFFICULTIES[difficulty];
    const bonus = Math.floor(score / 5) * 40;
    return Math.max(speeds.speed - bonus, speeds.minSpeed);
  }, [score, difficulty]);

  const timerRef = useRef(null);
  const moleRef = useRef(null);
  const sessionRecordedRef = useRef(false);

  const fetchGameHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/whack-a-mole/history/test-user?limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const scores = data.map((game) => game.final_score).reverse();
          const accuracies = data.map((game) => game.accuracy).reverse();
          setScoreHistory(scores);
          setAccuracyHistory(accuracies);
          setHighScore(Math.max(...scores));
        }
      }
    } catch (error) {
      console.warn("Backend not available. Game will work without progress tracking.", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const saveGameSession = useCallback(async (finalScore, clicks, missesMade, accuracy) => {
    try {
      const response = await fetch(`${API_BASE_URL}/whack-a-mole/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: "test-user",
          final_score: finalScore,
          total_clicks: clicks,
          total_misses: missesMade,
          accuracy: accuracy,
          time_taken: GAME_LENGTH_SECONDS,
          peak_speed: DIFFICULTIES[difficulty].minSpeed,
          avg_speed: moleSpeed,
          status: "completed",
        }),
      });
      if (response.ok) {
        console.log("Game session saved successfully");
      }
    } catch (error) {
      console.warn("Backend not available. Game completed but not saved to database.", error);
    }
  }, [difficulty, moleSpeed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleRef.current) clearInterval(moleRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const scheduleMole = () => {
      setMoleIndex((prev) => getRandomHole(prev));
    };

    scheduleMole();
    moleRef.current = setInterval(scheduleMole, moleSpeed);

    return () => {
      if (moleRef.current) clearInterval(moleRef.current);
    };
  }, [running, moleSpeed]);

  const handleWhack = (idx) => {
    if (!running) return;
    if (moleIndex === idx) {
      setScore((s) => s + 1);
      setMoleIndex(null);
    } else {
      setMisses((m) => m + 1);
    }
  };

  const handleStart = () => {
    setScore(0);
    setMisses(0);
    setTimeLeft(GAME_LENGTH_SECONDS);
    setRunning(true);
    sessionRecordedRef.current = false;
  };

  useEffect(() => {
    if (!running && timeLeft === 0 && !sessionRecordedRef.current) {
      const accuracy = score + misses > 0 ? (score / (score + misses)) * 100 : 0;
      if (score > highScore) {
        setHighScore(score);
      }
      saveGameSession(score, score + misses, misses, accuracy);
      sessionRecordedRef.current = true;
    }
  }, [running, timeLeft, score, misses, saveGameSession, highScore]);

  const status = running ? "In play" : timeLeft === 0 ? "Finished" : "Idle";
  const accuracy = score + misses > 0 ? ((score / (score + misses)) * 100).toFixed(0) : 0;

  return (
    <div className="game-page-wrapper" style={{ minHeight: '100vh', background: 'var(--color-cream)', color: 'var(--color-navy)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          background: 'var(--color-white)', 
          borderRadius: 'var(--card-radius)', 
          border: 'var(--neo-border)',
          boxShadow: 'var(--neo-shadow-large)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: '0 0 0.5rem 0' }}>⚡ Whack-A-Mole</h1>
              <p style={{ color: 'var(--color-gray-text)', margin: 0 }}>Quick reflexes game! Test your speed!</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  fetchGameHistory();
                  setShowProgressModal(true);
                }}
                disabled={isLoadingHistory}
                style={{ 
                  padding: '0.75rem 1.25rem', 
                  background: 'var(--color-soft-teal)', 
                  color: 'var(--color-navy)', 
                  border: 'var(--neo-border)', 
                  borderRadius: '12px', 
                  fontWeight: 'bold',
                  boxShadow: 'var(--neo-shadow)',
                  transition: 'all 0.2s',
                  cursor: isLoadingHistory ? 'not-allowed' : 'pointer'
                }}
                onMouseDown={(e) => !isLoadingHistory && (e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)', e.currentTarget.style.transform = 'translate(2px, 2px)')}
                onMouseUp={(e) => !isLoadingHistory && (e.currentTarget.style.boxShadow = 'var(--neo-shadow)', e.currentTarget.style.transform = 'translate(0, 0)')}
                onMouseLeave={(e) => !isLoadingHistory && (e.currentTarget.style.boxShadow = 'var(--neo-shadow)', e.currentTarget.style.transform = 'translate(0, 0)')}
              >
                {isLoadingHistory ? "⏳ Loading..." : "📊 View Progress"}
              </button>
              <button
                onClick={handleStart}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--color-success)', 
                  color: 'white', 
                  border: 'var(--neo-border)', 
                  borderRadius: '12px', 
                  fontWeight: 'bold',
                  boxShadow: 'var(--neo-shadow)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseDown={(e) => (e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)', e.currentTarget.style.transform = 'translate(2px, 2px)')}
                onMouseUp={(e) => (e.currentTarget.style.boxShadow = 'var(--neo-shadow)', e.currentTarget.style.transform = 'translate(0, 0)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--neo-shadow)', e.currentTarget.style.transform = 'translate(0, 0)')}
              >
                {running ? "🔄 Restart" : timeLeft === GAME_LENGTH_SECONDS ? "▶ Start" : "🔁 Play Again"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ background: 'var(--color-cream)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-success)', margin: 0 }}>{status}</p>
            </div>
            <div style={{ background: 'var(--color-soft-teal)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Time</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{timeLeft}s</p>
            </div>
            <div style={{ background: 'var(--color-soft-yellow)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Score</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{score}</p>
            </div>
            <div style={{ background: 'var(--color-soft-pink)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Misses</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{misses}</p>
            </div>
            <div style={{ background: 'var(--color-soft-orange)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Accuracy</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{accuracy}%</p>
            </div>
          </div>
        </div>

        {/* Game Grid and Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 1024 ? '1fr 280px' : '1fr', gap: '1.5rem' }}>
          {/* Game Grid */}
          <div style={{ 
            background: 'var(--color-white)', 
            padding: '1.5rem', 
            borderRadius: 'var(--card-radius)', 
            border: 'var(--neo-border)',
            boxShadow: 'var(--neo-shadow-large)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
              {Array.from({ length: HOLE_COUNT }).map((_, idx) => {
                const active = moleIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleWhack(idx)}
                    disabled={!running}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '16px',
                      border: 'var(--neo-border)',
                      background: active ? 'var(--color-soft-pink-light)' : 'var(--color-cream)',
                      position: 'relative',
                      cursor: running ? 'pointer' : 'not-allowed',
                      opacity: running ? 1 : 0.6,
                      transition: 'all 0.2s',
                      boxShadow: active ? 'var(--neo-shadow-large)' : 'var(--neo-shadow)',
                      minHeight: '100px',
                      fontSize: '3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseDown={(e) => {
                      if (running) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)';
                        e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (running) {
                        e.currentTarget.style.transform = 'translate(0, 0)';
                        e.currentTarget.style.boxShadow = active ? 'var(--neo-shadow-large)' : 'var(--neo-shadow)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (running) {
                        e.currentTarget.style.transform = 'translate(0, 0)';
                        e.currentTarget.style.boxShadow = active ? 'var(--neo-shadow-large)' : 'var(--neo-shadow)';
                      }
                    }}
                  >
                    {active && '🦫'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--color-white)', 
              padding: '1.25rem', 
              borderRadius: 'var(--card-radius)', 
              border: 'var(--neo-border)',
              boxShadow: 'var(--neo-shadow)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-navy)', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>DIFFICULTY</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.keys(DIFFICULTIES).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDifficulty(key);
                      if (running) handleStart();
                    }}
                    style={{
                      padding: '0.75rem',
                      background: difficulty === key ? 'var(--color-success)' : 'var(--color-soft-blue-light)',
                      color: difficulty === key ? 'white' : 'var(--color-navy)',
                      border: difficulty === key ? '3px solid var(--color-navy)' : 'var(--neo-border)',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: difficulty === key ? 'var(--neo-shadow-large)' : 'var(--neo-shadow-hover)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {DIFFICULTIES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ 
              background: 'var(--color-soft-orange)', 
              padding: '1.25rem', 
              borderRadius: 'var(--card-radius)', 
              border: 'var(--neo-border)',
              boxShadow: 'var(--neo-shadow)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Best Score</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{highScore}</p>
            </div>

            <div style={{ 
              background: 'var(--color-soft-purple)', 
              padding: '1.25rem', 
              borderRadius: 'var(--card-radius)', 
              border: 'var(--neo-border)',
              boxShadow: 'var(--neo-shadow)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>How to play</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-navy)', lineHeight: 1.6 }}>Click the moles as they pop up! Speed increases as you score more points.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(45, 62, 80, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowProgressModal(false)}
        >
          <div
            style={{
              maxWidth: '900px',
              width: '90%',
              background: 'var(--color-white)',
              borderRadius: 'var(--card-radius)',
              border: 'var(--neo-border)',
              boxShadow: 'var(--neo-shadow-large)',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '2.5px solid var(--color-navy)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'var(--color-soft-blue-light)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>📊 Your Progress</h2>
              <button
                onClick={() => setShowProgressModal(false)}
                style={{ 
                  background: 'var(--color-cream)', 
                  border: 'var(--neo-border)', 
                  borderRadius: '50%', 
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer', 
                  color: 'var(--color-navy)',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  boxShadow: 'var(--neo-shadow)'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {scoreHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ fontSize: '1.25rem', color: 'var(--color-gray-text)' }}>No game data yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-light)', marginTop: '0.5rem' }}>Play some games to see your progress!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ 
                      background: 'var(--color-soft-yellow)', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: 'var(--neo-border)',
                      boxShadow: 'var(--neo-shadow)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Best Score</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{Math.max(...scoreHistory)}</p>
                    </div>
                    <div style={{ 
                      background: 'var(--color-soft-teal)', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: 'var(--neo-border)',
                      boxShadow: 'var(--neo-shadow)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Games Played</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{scoreHistory.length}</p>
                    </div>
                    <div style={{ 
                      background: 'var(--color-soft-pink)', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: 'var(--neo-border)',
                      boxShadow: 'var(--neo-shadow)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>Avg Accuracy</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>
                        {(accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhackAMoleGame;

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './GamePage.css';

const API_BASE_URL = import.meta.env.VITE_GAMES_API_URL || "http://localhost:5002/api";

// Game setup
const DIFFICULTIES = {
  easy: { pairs: 6, label: "Easy" },
  medium: { pairs: 8, label: "Medium" },
  hard: { pairs: 10, label: "Hard" },
};

function buildDeck(pairs) {
  const symbols = Array.from({ length: pairs }, (_, i) => String.fromCharCode(65 + i));
  const doubled = symbols.flatMap((s) => [s, s]);
  return doubled
    .map((symbol, idx) => ({ id: idx + 1, symbol, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

const MemoryCardGame = () => {
  const [difficulty, setDifficulty] = useState("medium");
  const [deck, setDeck] = useState(() => buildDeck(DIFFICULTIES[difficulty].pairs));
  const [running, setRunning] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selected, setSelected] = useState([]);
  const [lockBoard, setLockBoard] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [timeHistory, setTimeHistory] = useState([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const timerRef = useRef(null);

  const totalPairs = DIFFICULTIES[difficulty].pairs;
  const accuracy = moves > 0 ? (matches / (moves / 2)) * 100 : 0;
  const allMatched = matches === totalPairs;

  // Derived score
  const finalScore = useMemo(() => {
    const base = matches * 20;
    const movePenalty = Math.max(0, moves - matches * 2);
    const timePenalty = Math.floor(elapsed / 5);
    return Math.max(0, base - movePenalty - timePenalty);
  }, [matches, moves, elapsed]);

  // Timer control
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  // Handle completion
  useEffect(() => {
    if (allMatched && running && !sessionRecorded) {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched, running, sessionRecorded]);

  const resetGame = (level = difficulty) => {
    const pairs = DIFFICULTIES[level].pairs;
    setDeck(buildDeck(pairs));
    setDifficulty(level);
    setMoves(0);
    setMatches(0);
    setElapsed(0);
    setSelected([]);
    setLockBoard(false);
    setSessionRecorded(false);
    setRunning(true);
  };

  const handleCardClick = (cardId) => {
    if (lockBoard || !running) return;
    const current = deck.find((c) => c.id === cardId);
    if (!current || current.flipped || current.matched) return;

    const newDeck = deck.map((c) => (c.id === cardId ? { ...c, flipped: true } : c));
    const newSelected = [...selected, cardId];
    setDeck(newDeck);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setLockBoard(true);
      setMoves((m) => m + 1);
      const [firstId, secondId] = newSelected;
      const first = newDeck.find((c) => c.id === firstId);
      const second = newDeck.find((c) => c.id === secondId);

      if (first.symbol === second.symbol) {
        // Match
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
            )
          );
          setMatches((m) => m + 1);
          setSelected([]);
          setLockBoard(false);
        }, 400);
      } else {
        // Mismatch
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
            )
          );
          setSelected([]);
          setLockBoard(false);
        }, 650);
      }
    }
  };

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/memory-card/history/test-user?limit=8`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const scores = data.map((g) => g.final_score).reverse();
          const accuracies = data.map((g) =>
            g.total_moves > 0 ? (g.pairs_matched / (g.total_moves / 2)) * 100 : 0
          ).reverse();
          const times = data.map((g) => g.time_taken).reverse();
          setScoreHistory(scores);
          setAccuracyHistory(accuracies);
          setTimeHistory(times);
        }
      }
    } catch (err) {
      console.warn("Backend not available. Game will work without progress tracking.", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (sessionRecorded) return;
    const payload = {
      clerk_user_id: "test-user",
      final_score: finalScore,
      total_moves: moves,
      pairs_matched: matches,
      time_taken: elapsed,
      difficulty,
      status: "completed",
    };
    try {
      const res = await fetch(`${API_BASE_URL}/memory-card/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSessionRecorded(true);
      }
    } catch (err) {
      console.warn("Backend not available. Game completed but not saved to database.", err);
      setSessionRecorded(true); // Mark as recorded anyway to prevent retries
    }
  }, [sessionRecorded, finalScore, moves, matches, elapsed, difficulty]);

  const status = running ? "In play" : allMatched ? "Finished" : "Idle";

  return (
    <div className="game-page-wrapper" style={{ minHeight: '100vh', background: 'var(--color-cream)', color: 'var(--color-navy)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: '0 0 0.5rem 0' }}>🧠 Memory Match</h1>
              <p style={{ color: 'var(--color-gray-text)', margin: 0 }}>Flip pairs fast, make fewer moves. Click Start to begin!</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  fetchHistory();
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
                onClick={() => resetGame()}
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
                {running ? "🔄 Restart" : "▶ Start"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ background: 'var(--color-cream)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-success)', margin: 0 }}>{status}</p>
            </div>
            <div style={{ background: 'var(--color-soft-blue)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Moves</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{moves}</p>
            </div>
            <div style={{ background: 'var(--color-soft-yellow)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Pairs</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{matches}/{totalPairs}</p>
            </div>
            <div style={{ background: 'var(--color-soft-pink)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Accuracy</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{accuracy.toFixed(0)}%</p>
            </div>
            <div style={{ background: 'var(--color-soft-teal)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Time</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{elapsed}s</p>
            </div>
            <div style={{ background: 'var(--color-soft-orange)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '2px solid var(--color-navy)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-text)', margin: '0 0 0.25rem 0', textTransform: 'uppercase', fontWeight: 600 }}>Score</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-navy)', margin: 0 }}>{finalScore}</p>
            </div>
          </div>
        </div>

        {/* Game Grid and Sidebar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth > 1024 ? 'minmax(0, 1fr) 300px' : '1fr', 
          gap: '1.5rem' 
        }}>
          {/* Card Grid */}
          <div style={{ 
            background: 'var(--color-white)', 
            padding: '1.5rem', 
            borderRadius: 'var(--card-radius)', 
            border: 'var(--neo-border)',
            boxShadow: 'var(--neo-shadow-large)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(totalPairs * 2)))}, 1fr)`, 
              gap: '1rem',
              maxWidth: '650px',
              margin: '0 auto'
            }}>
              {deck.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!running || card.matched || card.flipped}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '16px',
                    border: card.matched ? '3px solid var(--color-success)' : card.flipped ? '3px solid var(--color-soft-blue)' : 'var(--neo-border)',
                    background: card.flipped || card.matched ? (card.matched ? 'var(--color-soft-pink-light)' : 'var(--color-soft-blue-light)') : 'var(--color-cream)',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: 'var(--color-navy)',
                    cursor: running && !card.flipped && !card.matched ? 'pointer' : 'not-allowed',
                    opacity: running ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    boxShadow: card.matched ? 'var(--neo-shadow-large)' : card.flipped ? 'var(--neo-shadow)' : 'var(--neo-shadow)',
                    minHeight: '80px',
                    transform: 'translate(0, 0)'
                  }}
                  onMouseDown={(e) => {
                    if (running && !card.flipped && !card.matched) {
                      e.currentTarget.style.transform = 'translate(2px, 2px)';
                      e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (running && !card.flipped && !card.matched) {
                      e.currentTarget.style.transform = 'translate(0, 0)';
                      e.currentTarget.style.boxShadow = 'var(--neo-shadow)';
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (running && !card.flipped && !card.matched) {
                      e.currentTarget.style.background = 'var(--color-soft-yellow)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (running && !card.flipped && !card.matched) {
                      e.currentTarget.style.transform = 'translate(0, 0)';
                      e.currentTarget.style.boxShadow = 'var(--neo-shadow)';
                      e.currentTarget.style.background = 'var(--color-cream)';
                    }
                  }}
                >
                  {card.flipped || card.matched ? card.symbol : "?"}
                </button>
              ))}
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
                      resetGame(key);
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
                      transition: 'all 0.2s',
                      transform: difficulty === key ? 'translate(0, 0)' : 'translate(0, 0)'
                    }}
                    onMouseDown={(e) => {
                      if (difficulty !== key) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)';
                        e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (difficulty !== key) {
                        e.currentTarget.style.transform = 'translate(0, 0)';
                        e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (difficulty !== key) {
                        e.currentTarget.style.transform = 'translate(0, 0)';
                        e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)';
                      }
                    }}
                  >
                    {DIFFICULTIES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ 
              background: 'var(--color-soft-purple)', 
              padding: '1.25rem', 
              borderRadius: 'var(--card-radius)', 
              border: 'var(--neo-border)',
              boxShadow: 'var(--neo-shadow)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>How to win</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-navy)', lineHeight: 1.6 }}>Match all pairs with the fewest moves and time. Score rewards speed and accuracy.</p>
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
                      background: 'var(--color-soft-blue)', 
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

export default MemoryCardGame;

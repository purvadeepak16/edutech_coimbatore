"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import memoryCardImg from "../assets/memory_card.png";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Game setup
const DIFFICULTIES = {
  easy: { pairs: 6, label: "Easy" },
  medium: { pairs: 8, label: "Medium" },
  hard: { pairs: 10, label: "Hard" },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;

type Card = {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
};

type GameRecord = {
  final_score: number;
  total_moves: number;
  pairs_matched: number;
  time_taken: number;
  difficulty: Difficulty;
};

function buildDeck(pairs: number): Card[] {
  const symbols = Array.from({ length: pairs }, (_, i) => String.fromCharCode(65 + i));
  const doubled = symbols.flatMap((s) => [s, s]);
  return doubled
    .map((symbol, idx) => ({ id: idx + 1, symbol, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

export default function MemoryGamePage() {
  const { user } = useUser();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(DIFFICULTIES[difficulty].pairs));
  const [running, setRunning] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [lockBoard, setLockBoard] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [timeHistory, setTimeHistory] = useState<number[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalPairs = DIFFICULTIES[difficulty].pairs;
  const accuracy = moves > 0 ? (matches / (moves / 2)) * 100 : 0;
  const allMatched = matches === totalPairs;

  // Derived score: reward matches, penalize extra moves, reward speed
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
  }, [allMatched, running, sessionRecorded]);

  const resetGame = (level: Difficulty = difficulty) => {
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

  const handleCardClick = (cardId: number) => {
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
      const first = newDeck.find((c) => c.id === firstId)!;
      const second = newDeck.find((c) => c.id === secondId)!;

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
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/memory-card/history/${user.id}?limit=8`);
      if (res.ok) {
        const data: GameRecord[] = await res.json();
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
      console.error("Failed to fetch memory game history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  const handleSave = useCallback(async () => {
    if (!user?.id || sessionRecorded) return;
    const payload = {
      clerk_user_id: user.id,
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
      console.error("Failed to save memory game session", err);
    }
  }, [user?.id, sessionRecorded, finalScore, moves, matches, elapsed, difficulty]);

  const status = running ? "In play" : allMatched ? "Finished" : "Idle";

  const difficultyOptions = (Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
    <button
      key={key}
      onClick={() => {
        if (running) return;
        resetGame(key);
      }}
      className={`w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
        difficulty === key
          ? "bg-emerald-500 text-slate-950"
          : "bg-slate-700 text-slate-200 hover:bg-slate-600"
      } ${running ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      disabled={running}
    >
      {DIFFICULTIES[key].label}
    </button>
  ));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src={memoryCardImg} alt="Memory Card" width={56} height={56} className="rounded-xl" />
              <div>
                <h1 className="text-2xl font-bold text-indigo-200">Memory Card Game</h1>
                <p className="text-sm text-slate-400">Flip pairs fast, make fewer moves.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchHistory();
                  setShowProgressModal(true);
                }}
                disabled={isLoadingHistory}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50"
              >
                {isLoadingHistory ? "⏳ Loading..." : "📊 View Progress"}
              </button>
              <button
                onClick={() => resetGame()}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-95"
              >
                {running ? "🔄 Restart" : "▶ Start"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-lg font-bold text-emerald-300">{status}</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Moves</p>
              <p className="text-2xl font-bold text-indigo-300">{moves}</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Pairs</p>
              <p className="text-2xl font-bold text-amber-300">{matches}/{totalPairs}</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Accuracy</p>
              <p className="text-2xl font-bold text-emerald-300">{accuracy.toFixed(0)}%</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Time</p>
              <p className="text-2xl font-bold text-cyan-300">{elapsed}s</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-2xl font-bold text-amber-300">{finalScore}</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Difficulty</p>
              <p className="text-lg font-semibold text-indigo-200">{DIFFICULTIES[difficulty].label}</p>
            </div>
            <div className="rounded-xl bg-slate-850 p-3">
              <p className="text-xs text-slate-400">Deck</p>
              <p className="text-lg font-semibold text-slate-200">{totalPairs * 2} cards</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-4 gap-3 rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl">
              {deck.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!running}
                  className={`aspect-square rounded-2xl border border-white/10 bg-slate-800 relative overflow-hidden shadow-inner transition ${
                    card.matched ? "border-emerald-400/60" : "hover:-translate-y-1"
                  } ${!running ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-3xl font-bold transition duration-200 ${
                      card.flipped || card.matched ? "text-emerald-200 bg-slate-700/40" : "text-slate-500"
                    }`}
                  >
                    {card.flipped || card.matched ? card.symbol : "?"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Difficulty</p>
              <div className="space-y-2">{difficultyOptions}</div>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-slate-900 p-4 shadow-xl">
              <p className="text-xs text-slate-400 mb-2">How to win</p>
              <p className="text-sm text-slate-200">Match all pairs with the fewest moves and time. Score rewards speed and accuracy.</p>
            </div>
          </div>
        </div>
      </div>

      {showProgressModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowProgressModal(false)}
        >
          <div
            className="relative max-w-4xl w-full mx-4 rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 p-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-indigo-300">Your Progress</h2>
                  <p className="text-sm text-slate-400">Memory game performance</p>
                </div>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="rounded-full bg-slate-800 p-2 hover:bg-slate-700 transition"
              >
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {scoreHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-slate-400">No game data yet</p>
                  <p className="text-sm text-slate-500 mt-2">Play some games to see your progress!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-800 p-4 border border-indigo-500/20">
                      <p className="text-xs text-slate-400 mb-1">Best Score</p>
                      <p className="text-3xl font-bold text-indigo-300">{Math.max(...scoreHistory)}</p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-cyan-950/50 to-slate-800 p-4 border border-cyan-500/20">
                      <p className="text-xs text-slate-400 mb-1">Games Played</p>
                      <p className="text-3xl font-bold text-cyan-300">{scoreHistory.length}</p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-950/50 to-slate-800 p-4 border border-emerald-500/20">
                      <p className="text-xs text-slate-400 mb-1">Avg Accuracy</p>
                      <p className="text-3xl font-bold text-emerald-300">
                        {accuracyHistory.length > 0 ? (accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-4">Score Progression</h3>
                    <div className="relative h-48">
                      <div className="absolute inset-0 flex items-end justify-around gap-1">
                        {scoreHistory.map((s, i) => {
                          const maxScore = Math.max(...scoreHistory, 1);
                          const height = (s / maxScore) * 100;
                          return (
                            <div key={i} className="flex flex-col items-center flex-1">
                              <div className="relative w-full group">
                                <div
                                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-400 hover:to-indigo-300"
                                  style={{ height: `${height * 1.7}px` }}
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs font-semibold text-indigo-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  Score: {s}
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 mt-1">{i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-3">Game Number</div>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-emerald-300 mb-4">Accuracy Trend</h3>
                    <div className="relative h-48">
                      <div className="absolute inset-0 flex items-end justify-around gap-1">
                        {accuracyHistory.map((acc, i) => (
                          <div key={i} className="flex flex-col items-center flex-1">
                            <div className="relative w-full group">
                              <div
                                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-400 hover:to-emerald-300"
                                style={{ height: `${acc * 1.4}px` }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs font-semibold text-emerald-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                {acc.toFixed(1)}%
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 mt-1">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-3">Game Number</div>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">Recent Games Details</h3>
                    <div className="space-y-2">
                      {scoreHistory.slice(0, 8).map((s, i) => {
                        const acc = accuracyHistory[i] ?? 0;
                        const time = timeHistory[i] ?? 0;
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
                            <span className="text-sm font-semibold text-slate-300">Game {i + 1}</span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-indigo-300">Score: {s}</span>
                              <span className="text-emerald-300">Accuracy: {acc.toFixed(1)}%</span>
                              <span className="text-cyan-300">Time: {time}s</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

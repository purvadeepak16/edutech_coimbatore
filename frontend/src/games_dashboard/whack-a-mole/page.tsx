"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import moleImg from "../assets/mole.png";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type GameRecord = {
  final_score: number;
  accuracy: number;
  [key: string]: any;
};

type DifficultyLevel = "large" | "medium" | "small";

const DIFFICULTY_SPEEDS = {
  large: { initial: 1200, min: 500, label: "Large (Easy)" },
  medium: { initial: 900, min: 320, label: "Medium (Normal)" },
  small: { initial: 600, min: 200, label: "Small (Hard)" },
};

const HOLE_COUNT = 9;
const GAME_LENGTH_SECONDS = 60;
const INITIAL_MOLE_SPEED = 900; // ms
const MIN_MOLE_SPEED = 320; // ms

// Layout tuning knobs
const LAYOUT_MAX_WIDTH = "1100px";
const GRID_GAP = "1rem"; // spacing between left/right and within grid
const GAME_CARD_PADDING = "1.25rem";
const SIDEBAR_WIDTH = "360px";
const MOLE_WIDTH = 140;
const MOLE_HEIGHT = 165;
const HOLE_PIT_WIDTH = "80%";
const HOLE_PIT_HEIGHT = "20%";
const HOLE_PIT_SKEW = "0deg";
const HOLE_PIT_SCALE_Y = 0.78;

// Column width percentages (must add to 100)
const PROGRESS_WIDTH = 35; // %
const GAME_WIDTH = 40; // %
const STATS_WIDTH = 25; // %

function getRandomHole(exclude: number | null) {
  const candidates = Array.from({ length: HOLE_COUNT }, (_, i) => i).filter(
    (i) => i !== exclude
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function WhackAMolePage() {
  const { user } = useUser();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_LENGTH_SECONDS);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [moleIndex, setMoleIndex] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementText, setAchievementText] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const moleSpeed = useMemo(() => {
    const speeds = DIFFICULTY_SPEEDS[difficulty];
    const bonus = Math.floor(score / 5) * 40; // speed up every 5 points
    return Math.max(speeds.initial - bonus, speeds.min);
  }, [score, difficulty]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moleRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRecordedRef = useRef(false);
  const moleSpeedRef = useRef(INITIAL_MOLE_SPEED);
  const userIdRef = useRef(user?.id);

  // Fetch game history function (called only when View Progress is clicked)
  const fetchGameHistory = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/whack-a-mole/history/${user.id}?limit=8`);
      if (response.ok) {
        const data: GameRecord[] = await response.json();
        if (data.length > 0) {
          const scores = data.map((game) => game.final_score).reverse();
          const accuracies = data.map((game) => game.accuracy).reverse();
          setScoreHistory(scores);
          setAccuracyHistory(accuracies);
          setHighScore(Math.max(...scores));
        }
      }
    } catch (error) {
      console.error("Failed to fetch game history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  // Save game session to database
  const saveGameSession = useCallback(
    async (finalScore: number, clicks: number, missesMade: number, accuracy: number) => {
      if (!user?.id) return;

      try {
        const response = await fetch(`${API_BASE_URL}/whack-a-mole/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: user.id,
            final_score: finalScore,
            total_clicks: clicks,
            total_misses: missesMade,
            accuracy: accuracy,
            time_taken: GAME_LENGTH_SECONDS,
            peak_speed: Math.min(...[INITIAL_MOLE_SPEED / 1.25, MIN_MOLE_SPEED]),
            avg_speed: moleSpeedRef.current,
            status: "completed",
          }),
        });

        if (response.ok) {
          console.log("Game session saved successfully");
        }
      } catch (error) {
        console.error("Failed to save game session:", error);
      }
    },
    [user?.id]
  );

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

    moleSpeedRef.current = moleSpeed;
    scheduleMole();
    moleRef.current = setInterval(scheduleMole, moleSpeed);

    return () => {
      if (moleRef.current) clearInterval(moleRef.current);
    };
  }, [running, moleSpeed]);

  const handleWhack = (idx: number) => {
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

  const handleDifficultyChange = (level: DifficultyLevel) => {
    if (!running) {
      setDifficulty(level);
    }
  };

  useEffect(() => {
    if (!running && timeLeft === 0) {
      if (!sessionRecordedRef.current) {
        const accuracy = score + misses > 0 ? (score / (score + misses)) * 100 : 0;
        
        // Update high score locally for immediate feedback
        if (score > highScore) {
          setHighScore(score);
        }
        
        // Show achievement notification
        if (score >= 30) {
          setAchievementText(`🎉 Amazing! Scored ${score} points!`);
          setShowAchievement(true);
          setTimeout(() => setShowAchievement(false), 3000);
        }
        
        // Save to database after every game ends
        saveGameSession(score, score + misses, misses, accuracy);
        sessionRecordedRef.current = true;
      }
    }
  }, [running, timeLeft, score, misses, saveGameSession, highScore, user?.id]);

  const status = running ? "In play" : timeLeft === 0 ? "Finished" : "Idle";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowProgressModal(false)}>
          <div className="relative max-w-4xl w-full mx-4 rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 p-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-emerald-300">Your Progress</h2>
                  <p className="text-sm text-slate-400">Performance Analytics</p>
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

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {scoreHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-slate-400">No game data yet</p>
                  <p className="text-sm text-slate-500 mt-2">Play some games to see your progress!</p>
                </div>
              ) : (
                <>
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-linear-to-br from-emerald-950/50 to-slate-800 p-4 border border-emerald-500/20">
                      <p className="text-xs text-slate-400 mb-1">Best Score</p>
                      <p className="text-3xl font-bold text-emerald-300">{highScore}</p>
                    </div>
                    <div className="rounded-xl bg-linear-to-br from-cyan-950/50 to-slate-800 p-4 border border-cyan-500/20">
                      <p className="text-xs text-slate-400 mb-1">Games Played</p>
                      <p className="text-3xl font-bold text-cyan-300">{scoreHistory.length}</p>
                    </div>
                    <div className="rounded-xl bg-linear-to-br from-amber-950/50 to-slate-800 p-4 border border-amber-500/20">
                      <p className="text-xs text-slate-400 mb-1">Avg Accuracy</p>
                      <p className="text-3xl font-bold text-amber-300">
                        {accuracyHistory.length > 0 ? (accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Score Graph */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-emerald-300 mb-4">Score Progression</h3>
                    <div className="relative h-48">
                      <div className="absolute inset-0 flex items-end justify-around gap-1">
                        {scoreHistory.map((s, i) => {
                          const maxScore = Math.max(...scoreHistory, 1);
                          const height = (s / maxScore) * 100;
                          return (
                            <div key={i} className="flex flex-col items-center flex-1">
                              <div className="relative w-full group">
                                <div
                                  className="w-full bg-linear-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-400 hover:to-emerald-300"
                                  style={{ height: `${height * 1.7}px` }}
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs font-semibold text-emerald-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
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

                  {/* Accuracy Graph */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-amber-300 mb-4">Accuracy Trend</h3>
                    <div className="relative h-48">
                      <div className="absolute inset-0 flex items-end justify-around gap-1">
                        {accuracyHistory.map((acc, i) => {
                          const height = acc;
                          return (
                            <div key={i} className="flex flex-col items-center flex-1">
                              <div className="relative w-full group">
                                <div
                                  className="w-full bg-linear-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all hover:from-amber-400 hover:to-amber-300"
                                  style={{ height: `${height * 1.7}px` }}
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs font-semibold text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  {acc.toFixed(1)}%
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

                  {/* Score/Miss Ratio Table */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">Recent Games Details</h3>
                    <div className="space-y-2">
                      {scoreHistory.slice(0, 8).map((s, i) => {
                        const acc = accuracyHistory[i];
                        const totalClicks = acc > 0 ? Math.round(s / (acc / 100)) : s;
                        const misses = totalClicks - s;
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
                            <span className="text-sm font-semibold text-slate-300">Game {i + 1}</span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-emerald-300">Score: {s}</span>
                              <span className="text-rose-300">Misses: {misses}</span>
                              <span className="text-amber-300">Accuracy: {acc.toFixed(1)}%</span>
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

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-bounce">
          <div className="rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 p-4 shadow-2xl">
            <p className="text-center text-lg font-bold text-slate-950">{achievementText}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Quest Header */}
        <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-linear-to-r from-emerald-950/50 to-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚡</span>
              <div>
                <h1 className="text-2xl font-bold text-emerald-300">Mole Whacking Quest</h1>
                <p className="text-sm text-slate-400">Challenge #{Math.ceil(Math.random() * 100)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-300">{score}/{highScore || 50}</p>
              <p className="text-xs text-slate-400">Current / Best</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden border border-emerald-500/30">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min((score / (highScore || 50)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{GAME_LENGTH_SECONDS - timeLeft}s elapsed</span>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area - Main */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-5">
              {/* Game Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${{
                    "In play": "bg-emerald-400/10 text-emerald-200",
                    "Finished": "bg-amber-400/10 text-amber-200",
                    "Idle": "bg-slate-400/10 text-slate-300"
                  }[status] || "bg-slate-400/10 text-slate-300"}`}>
                    {status}
                  </span>
                  <span className="text-sm text-slate-400">Level: {difficulty.toUpperCase()}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetchGameHistory();
                      setShowProgressModal(true);
                    }}
                    disabled={isLoadingHistory}
                    className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingHistory ? "⏳ Loading..." : "📊 View Progress"}
                  </button>
                  <button
                    onClick={handleStart}
                    className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-95"
                  >
                    {running ? "🔄 Restart" : timeLeft === GAME_LENGTH_SECONDS ? "▶ Start" : "🔁 Play Again"}
                  </button>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="rounded-xl bg-slate-850 p-3 text-center">
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="text-2xl font-bold text-cyan-300">{timeLeft}s</p>
                </div>
                <div className="rounded-xl bg-slate-850 p-3 text-center">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="text-2xl font-bold text-emerald-300">{score}</p>
                </div>
                <div className="rounded-xl bg-slate-850 p-3 text-center">
                  <p className="text-xs text-slate-400">Misses</p>
                  <p className="text-2xl font-bold text-rose-300">{misses}</p>
                </div>
                <div className="rounded-xl bg-slate-850 p-3 text-center">
                  <p className="text-xs text-slate-400">Accuracy</p>
                  <p className="text-2xl font-bold text-amber-300">
                    {score + misses > 0 ? ((score / (score + misses)) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              {/* Game Grid */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: HOLE_COUNT }).map((_, idx) => {
                  const active = moleIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleWhack(idx)}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[inset_0_18px_40px_rgba(0,0,0,0.55)] transition hover:-translate-y-1 hover:border-emerald-300/50 active:scale-95"
                      disabled={!running}
                    >
                      <div className="absolute inset-0 flex items-end justify-center pb-3">
                        <div
                          className="absolute bottom-2 rounded-full opacity-90"
                          style={{
                            background:
                              "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.18) 100%)",
                            boxShadow:
                              "inset 0 6px 12px rgba(255,255,255,0.05), 0 10px 18px rgba(0,0,0,0.45)",
                            transform: `skewX(${HOLE_PIT_SKEW}) scaleY(${HOLE_PIT_SCALE_Y})`,
                            width: HOLE_PIT_WIDTH,
                            height: HOLE_PIT_HEIGHT,
                          }}
                          aria-hidden
                        />
                        <Image
                          src={moleImg}
                          alt="Mole"
                          width={MOLE_WIDTH}
                          height={MOLE_HEIGHT}
                          className={`select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] transition-all duration-150 ${
                            active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                          }`}
                          draggable={false}
                          priority={idx === 0}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Difficulty Selector */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Difficulty</p>
              <div className="space-y-2">
                {(Object.keys(DIFFICULTY_SPEEDS) as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleDifficultyChange(level)}
                    disabled={running}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      difficulty === level
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                    } ${running ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Best Score Card */}
            <div className="rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-950/50 to-slate-900 p-4 shadow-xl">
              <p className="text-xs text-slate-400 mb-2">Best Performance</p>
              <p className="text-4xl font-bold text-amber-300 mb-2">{highScore}</p>
              <p className="text-xs text-slate-400">Points</p>
            </div>

            {/* Recent Games */}
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Scores</p>
              {scoreHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No games yet. Start playing!</p>
              ) : (
                <ul className="space-y-2">
                  {scoreHistory.slice(0, 5).map((s, i) => (
                    <li key={`${s}-${i}`} className="flex items-center justify-between rounded-lg bg-slate-850 p-2">
                      <span className="text-xs text-slate-400">Game {scoreHistory.length - i}</span>
                      <span className="font-semibold text-emerald-300">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

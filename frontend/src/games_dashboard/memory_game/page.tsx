"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import cardBackImg from "../assets/memory_card.png";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Game configuration
const GRID_SIZE = 16; // 4x4 grid = 8 pairs
const GAME_LENGTH_SECONDS = 120; // 2 minutes
const FLIP_DELAY = 800; // ms before cards flip back

// Layout tuning knobs
const LAYOUT_MAX_WIDTH = "1600px";
const GRID_GAP = "1rem";
const GAME_CARD_PADDING = "1.25rem";
const SIDEBAR_WIDTH = "360px";

// Column width percentages (must add to 100)
const PROGRESS_WIDTH = 52; // %
const GAME_WIDTH = 32; // %
const STATS_WIDTH = 22; // %

// Card symbols (emojis for simplicity)
const CARD_SYMBOLS = ["🎮", "🎯", "🎨", "🎭", "🎪", "🎸", "🎹", "🎺"];

type Card = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function initializeCards(): Card[] {
  const pairs = CARD_SYMBOLS.map((symbol, idx) => [
    { id: idx * 2, symbol, isFlipped: false, isMatched: false },
    { id: idx * 2 + 1, symbol, isFlipped: false, isMatched: false },
  ]).flat();
  return shuffleArray(pairs);
}

export default function MemoryGamePage() {
  const { user } = useUser();
  const [cards, setCards] = useState<Card[]>(initializeCards());
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_LENGTH_SECONDS);
  const [running, setRunning] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [gameHistory, setGameHistory] = useState<
    { moves: number; time: number }[]
  >([]);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [timeHistory, setTimeHistory] = useState<number[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRecordedRef = useRef(false);
  const isProcessing = useRef(false);

  const timeElapsed = GAME_LENGTH_SECONDS - timeLeft;
  const isWon = matches === CARD_SYMBOLS.length;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
    if (isWon && running) {
      setRunning(false);
      if (!sessionRecordedRef.current) {
        const finalTime = timeElapsed;
        const finalMoves = moves;

        setBestMoves((prev) => (prev === null ? finalMoves : Math.min(prev, finalMoves)));
        setBestTime((prev) => (prev === null ? finalTime : Math.min(prev, finalTime)));
        setGameHistory((hist) => [{ moves: finalMoves, time: finalTime }, ...hist].slice(0, 8));
        const finalScore = Math.max(0, CARD_SYMBOLS.length * 30 - finalMoves * 2 - finalTime);
        saveGameSession(finalScore, finalMoves, finalTime, CARD_SYMBOLS.length);
        sessionRecordedRef.current = true;
      }
    }
  }, [isWon, running, moves, timeElapsed]);

  const saveGameSession = async (
    finalScore: number,
    totalMoves: number,
    timeTaken: number,
    pairsMatched: number
  ) => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE_URL}/memory-card/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          final_score: finalScore,
          total_moves: totalMoves,
          pairs_matched: pairsMatched,
          time_taken: timeTaken,
          difficulty: "medium",
          status: "completed",
        }),
      });
    } catch (err) {
      console.error("Failed to save memory game session", err);
    }
  };

  const fetchHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/memory-card/history/${user.id}?limit=8`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          const scores = data.map((g: any) => g.final_score).reverse();
          const accuracies = data
            .map((g: any) => (g.total_moves > 0 ? (g.pairs_matched / (g.total_moves / 2)) * 100 : 0))
            .reverse();
          const times = data.map((g: any) => g.time_taken).reverse();
          setScoreHistory(scores);
          setAccuracyHistory(accuracies);
          setTimeHistory(times);
          setHighScore(Math.max(...scores, 0));
        }
      }
    } catch (err) {
      console.error("Failed to fetch memory game history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCardClick = (cardId: number) => {
    if (!running) return;
    if (isProcessing.current) return;
    if (flippedCards.length >= 2) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      isProcessing.current = true;
      setMoves((m) => m + 1);

      const [first, second] = newFlipped;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard?.symbol === secondCard?.symbol) {
        // Match found
        setCards((prev) =>
          prev.map((c) =>
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          )
        );
        setMatches((m) => m + 1);
        setFlippedCards([]);
        isProcessing.current = false;
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
          isProcessing.current = false;
        }, FLIP_DELAY);
      }
    }
  };

  const handleStart = () => {
    setCards(initializeCards());
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeLeft(GAME_LENGTH_SECONDS);
    setRunning(true);
    sessionRecordedRef.current = false;
    isProcessing.current = false;
  };

  const status = running
    ? "In play"
    : isWon
    ? "Victory!"
    : timeLeft === 0
    ? "Time's up"
    : "Idle";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className="mx-auto grid grid-cols-1 px-4 py-6 md:px-6 lg:grid-cols-3"
        style={{
          maxWidth: LAYOUT_MAX_WIDTH,
          gap: GRID_GAP,
          gridAutoRows: "1fr",
          gridTemplateColumns: `${PROGRESS_WIDTH}% ${GAME_WIDTH}% ${STATS_WIDTH}%`,
        }}
      >
        {/* Progress tracking */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Progress</p>
              <p className="text-lg font-semibold text-slate-100">Memory Game Stats</p>
            </div>
            <button
              onClick={async () => {
                await fetchHistory();
                setShowProgress(true);
              }}
              disabled={isLoadingHistory}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {isLoadingHistory ? "⏳ Loading..." : "📊 View Progress"}
            </button>
          </div>

          {!showProgress || scoreHistory.length === 0 ? (
            <p className="text-sm text-slate-400">Click View Progress to fetch your history.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-wide text-slate-400">
                <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
                  <p>Best Score</p>
                  <p className="text-2xl font-semibold text-indigo-300">{highScore}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
                  <p>Avg Accuracy</p>
                  <p className="text-2xl font-semibold text-emerald-300">
                    {accuracyHistory.length ? (accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
                  <p>Games</p>
                  <p className="text-2xl font-semibold text-cyan-300">{scoreHistory.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-850 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Recent games</p>
                <div className="space-y-2 text-sm text-slate-200">
                  {scoreHistory.slice(0, 5).map((s, i) => (
                    <div key={`${s}-${i}`} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
                      <span className="text-slate-400">Game {scoreHistory.length - i}</span>
                      <div className="flex gap-3 text-xs sm:text-sm">
                        <span className="text-indigo-300">Score {s}</span>
                        <span className="text-emerald-300">Acc {accuracyHistory[i]?.toFixed(0) ?? 0}%</span>
                        <span className="text-cyan-300">Time {timeHistory[i] ?? 0}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game area */}
        <div
          className="rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
          style={{ padding: GAME_CARD_PADDING }}
        >
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 ${
                  isWon
                    ? "bg-amber-400/10 text-amber-200"
                    : "bg-emerald-400/10 text-emerald-200"
                }`}
              >
                {status}
              </span>
              <span className="text-slate-400">
                {matches}/{CARD_SYMBOLS.length} pairs
              </span>
            </div>
            <button
              onClick={handleStart}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              {running ? "Restart" : timeLeft === GAME_LENGTH_SECONDS ? "Start" : "Play again"}
            </button>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-wide text-slate-400">
            <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
              <p>Time</p>
              <p className="text-2xl font-semibold text-slate-100">{timeLeft}s</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
              <p>Moves</p>
              <p className="text-2xl font-semibold text-emerald-300">{moves}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-850 p-3">
              <p>Matches</p>
              <p className="text-2xl font-semibold text-amber-200">{matches}</p>
            </div>
          </div>

          <div
            className="grid grid-cols-4"
            style={{ gap: `calc(${GRID_GAP} * 0.5)` }}
          >
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={!running || card.isMatched}
                className="group relative aspect-2/3 overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed"
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
              >
                {/* Front (revealed symbol) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg text-5xl transition-all duration-500 ${
                    card.isFlipped || card.isMatched
                      ? "rotate-y-0 opacity-100"
                      : "rotate-y-180 opacity-0"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: card.isFlipped || card.isMatched ? "rotateY(0deg)" : "rotateY(180deg)",
                    background: card.isMatched
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.95))"
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.95))",
                  }}
                >
                  {card.symbol}
                </div>

                {/* Back (card image) */}
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-500 ${
                    card.isFlipped || card.isMatched
                      ? "rotate-y-180 opacity-0"
                      : "rotate-y-0 opacity-100"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <Image
                    src={cardBackImg}
                    alt="Card back"
                    fill
                    className="select-none rounded-lg object-contain"
                    draggable={false}
                    priority={card.id < 4}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats sidebar */}
        <div
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          style={{ maxWidth: SIDEBAR_WIDTH }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3rem] text-emerald-300">MindPlay Mini</p>
            <h1 className="text-3xl font-bold text-slate-50">Memory Match</h1>
            <p className="text-sm text-slate-300">
              Find all pairs. Fewer moves, faster wins.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-850 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current moves</p>
            <p className="text-4xl font-semibold text-emerald-300">{moves}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-850 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Best moves</p>
            <p className="text-4xl font-semibold text-amber-200">
              {bestMoves ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-850 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Best time</p>
            <p className="text-4xl font-semibold text-cyan-200">
              {bestTime !== null ? `${bestTime}s` : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-850 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Game history</p>
            {gameHistory.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Finish a game to log records.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {gameHistory.map((record, i) => (
                  <li key={`${record.moves}-${i}`} className="flex items-center justify-between">
                    <span className="text-slate-400">Game {gameHistory.length - i}</span>
                    <span className="font-semibold">
                      {record.moves}m / {record.time}s
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

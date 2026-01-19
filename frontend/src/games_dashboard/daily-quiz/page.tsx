"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "How many grams of protein should an average adult consume daily?",
    options: ["30-50g", "50-65g", "100-150g", "200-250g"],
    correct: 1,
    category: "Nutrition",
  },
  {
    id: 2,
    question: "What is the recommended daily water intake for an adult?",
    options: ["1-2 liters", "2-3 liters", "4-5 liters", "6-7 liters"],
    correct: 1,
    category: "Nutrition",
  },
  {
    id: 3,
    question: "Which nutrient is most important for muscle recovery after a workout?",
    options: ["Carbohydrates", "Protein", "Fat", "Fiber"],
    correct: 1,
    category: "Nutrition",
  },
  {
    id: 4,
    question: "What is the ideal resting heart rate for a healthy adult?",
    options: ["40-50 bpm", "60-100 bpm", "110-120 bpm", "130-140 bpm"],
    correct: 1,
    category: "Gym",
  },
  {
    id: 5,
    question: "How many minutes of moderate cardio is recommended per week?",
    options: ["30 minutes", "75 minutes", "150 minutes", "300 minutes"],
    correct: 2,
    category: "Gym",
  },
  {
    id: 6,
    question: "Which exercise targets the core muscles most effectively?",
    options: ["Running", "Planks", "Bicep curls", "Leg press"],
    correct: 1,
    category: "Gym",
  },
  {
    id: 7,
    question: "What percentage of your daily calories should come from carbohydrates?",
    options: ["20-30%", "45-65%", "70-80%", "90-100%"],
    correct: 1,
    category: "Nutrition",
  },
  {
    id: 8,
    question: "How often should you rest between strength training sessions for the same muscle groups?",
    options: ["Every day", "24 hours", "48 hours", "1 week"],
    correct: 2,
    category: "Gym",
  },
  {
    id: 9,
    question: "Which food is the best source of omega-3 fatty acids?",
    options: ["Chicken", "Salmon", "Rice", "Corn"],
    correct: 1,
    category: "Nutrition",
  },
  {
    id: 10,
    question: "What is the best time to consume a post-workout meal?",
    options: ["30 minutes before", "Immediately after", "Within 30-60 minutes after", "2 hours after"],
    correct: 2,
    category: "Nutrition",
  },
];

export default function DailyQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));

  const handleAnswerClick = (optionIndex: number) => {
    if (answered) return;

    setSelectedAnswer(optionIndex);
    setAnswered(true);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (optionIndex === QUIZ_QUESTIONS[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
      setAnswered(answers[currentQuestion + 1] !== null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
      setAnswered(answers[currentQuestion - 1] !== null);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setQuizCompleted(false);
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
  };

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/games_dashboard"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Daily Quiz</h1>
          <div className="text-sm text-slate-400">
            {quizCompleted ? "Complete" : `Question ${currentQuestion + 1}/10`}
          </div>
        </div>

        {/* Quiz Content */}
        {!quizCompleted ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-sm text-slate-300">
                <span>Progress</span>
                <span>{currentQuestion + 1} of 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <div className="mb-2 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                {question.category}
              </div>
              <h2 className="mt-4 text-xl font-semibold leading-relaxed">{question.question}</h2>
            </div>

            {/* Options */}
            <div className="mb-8 space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correct;
                const showResult = answered;

                let buttonClasses =
                  "w-full rounded-lg border-2 p-4 text-left transition font-medium text-slate-100 ";

                if (!showResult) {
                  buttonClasses +=
                    "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 cursor-pointer";
                } else if (isSelected && isCorrect) {
                  buttonClasses += "border-green-500 bg-green-500/20 cursor-default";
                } else if (isSelected && !isCorrect) {
                  buttonClasses += "border-red-500 bg-red-500/20 cursor-default";
                } else if (isCorrect) {
                  buttonClasses += "border-green-500 bg-green-500/10 cursor-default";
                } else {
                  buttonClasses += "border-white/10 bg-white/5 cursor-default opacity-50";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(index)}
                    disabled={answered}
                    className={buttonClasses}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex-1 rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!answered}
                className="flex-1 rounded-lg border-2 border-green-500/50 bg-green-500/20 px-4 py-3 font-medium text-white transition hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-12 text-center shadow-2xl">
            <div className="mb-6">
              <h2 className="text-4xl font-bold">Quiz Complete! 🎉</h2>
            </div>

            {/* Score Circle */}
            <div className="mb-8 flex justify-center">
              <div className="relative h-40 w-40">
                <div className="absolute inset-0 rounded-full border-8 border-white/10" />
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500"
                  style={{
                    background: `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${(score / 10) * 360}deg, rgba(255,255,255,0.1) ${(score / 10) * 360}deg)`,
                    borderRadius: "50%",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-500">{score}</div>
                    <div className="text-sm text-slate-400">/10</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Message */}
            <div className="mb-8">
              {score === 10 && <p className="text-xl font-semibold text-green-500">Perfect Score! 🌟</p>}
              {score >= 8 && score < 10 && <p className="text-xl font-semibold text-green-500">Excellent! 👏</p>}
              {score >= 6 && score < 8 && <p className="text-xl font-semibold text-yellow-500">Good Job! 👍</p>}
              {score >= 4 && score < 6 && <p className="text-xl font-semibold text-orange-500">Keep Learning! 📚</p>}
              {score < 4 && <p className="text-xl font-semibold text-red-500">Try Again! 💪</p>}

              <p className="mt-3 text-slate-400">
                You answered {score} out of 10 questions correctly. {10 - score} answers need review.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Link
                href="/games_dashboard"
                className="flex-1 rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Back to Games
              </Link>
              <button
                onClick={resetQuiz}
                className="flex-1 rounded-lg border-2 border-green-500/50 bg-green-500/20 px-4 py-3 font-medium text-white transition hover:bg-green-500/30"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

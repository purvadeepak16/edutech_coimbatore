import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, BookOpen, FileText, ChevronRight, Clock } from 'lucide-react';
import './StudyPlanSection.css';

const API_BASE_URL = 'http://localhost:5000/api';

/* ---------- Timeline Item ---------- */
const TimelineItem = ({ time, icon: Icon, title, subtitle, duration, progress, status, color, isLast, onStart }) => (
    <div className="timeline-item">
        <div className="time-column">
            <span className="time-label">{time}</span>
            {!isLast && <div className="time-line"></div>}
        </div>

        <div className="task-card" style={{ backgroundColor: color }}>
            <div className="task-header">
                <div className="task-info">
                    <div className="task-icon">
                        <Icon size={20} color="var(--color-navy)" />
                    </div>
                    <div>
                        <h3>{title}</h3>
                        <span className="task-subtitle">{subtitle}</span>
                    </div>
                </div>
                <div className="task-duration">
                    <Clock size={14} />
                    <span>{duration}</span>
                </div>
            </div>

            {progress !== undefined && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <div className="task-actions">
                {status === 'Pending' ? (
                    <span className="status-pending">⏳ Pending</span>
                ) : (
                    <span className="progress-text">{progress}% Completed</span>
                )}
                <div className="action-buttons">
                    <button className="btn-start" onClick={onStart}>Start</button>
                    <button className="btn-secondary">Reschedule</button>
                </div>
            </div>
        </div>
    </div>
);

/* ---------- Main Section ---------- */
const StudyPlanSection = () => {

    /* ✅ STATE MUST BE INSIDE COMPONENT */
    const { currentUser } = useAuth();
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [taskAudioList, setTaskAudioList] = useState([]);
    const [generatingTaskAudio, setGeneratingTaskAudio] = useState(false);
    // Quiz state
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [remainingSeconds, setRemainingSeconds] = useState(60);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const quizIntervalRef = useRef(null);
    const quizRunningRef = useRef(false);
    const navigate = useNavigate();

    const handleStartReading = () => {
        // Navigate to study-reader page and pass today's tasks via location state
        navigate('/study-reader', { state: { todaysTasks } });
    };

    const handleStartMindmap = () => {
        // Navigate directly to the visual mind map page and pass today's tasks as a combined topic
        if (!todaysTasks || todaysTasks.length === 0) {
            // fallback to mindmap page when there are no tasks
            navigate('/mindmap', { state: { todaysTasks, autoGenerate: true } });
            return;
        }

        const combinedTopic = todaysTasks.map(t => `${t.subject}: ${t.title}`).join('\n');
        navigate(`/visual-map?topic=${encodeURIComponent(combinedTopic)}`);
    };

    /* ✅ Fetch today's tasks on component mount */
    useEffect(() => {
        if (currentUser) {
            fetchAndGenerateTaskAudio();
        }
    }, [currentUser]);

    const fetchAndGenerateTaskAudio = async () => {
        try {
            setGeneratingTaskAudio(true);
            const response = await fetch(`${API_BASE_URL}/syllabus/all-schedules/${currentUser.uid}`);
            const data = await response.json();

            if (data.success && data.schedulesBySubject) {
                const today = new Date().toISOString().split('T')[0];
                const tasksToGenerate = [];

                // Collect all tasks for today from all subjects
                Object.entries(data.schedulesBySubject).forEach(([subject, schedule]) => {
                    const todaySchedule = schedule.find(day => day.date === today);
                    if (todaySchedule && todaySchedule.topicDetails && todaySchedule.topicDetails.length > 0) {
                        todaySchedule.topicDetails.forEach(topic => {
                            tasksToGenerate.push({
                                subject,
                                title: topic.title,
                                difficulty: topic.difficulty,
                                id: topic.id,
                                date: today  // Add date for caching
                            });
                        });
                    }
                });

                setTodaysTasks(tasksToGenerate);

                // Generate audio for each task automatically
                const token = await currentUser.getIdToken();
                const audioResults = [];

                for (const task of tasksToGenerate) {
                    try {
                        const taskText = `${task.subject}: ${task.title}`;
                        
                        // Use structured-notes endpoint with caching
                        const ttsRes = await fetch(`${API_BASE_URL}/tts/structured-notes`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                topic: taskText,
                                userId: currentUser.uid,
                                date: task.date,
                                useCache: true
                            })
                        });

                        if (!ttsRes.ok) {
                            console.error(`TTS failed for ${task.title}`);
                            continue;
                        }

                        const ttsData = await ttsRes.json();
                        
                        audioResults.push({
                            taskTitle: task.title,
                            subject: task.subject,
                            audioUrl: ttsData.audioUrl,
                            difficulty: task.difficulty,
                            cached: ttsData.cached || false
                        });

                    } catch (error) {
                        console.error(`Failed to generate audio for ${task.title}:`, error);
                    }
                }

                setTaskAudioList(audioResults);
            }
        } catch (error) {
            console.error('Failed to fetch and generate task audio:', error);
        } finally {
            setGeneratingTaskAudio(false);
        }
    };

    /* ---------- QUIZ GENERATION & UI ---------- */
    const startLocalTimer = () => {
        if (quizRunningRef.current) return;
        quizRunningRef.current = true;
        quizIntervalRef.current = setInterval(() => {
            setRemainingSeconds(s => {
                if (s <= 1) {
                    clearInterval(quizIntervalRef.current);
                    quizIntervalRef.current = null;
                    quizRunningRef.current = false;
                    // Auto-submit when time's up
                    handleSubmitQuiz();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    };

    const stopLocalTimer = () => {
        if (quizIntervalRef.current) {
            clearInterval(quizIntervalRef.current);
            quizIntervalRef.current = null;
        }
        quizRunningRef.current = false;
    };

    useEffect(() => {
        const handleVisibility = () => {
            if (!showQuizModal) return;
            if (document.visibilityState === 'hidden') stopLocalTimer();
            else startLocalTimer();
        };
        window.addEventListener('blur', stopLocalTimer);
        window.addEventListener('focus', () => { if (showQuizModal) startLocalTimer(); });
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('blur', stopLocalTimer);
            window.removeEventListener('focus', startLocalTimer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showQuizModal]);

    const fetchGenerateQuiz = async () => {
        if (!todaysTasks || todaysTasks.length === 0) {
            alert('No topics found for today to generate a quiz.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/assessments/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: 'basic', todaysTasks })
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('Quiz generation failed', data);
                alert('Failed to generate quiz');
                return;
            }

            // Normalize questions: ensure 10 questions, each has 4 options
            const questions = (data.questions || []).slice(0, 10).map(q => ({
                question: q.question || q.prompt || 'Question',
                options: (q.options && q.options.length === 4) ? q.options : (q.choices || q.answers || ['A','B','C','D']).slice(0,4),
                correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
                marks: q.marks || 1
            }));

            setQuizQuestions(questions);
            setSelectedAnswers(new Array(questions.length).fill(null));
            setRemainingSeconds(60);
            setShowQuizModal(true);
            // start timer
            startLocalTimer();
        } catch (err) {
            console.error('Failed to generate quiz:', err);
            alert('Quiz generation error');
        }
    };

    const handleSelectAnswer = (qIndex, optIndex) => {
        setSelectedAnswers(prev => {
            const next = [...prev];
            next[qIndex] = optIndex;
            return next;
        });
    };

    const handleSubmitQuiz = async () => {
        if (submittingQuiz) return;
        stopLocalTimer();
        setSubmittingQuiz(true);
        try {
            // compute score
            let score = 0;
            quizQuestions.forEach((q, i) => { if (selectedAnswers[i] === q.correctIndex) score += (q.marks || 1); });

            // save quiz to backend (which persists to Firestore)
            const payload = { userId: currentUser?.uid || 'anonymous', title: `Auto Quiz ${new Date().toISOString()}`, questions: quizQuestions };
            const res = await fetch(`${API_BASE_URL}/assessments/save-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('Failed to save quiz', data);
                alert('Failed to save quiz to database');
            } else {
                // Optionally record the attempt locally or show score
                alert(`Quiz submitted. Score: ${score}/${quizQuestions.length}`);
            }
        } catch (err) {
            console.error('Submit quiz error', err);
            alert('Error submitting quiz');
        } finally {
            setSubmittingQuiz(false);
            setShowQuizModal(false);
        }
    };

        /* Text-to-audio was moved to a dedicated page */






    return (
        <section className="study-plan-section">

            {/* HEADER */}
            <div className="section-header">
                <div>
                    <h2>📅 Today's Plan</h2>
                    <p>You're on track! 4 hours remaining</p>
                </div>
                <div className="status-badge">
                    🟢 Well Balanced
                </div>
            </div>

            {/* Text-to-audio moved to its own page: /text-to-speech */}

            {/* 🎧 AUTO-GENERATED TASK AUDIO SECTION */}
            {generatingTaskAudio && (
                <div className="task-audio-section">
                    <div className="loading-spinner">
                        <p>🎵 Generating audio for today's tasks...</p>
                    </div>
                </div>
            )}

            {taskAudioList.length > 0 && (
                <div className="task-audio-section">
                    <h3 className="task-audio-title">🎧 Today's Task Audio</h3>
                    <div className="task-audio-list">
                        {taskAudioList.map((item, index) => (
                            <div key={index} className="task-audio-item">
                                <div className="task-audio-header">
                                    <div className="task-audio-info">
                                        <h4>{item.taskTitle}</h4>
                                        <span className="task-subject">{item.subject}</span>
                                        {item.difficulty && (
                                            <span className={`diff-badge diff-${item.difficulty}`}>
                                                {item.difficulty}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <audio controls src={item.audioUrl} className="task-audio-player" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TIMELINE */}
            <div className="timeline">
                <TimelineItem
                    time="3:30 PM"
                    icon={BookOpen}
                    title="Reading Notes"
                    subtitle="Chemistry - Bonding"
                    duration="1 hour"
                    progress={0}
                    color="var(--color-soft-blue-light)"
                    onStart={() => handleStartReading()}
                />
                <TimelineItem
                    time="3:50 PM"
                    icon={Headphones}
                    title="Study with Mindmap"
                    subtitle="Generate learning & visual maps"
                    duration="40 min"
                    progress={0}
                    color="var(--color-soft-cream)"
                    onStart={() => handleStartMindmap()}
                />
                <TimelineItem
                    time="4:30 PM"
                    icon={FileText}
                    title="Assessment"
                    subtitle="Biology Ch. 5 - Basic Test"
                    duration="30 min"
                    status="Pending"
                    color="var(--color-cream)"
                    isLast
                    onStart={() => navigate('/assessments', { state: { todaysTasks } })}
                />
            </div>

            <div style={{ marginTop: 16 }}>
                <button className="btn-start" onClick={fetchGenerateQuiz}>Generate 10-question Quiz</button>
            </div>

            {/* Quiz Modal */}
            {showQuizModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-card quiz-modal">
                        <div className="modal-header">
                            <h3>Timed Quiz — 10 MCQs</h3>
                            <div className="quiz-timer">Time left: {remainingSeconds}s</div>
                        </div>
                        <div className="modal-body">
                            {quizQuestions.map((q, qi) => (
                                <div key={qi} className="quiz-question">
                                    <p className="q-text">{qi+1}. {q.question}</p>
                                    <div className="q-options">
                                        {q.options.map((opt, oi) => (
                                            <label key={oi} className={`q-option ${selectedAnswers[qi]===oi? 'selected':''}`}>
                                                <input type="radio" name={`q${qi}`} checked={selectedAnswers[qi]===oi} onChange={() => handleSelectAnswer(qi, oi)} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <div className="modal-actions-right">
                                <button className="btn-secondary" onClick={() => { stopLocalTimer(); setShowQuizModal(false); }}>Cancel</button>
                                <button className="btn-start" onClick={handleSubmitQuiz} disabled={submittingQuiz}>{submittingQuiz ? 'Submitting...' : 'Submit'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button className="view-full-week">
                View full week schedule <ChevronRight size={16} />
            </button>
        </section>
    );
};

export default StudyPlanSection;

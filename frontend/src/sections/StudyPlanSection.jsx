import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

import React, { useState, useEffect } from 'react';
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
    const navigate = useNavigate();

    const handleStartReading = () => {
        // Navigate to study-reader page and pass today's tasks via location state
        navigate('/study-reader', { state: { todaysTasks } });
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
                                id: topic.id
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
                        
                        // Save note to Firestore
                        const userEntriesRef = collection(
                            db,
                            "notes",
                            "audioNotes",
                            "users",
                            currentUser.uid,
                            "entries"
                        );

                        const docRef = await addDoc(userEntriesRef, {
                            text: taskText,
                            type: "daily-task-audio",
                            taskId: task.id,
                            status: "generating-conversation",
                            createdAt: serverTimestamp()
                        });

                        // Generate conversation
                        const conversationRes = await fetch(`${API_BASE_URL}/openrouter/conversation`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                noteId: docRef.id,
                                noteText: taskText
                            })
                        });

                        if (!conversationRes.ok) continue;

                        const conversationData = await conversationRes.json();

                        // Generate TTS
                        const ttsRes = await fetch(`${API_BASE_URL}/tts/conversation`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                noteId: docRef.id
                            })
                        });

                        if (!ttsRes.ok) continue;

                        const ttsData = await ttsRes.json();
                        
                        audioResults.push({
                            taskTitle: task.title,
                            subject: task.subject,
                            audioUrl: ttsData.audioUrl,
                            difficulty: task.difficulty
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
                    time="4:30 PM"
                    icon={FileText}
                    title="Assessment"
                    subtitle="Biology Ch. 5 - Basic Test"
                    duration="30 min"
                    status="Pending"
                    color="var(--color-cream)"
                    isLast
                />
            </div>

            <button className="view-full-week">
                View full week schedule <ChevronRight size={16} />
            </button>
        </section>
    );
};

export default StudyPlanSection;

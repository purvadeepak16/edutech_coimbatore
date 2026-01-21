import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

import React, { useState } from 'react';
import { Headphones, BookOpen, FileText, ChevronRight, Clock } from 'lucide-react';
import './StudyPlanSection.css';

/* ---------- Timeline Item ---------- */
const TimelineItem = ({ time, icon: Icon, title, subtitle, duration, progress, status, color, isLast }) => (
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
                    <button className="btn-start">Start</button>
                    <button className="btn-secondary">Reschedule</button>
                </div>
            </div>
        </div>
    </div>
);

/* ---------- Main Section ---------- */
const StudyPlanSection = () => {

    /* ✅ STATE MUST BE INSIDE COMPONENT */
    const [noteText, setNoteText] = useState('');
    const [audioList, setAudioList] = useState([]);
const { currentUser } = useAuth();
const [audioUrl, setAudioUrl] = useState(null);

    /* ✅ HANDLER MUST BE INSIDE COMPONENT */
const handleGenerateAudio = async () => {
  if (!noteText.trim()) return;

  if (!currentUser) {
    alert("Please login to save notes");
    return;
  }

  try {
    // 1️⃣ Save note to Firestore
    const userEntriesRef = collection(
      db,
      "notes",
      "audioNotes",
      "users",
      currentUser.uid,
      "entries"
    );

    const docRef = await addDoc(userEntriesRef, {
      text: noteText,
      type: "text-to-audio",
      status: "generating-conversation",
      createdAt: serverTimestamp()
    });

    const token = await currentUser.getIdToken();

    // 2️⃣ Generate conversation with OpenRouter
    console.log("📝 Generating conversation...");
    const conversationRes = await fetch("http://localhost:5000/api/openrouter/conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        noteId: docRef.id,
        noteText
      })
    });

    if (!conversationRes.ok) {
      const error = await conversationRes.json();
      throw new Error(`Conversation generation failed: ${error.error}`);
    }

    const conversationData = await conversationRes.json();
    console.log("✅ Conversation generated:", conversationData);

    // 3️⃣ Generate TTS from conversation using backend endpoint
    console.log("🎤 Generating audio from conversation...");
    const ttsRes = await fetch("http://localhost:5000/api/tts/conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        noteId: docRef.id
      })
    });

    if (!ttsRes.ok) {
      const error = await ttsRes.json();
      throw new Error(`TTS generation failed: ${error.error}`);
    }

    const ttsData = await ttsRes.json();
    console.log("✅ Audio generated:", ttsData);
    
    setAudioUrl(ttsData.audioUrl);
    setNoteText("");
    alert("✅ Audio generated successfully! Playing now...");

  } catch (error) {
    console.error("❌ Generation failed:", error);
    alert(`Error: ${error.message}`);
  }
};






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

            {/* TEXT TO AUDIO FEATURE (BELOW HEADER) */}
            <div className="text-to-audio-card">
                <div className="text-to-audio-header">
                    <h3>🎧 Text to Audio Learning</h3>
                    <span className="text-to-audio-subtitle">
                        Paste your notes and listen anytime
                    </span>
                </div>

                <textarea
                    className="text-to-audio-input"
                    placeholder="Paste your study notes here..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />

                <div className="text-to-audio-actions">
                    <button className="btn-start" onClick={handleGenerateAudio}>
                        Generate Audio
                    </button>
                </div>
                {/* 🔊 Actual generated TTS audio */}
{audioUrl && (
  <div className="generated-audio-item">
    <p>🎧 Generated Audio</p>
    <audio controls src={audioUrl} />
  </div>
)}


            </div>

            {/* TIMELINE */}
            <div className="timeline">
                <TimelineItem
                    time="2:00 PM"
                    icon={Headphones}
                    title="Audio Learning"
                    subtitle="Biology - Chapter 5: Cells"
                    duration="1.5 hours"
                    progress={45}
                    color="var(--color-soft-pink-light)"
                />
                <TimelineItem
                    time="3:30 PM"
                    icon={BookOpen}
                    title="Reading Notes"
                    subtitle="Chemistry - Bonding"
                    duration="1 hour"
                    progress={0}
                    color="var(--color-soft-blue-light)"
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

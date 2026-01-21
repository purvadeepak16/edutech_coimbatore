import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import './TextToSpeechPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function TextToSpeechPage() {
  const { currentUser } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  const handleGenerateAudio = async () => {
    if (!noteText.trim()) return;
    if (!currentUser) {
      alert('Please login to save notes');
      return;
    }

    try {
      const userEntriesRef = collection(
        db,
        'notes',
        'audioNotes',
        'users',
        currentUser.uid,
        'entries'
      );

      const docRef = await addDoc(userEntriesRef, {
        text: noteText,
        type: 'text-to-audio',
        status: 'generating-conversation',
        createdAt: serverTimestamp()
      });

      const token = await currentUser.getIdToken();

      const conversationRes = await fetch(`${API_BASE_URL}/openrouter/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ noteId: docRef.id, noteText })
      });

      if (!conversationRes.ok) {
        const error = await conversationRes.json();
        throw new Error(`Conversation generation failed: ${error.error}`);
      }

      const ttsRes = await fetch(`${API_BASE_URL}/tts/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ noteId: docRef.id })
      });

      if (!ttsRes.ok) {
        const error = await ttsRes.json();
        throw new Error(`TTS generation failed: ${error.error}`);
      }

      const ttsData = await ttsRes.json();
      setAudioUrl(ttsData.audioUrl);
      setNoteText('');
      alert('✅ Audio generated successfully!');
    } catch (err) {
      console.error('TTS generation failed', err);
      alert('Failed to generate audio: ' + (err.message || err));
    }
  };

  return (
    <section className="text-to-speech-page">
      <div className="section-header">
        <div>
          <h2>🎤 Text to Speech</h2>
          <p>Paste your notes and generate a podcast-ready audio.</p>
        </div>
      </div>

      <div className="text-to-audio-card">
        <div className="text-to-audio-header">
          <h3>🎧 Text to Audio Learning</h3>
          <span className="text-to-audio-subtitle">Paste your notes and listen anytime</span>
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

        {audioUrl && (
          <div className="generated-audio-item">
            <p>🎧 Generated Audio</p>
            <audio controls src={audioUrl} />
          </div>
        )}
      </div>
    </section>
  );
}

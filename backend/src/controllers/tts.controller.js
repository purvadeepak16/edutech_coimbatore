import fetch from 'node-fetch';
import admin from 'firebase-admin';

/**
 * Generate TTS audio from stored conversation
 * Fetches the conversation dialogue from Firestore and converts to audio
 */
export async function generateTTSFromConversation(req, res) {
  try {
    const { noteId } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'noteId is required' });
    }

    // 🔐 Verify Firebase token
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    // 🔥 Fetch the note with conversation from Firestore
    const noteRef = admin
      .firestore()
      .collection('notes')
      .doc('audioNotes')
      .collection('users')
      .doc(userId)
      .collection('entries')
      .doc(noteId);

    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const noteData = noteDoc.data();
    
    if (!noteData.conversation || !noteData.conversation.dialogue) {
      return res.status(400).json({ 
        error: 'Conversation not found for this note. Generate conversation first.' 
      });
    }

    // 🎙️ Convert conversation dialogue to plain text
    const dialogueArray = noteData.conversation.dialogue;
    
    let conversationText = '';
    dialogueArray.forEach((item, index) => {
      const speaker = item.role === 'student' ? 'Student' : 'Teacher';
      conversationText += `${speaker}: ${item.text}\n`;
    });

    // 🌐 Call Python TTS service
    const ttsResponse = await fetch('http://127.0.0.1:5001/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: conversationText })
    });

    if (!ttsResponse.ok) {
      const text = await ttsResponse.text();
      console.error('TTS service HTTP error:', ttsResponse.status, text);
      return res.status(500).json({ 
        error: 'TTS service failed',
        status: ttsResponse.status,
        body: text 
      });
    }

    let ttsData;
    try {
      ttsData = await ttsResponse.json();
    } catch (err) {
      const text = await ttsResponse.text().catch(() => '');
      console.error('TTS JSON parse error:', err, 'Raw:', text);
      return res.status(500).json({ error: 'Failed to parse TTS response', details: err.message, body: text });
    }

    // ✅ Update note with audio URL
    await noteRef.update({
      audio: {
        url: ttsData.url,
        filename: ttsData.filename,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    return res.json({
      success: true,
      audioUrl: ttsData.url,
      filename: ttsData.filename
    });

  } catch (err) {
    console.error('TTS generation failed:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}

/**
 * Direct TTS generation for plain text
 * For simple text-to-speech without conversation
 */
export async function generateTTSFromText(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 🌐 Call Python TTS service
    const ttsResponse = await fetch('http://127.0.0.1:5001/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      console.error('TTS service error:', errorData);
      return res.status(500).json({ 
        error: 'TTS service failed',
        details: errorData 
      });
    }

    const ttsData = await ttsResponse.json();

    return res.json({
      success: true,
      audioUrl: ttsData.url,
      filename: ttsData.filename
    });

  } catch (err) {
    console.error('TTS generation failed:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}

import fetch from 'node-fetch';
import admin from 'firebase-admin';

/**
 * Generate conversation and update note document
 */
export async function generateConversation(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key missing' });
    }

    const { noteId, noteText } = req.body;
    if (!noteId || !noteText) {
      return res.status(400).json({ error: 'noteId and noteText are required' });
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

    // 🧠 Prompt for student–teacher conversation
    const prompt = `
Convert the following study notes into a conversation.

Rules:
- Two speakers only
- Speaker 1: Student asking short, clear questions
- Speaker 2: Teacher explaining simply
- Do NOT add extra information
- Output JSON array only

Format:
[
  { "role": "student", "text": "..." },
  { "role": "teacher", "text": "..." }
]

Notes:
${noteText}
`;

    // 🌐 Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenRouter HTTP error:', response.status, text);
      return res.status(500).json({ error: 'OpenRouter request failed', status: response.status, body: text });
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error('OpenRouter JSON parse error:', err);
      return res.status(500).json({ error: 'Failed to parse OpenRouter response JSON', details: err.message });
    }

    let rawText =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      '';

    // 🧹 Parse JSON safely
    let conversation;
    try {
      conversation = JSON.parse(rawText);
    } catch (err) {
      console.error('Conversation parse failed. Raw:', rawText);
      return res.status(500).json({
        error: 'Failed to parse conversation',
        raw: rawText,
        details: err.message
      });
    }

    // 🔥 Update SAME note document
    const noteRef = admin
      .firestore()
      .collection('notes')
      .doc('audioNotes')
      .collection('users')
      .doc(userId)
      .collection('entries')
      .doc(noteId);

    await noteRef.update({
      conversation: {
        model: 'openrouter',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dialogue: conversation
      }
    });

    return res.json({
      success: true,
      conversation
    });

  } catch (err) {
    console.error('Conversation generation failed:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

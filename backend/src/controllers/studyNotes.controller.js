import fetch from 'node-fetch';
import crypto from 'crypto';
import admin from '../config/firebase.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const defaultModel = 'gpt-4o-mini';

function ensureDate(date) {
  if (date) return date;
  return new Date().toISOString().split('T')[0];
}

function buildSignature(tasks = [], prompt = '') {
  const normalizedTasks = Array.isArray(tasks)
    ? tasks.map((t) => ({
        subject: t.subject || t.unitName || 'Unknown Subject',
        title: t.title || t.originalTitle || t.name || '',
        difficulty: t.difficulty || '',
        id: t.id || t.topicId || ''
      }))
    : [];
  const source = JSON.stringify(normalizedTasks) + '|' + (prompt || '');
  return crypto.createHash('sha256').update(source).digest('hex').slice(0, 12);
}

function extractAssistantText(json) {
  if (json?.choices && json.choices[0]) {
    const ch = json.choices[0];
    if (ch.message) {
      const msg = ch.message;
      if (typeof msg === 'string') return msg;
      // Extract content from message
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        const content = msg.content.find((c) => c.type === 'output_text') || msg.content[0];
        return content?.text || content?.content || JSON.stringify(content);
      }
      if (msg.content && (msg.content.text || msg.content[0]?.text)) {
        return msg.content.text || msg.content[0].text;
      }
      return JSON.stringify(msg);
    }
    if (ch.text) return ch.text;
    if (ch.delta) return ch.delta.content || JSON.stringify(ch.delta);
  }
  // If json is already a string, return it
  if (typeof json === 'string') return json;
  return JSON.stringify(json);
}

export async function generateStudyNotesWithCache(req, res) {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tasks = [], prompt, model, date } = req.body || {};

    if ((!tasks || tasks.length === 0) && !prompt) {
      return res.status(400).json({ error: 'tasks or prompt is required' });
    }

    const resolvedDate = ensureDate(date);
    const promptText = prompt || buildPromptFromTasks(tasks);
    const signature = buildSignature(tasks, promptText);
    const docId = `${resolvedDate}_${signature}`;

    const docRef = admin
      .firestore()
      .collection('dailyStudyNotes')
      .doc(userId)
      .collection('entries')
      .doc(docId);

    const cached = await docRef.get();
    if (cached.exists) {
      const data = cached.data();
      return res.json({
        success: true,
        cached: true,
        notes: data.notes,
        prompt: data.prompt,
        date: data.date,
        tasks: data.tasks,
        id: docId
      });
    }

    const body = {
      model: model || defaultModel,
      messages: [{ role: 'user', content: promptText }]
    };

    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const json = await r.json();

    if (!r.ok) {
      const msg = json?.error || 'Failed to generate notes';
      return res.status(r.status || 500).json({ error: msg, details: json });
    }

    const notes = extractAssistantText(json);

    if (!notes) {
      return res.status(500).json({ error: 'No notes returned from AI' });
    }

    await docRef.set({
      userId,
      date: resolvedDate,
      prompt: promptText,
      tasks: Array.isArray(tasks) ? tasks : [],
      notes,
      model: body.model,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      cached: false,
      notes,
      prompt: promptText,
      date: resolvedDate,
      id: docId
    });
  } catch (err) {
    console.error('Study notes generation failed:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

function buildPromptFromTasks(tasks) {
  if (!tasks || tasks.length === 0) return '';
  const lines = ["Today's Study Plan:"];
  tasks.forEach((t, i) => {
    const subject = t.subject || t.unitName || 'Unknown Subject';
    const title = t.title || t.originalTitle || t.name || '';
    const diff = t.difficulty ? ` (${t.difficulty})` : '';
    lines.push(`${i + 1}. ${subject}: ${title}${diff}`);
  });
  lines.push('\nPlease summarize these into structured study notes: for each item give a short summary, 3 bullet points and 1 key definition.');
  return lines.join('\n');
}

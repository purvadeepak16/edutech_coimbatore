import express from 'express';
import fetch from 'node-fetch';
import { generateConversation } from '../controllers/openrouter.controller.js';

const router = express.Router();

// POST /conversation - generate student-teacher conversation
router.post('/conversation', generateConversation);

// POST /ask - proxy a prompt to OpenRouter (server-side key required)
router.post('/ask', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured on server' });

  const { prompt, model } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt in request body' });

  // Mock mode for network issues
  const useMock = process.env.USE_MOCK_AI === 'true';
  if (useMock) {
    return res.json({ 
      answer: `Mock AI Response: I understand you're asking about "${prompt}". This is a test response since OpenRouter API is unreachable. The actual AI would provide a detailed, context-aware answer here.`,
      mock: true 
    });
  }

  try {
    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const json = await r.json();

    // Check for API errors (insufficient credits, etc.)
    if (json?.error) {
      console.error('OpenRouter API error:', json.error);
      return res.status(402).json({ 
        error: json.error.message || 'OpenRouter API error',
        code: json.error.code,
        raw: json 
      });
    }

    // Try to extract a reasonable assistant text from common response shapes
    let assistantText = '';
    if (json?.choices && json.choices[0]) {
      const ch = json.choices[0];
      if (ch.message) {
        const msg = ch.message;
        if (typeof msg === 'string') assistantText = msg;
        else if (Array.isArray(msg.content)) {
          const content = msg.content.find(c => c.type === 'output_text') || msg.content[0];
          assistantText = content?.text || content?.content || JSON.stringify(content);
        } else if (msg.content && (msg.content.text || msg.content[0]?.text)) {
          assistantText = msg.content.text || msg.content[0].text;
        } else {
          assistantText = JSON.stringify(msg);
        }
      } else if (ch.text) assistantText = ch.text;
      else if (ch.delta) assistantText = ch.delta.content || JSON.stringify(ch.delta);
    }

    return res.json({ answer: assistantText, raw: json });
  } catch (err) {
    console.error('OpenRouter proxy error:', err?.message || err);
    
    let errorMsg = 'OpenRouter request failed';
    if (err.code === 'ENOTFOUND') {
      errorMsg = 'Cannot reach OpenRouter API. Check your internet connection or firewall settings.';
    } else if (err.code === 'ECONNREFUSED') {
      errorMsg = 'Connection to OpenRouter API was refused.';
    } else if (err.message) {
      errorMsg = err.message;
    }
    
    return res.status(500).json({ error: errorMsg, details: err?.message });
  }
});

export default router;

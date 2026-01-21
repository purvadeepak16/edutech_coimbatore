import fetch from 'node-fetch';

/**
 * POST /api/assessments/generate-quiz
 * Body: { level: 'basic'|'advanced'|'scenario', todaysTasks: [{subject,title,...}] }
 * Returns: { questions: [ { question, options, correctIndex, marks } ] }
 */
export async function generateQuiz(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const { level = 'basic', todaysTasks = [] } = req.body || {};

    // Minimal validation
    if (!Array.isArray(todaysTasks)) return res.status(400).json({ error: 'todaysTasks must be an array' });

    // Build a concise prompt for the AI
    const subjects = Array.from(new Set(todaysTasks.map(t => t.subject).filter(Boolean)));
    const topicHint = subjects.length > 0 ? subjects.join(', ') : 'General Knowledge';

    const useMock = process.env.USE_MOCK_AI === 'true';
    if (useMock || !apiKey) {
      // Return a simple mocked quiz
      const mock = Array.from({ length: level === 'scenario' ? 2 : 10 }).map((_, i) => ({
        question: `${level} mock question ${i+1} about ${topicHint}`,
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        marks: level === 'basic' ? 1 : level === 'advanced' ? 2 : 5
      }));
      return res.json({ questions: mock, mock: true });
    }

    const prompt = `You are an assessment generator. Produce a JSON array of ${level === 'scenario' ? '1-2' : '10'} multiple-choice questions for students. Use only the subjects (comma-separated): ${topicHint} as the domain. Output MUST be valid JSON only (no commentary) in this format:\n[ { "question": "...", "options": ["a","b","c","d"], "correctIndex": 0, "marks": 1 }, ... ]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenRouter quiz generation HTTP error', response.status, text);
      return res.status(502).json({ error: 'AI provider returned error', status: response.status, body: text });
    }

    const data = await response.json();

    // Extract assistant text robustly (same logic used by openrouter proxy)
    let assistantText = '';
    if (data?.choices && data.choices[0]) {
      const ch = data.choices[0];
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
    const raw = assistantText || '';

    // Try to parse JSON from raw
    let questions = null;
    try {
      // If content is an array already
      if (Array.isArray(raw)) questions = raw;
      else if (typeof raw === 'string') {
        // Try to locate the JSON substring
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        const jsonText = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;
        questions = JSON.parse(jsonText);
      }
    } catch (err) {
      console.error('Failed to parse AI quiz JSON:', err, 'raw:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response', raw });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'AI returned no questions', raw: questions });
    }

    return res.json({ questions });
  } catch (err) {
    console.error('generateQuiz error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}

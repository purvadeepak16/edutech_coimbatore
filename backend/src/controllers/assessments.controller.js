import fetch from 'node-fetch';

/**
 * POST /api/assessments/generate-quiz
 * Body: { level: 'basic'|'advanced'|'scenario', todaysTasks: [{subject,title,...}] }
 * Returns: { questions: [ { question, options, correctIndex, marks } ] }
 */
export async function generateQuiz(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const { level = 'basic', todaysTasks = [], userId } = req.body || {};

    // Minimal validation
    if (!Array.isArray(todaysTasks)) return res.status(400).json({ error: 'todaysTasks must be an array' });

    // Build detailed topic context from today's tasks
    const topics = todaysTasks.map(t => `${t.subject}: ${t.title}`).filter(Boolean);
    const topicList = topics.length > 0 ? topics.join(', ') : 'General Knowledge';
    
    console.log('🎯 Generating quiz for topics:', topicList);

    if (!apiKey) {
      console.warn('⚠️ No OPENROUTER_API_KEY found, returning mock data');
      const mock = Array.from({ length: 10 }).map((_, i) => ({
        question: `Question ${i+1}: What is a key concept related to ${topicList}?`,
        options: [
          `Understanding fundamental principles of the topic`,
          `An unrelated concept`,
          `A different subject matter`,
          `Something completely different`
        ],
        correctIndex: 0,
        marks: 1
      }));
      
      // Save mock quiz to Firebase
      let quizId = null;
      if (userId) {
        try {
          quizId = await saveGeneratedQuiz(userId, { 
            title: `Quiz: ${topicList}`, 
            questions: mock,
            level,
            topics: todaysTasks,
            mock: true
          });
          console.log('✅ Saved mock quiz to Firebase:', quizId);
        } catch (err) {
          console.error('Failed to save mock quiz:', err);
        }
      }
      
      return res.json({ questions: mock, mock: true, quizId });
    }

    // Create a detailed prompt for AI
    const prompt = `Generate exactly 10 multiple-choice quiz questions about the following topics: ${topicList}.

Requirements:
- Each question should test understanding of the specific topic mentioned
- Provide 4 answer options for each question (full sentences, not just letters)
- Make the options realistic and educational
- The correct answer should be accurate and verifiable
- Difficulty level: ${level}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation, no code blocks):
[
  {
    "question": "Your question text here?",
    "options": ["Full option 1 text", "Full option 2 text", "Full option 3 text", "Full option 4 text"],
    "correctIndex": 0,
    "marks": 1
  }
]`;

    console.log('🤖 Calling OpenRouter API with GPT-3.5-turbo...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'StudySync Quiz Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ OpenRouter API error:', response.status, text);
      return res.status(502).json({ error: 'AI provider error', status: response.status });
    }

    const data = await response.json();
    console.log('✅ OpenRouter response received');

    // Extract the AI's response text
    let assistantText = '';
    if (data?.choices?.[0]?.message?.content) {
      assistantText = data.choices[0].message.content;
    } else {
      console.error('❌ Unexpected API response structure:', JSON.stringify(data).substring(0, 200));
      return res.status(500).json({ error: 'Unexpected API response format' });
    }

    console.log('📝 Raw AI response preview:', assistantText.substring(0, 300));

    // Clean and parse the response
    let cleanedText = assistantText.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON array if embedded in text
    const arrayMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      cleanedText = arrayMatch[0];
    }

    let questions = null;
    try {
      questions = JSON.parse(cleanedText);
      console.log(`✅ Successfully parsed ${questions.length} questions from AI`);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError.message);
      console.error('Cleaned text sample:', cleanedText.substring(0, 500));
      
      const mock = Array.from({ length: 10 }).map((_, i) => ({
        question: `Question ${i+1}: What is a key concept related to ${topicList}?`,
        options: [
          `Understanding fundamental principles of the topic`,
          `An unrelated concept`,
          `A different subject matter`,
          `Something completely different`
        ],
        correctIndex: 0,
        marks: 1
      }));
      
      let quizId = null;
      if (userId) {
        try {
          quizId = await saveGeneratedQuiz(userId, { 
            title: `Quiz: ${topicList}`, 
            questions: mock,
            level,
            topics: todaysTasks,
            mock: true,
            parseError: parseError.message
          });
        } catch (err) {
          console.error('Failed to save fallback quiz:', err);
        }
      }
      
      return res.json({ questions: mock, mock: true, parseError: parseError.message, quizId });
    }

    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('❌ AI returned invalid question format');
      const mock = Array.from({ length: 10 }).map((_, i) => ({
        question: `Question ${i+1}: What is a key concept related to ${topicList}?`,
        options: [
          `Understanding fundamental principles of the topic`,
          `An unrelated concept`,
          `A different subject matter`,
          `Something completely different`
        ],
        correctIndex: 0,
        marks: 1
      }));
      
      let quizId = null;
      if (userId) {
        try {
          quizId = await saveGeneratedQuiz(userId, { 
            title: `Quiz: ${topicList}`, 
            questions: mock,
            level,
            topics: todaysTasks,
            mock: true
          });
        } catch (err) {
          console.error('Failed to save fallback quiz:', err);
        }
      }
      
      return res.json({ questions: mock, mock: true, quizId });
    }

    // Normalize questions structure
    questions = questions.slice(0, 10).map(q => ({
      question: q.question || 'Question text missing',
      options: Array.isArray(q.options) && q.options.length >= 4 
        ? q.options.slice(0, 4) 
        : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      marks: q.marks || 1
    }));

    console.log(`✅ Successfully generated ${questions.length} AI questions`);
    
    // Save to Firebase
    let quizId = null;
    if (userId) {
      try {
        quizId = await saveGeneratedQuiz(userId, { 
          title: `Quiz: ${topicList}`, 
          questions,
          level,
          topics: todaysTasks,
          aiGenerated: true
        });
        console.log('✅ Saved AI quiz to Firebase:', quizId);
      } catch (err) {
        console.error('Failed to save AI quiz:', err);
      }
    }
    
    return res.json({ questions, aiGenerated: true, quizId });
  } catch (err) {
    console.error('generateQuiz error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}

import { saveGeneratedQuiz } from '../services/firestoreService.js';

/**
 * POST /api/assessments/save-quiz
 * Body: { userId, title, questions }
 */
export async function saveQuiz(req, res) {
  try {
    const { userId, title = 'Auto-generated Quiz', questions = [] } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ error: 'questions required' });

    const id = await saveGeneratedQuiz(userId, { title, questions });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('saveQuiz error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

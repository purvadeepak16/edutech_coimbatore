import fetch from 'node-fetch';
import admin from 'firebase-admin';

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Generate in-depth notes using OpenRouter, then convert to TTS
 * Enriches a simple task/topic into structured educational dialogue
 */
export async function generateEnrichedTTS(req, res) {
  try {
    const { task, topic } = req.body;

    if (!task && !topic) {
      return res.status(400).json({ error: 'task or topic is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const enrichmentTopic = task || topic;

    // Step 1: Call OpenRouter to generate in-depth notes
    console.log(`🎓 Enriching topic: ${enrichmentTopic}`);
    
    const enrichmentPrompt = `Create comprehensive in-depth educational notes on "${enrichmentTopic}" in the format of a teacher-student dialogue.

Format your response as a series of alternating teacher and student exchanges:
Teacher: [Question or teaching point]
Student: [Response or acknowledgment]

Requirements:
- Generate 25-35 exchanges (enough for approximately 5 minutes of audio conversation)
- Make it highly interactive and engaging with questions, answers, and follow-up discussions
- Cover key concepts, detailed explanations, real-world examples, applications, and practical benefits
- Build understanding progressively from basics to advanced topics
- Include clarifying questions from student, interesting facts from teacher
- Aim for approximately 800-1000 total words of dialogue
- Each exchange should be 25-50 words for natural speaking

Make the conversation sound natural, educational, and suitable for students.`;

    const openrouterResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'user', content: enrichmentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3500
      })
    });

    if (!openrouterResponse.ok) {
      const errorData = await openrouterResponse.json();
      console.error('OpenRouter error:', errorData);
      return res.status(500).json({ error: 'OpenRouter enrichment failed', details: errorData });
    }

    const openrouterData = await openrouterResponse.json();
    const enrichedContent = openrouterData.choices?.[0]?.message?.content;

    if (!enrichedContent) {
      return res.status(500).json({ error: 'No content from OpenRouter' });
    }

    console.log('✅ Enrichment complete, converting to dialogue...');

    // Step 2: Parse the dialogue into structured format
    const dialogue = parseTeacherStudentDialogue(enrichedContent);

    if (dialogue.length === 0) {
      return res.status(500).json({ error: 'Failed to parse dialogue from enriched content' });
    }

    console.log(`📋 Parsed ${dialogue.length} dialogue segments`);

    // Step 3: Call TTS service with dialogue
    const ttsResponse = await fetch('http://127.0.0.1:5001/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogue })
    });

    if (!ttsResponse.ok) {
      const text = await ttsResponse.text();
      console.error('TTS service error:', ttsResponse.status, text);
      return res.status(500).json({ 
        error: 'TTS service failed',
        status: ttsResponse.status 
      });
    }

    const ttsData = await ttsResponse.json();

    return res.json({
      success: true,
      audioUrl: ttsData.url,
      filename: ttsData.filename,
      enrichedContent,
      dialogueSegments: dialogue.length,
      dialogue
    });

  } catch (err) {
    console.error('Enriched TTS generation failed:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}

/**
 * Parse teacher-student dialogue from text
 * Extracts alternating teacher/student exchanges
 */
function parseTeacherStudentDialogue(content) {
  const dialogue = [];
  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().startsWith('teacher:')) {
      const text = trimmed.substring('teacher:'.length).trim();
      if (text) {
        dialogue.push({ role: 'teacher', text });
      }
    } else if (trimmed.toLowerCase().startsWith('student:')) {
      const text = trimmed.substring('student:'.length).trim();
      if (text) {
        dialogue.push({ role: 'student', text });
      }
    }
  }

  return dialogue;
}

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

    // 🎙️ Convert conversation dialogue to structured segments (teacher/student)
    const dialogueArray = noteData.conversation.dialogue || [];

    // 🌐 Call Python TTS service with role-tagged segments so it can pick voices
    const ttsResponse = await fetch('http://127.0.0.1:5001/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogue: dialogueArray })
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
 * Generate structured educational notes using OpenRouter with specific format,
 * then convert to dialogue and TTS audio
 * 
 * Required format:
 * - Definition
 * - Meaning
 * - More Information
 * - Where Concept is Used (Applications)
 * - Important Points
 * - Example/Analogy
 * - Q&A (Questions and Answers)
 */
export async function generateStructuredNotesTTS(req, res) {
  try {
    const { topic, subtopic, userId, date, useCache = true } = req.body;

    if (!topic && !subtopic) {
      return res.status(400).json({ error: 'topic or subtopic is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const enrichmentTopic = subtopic || topic;
    console.log(`📚 Generating structured notes for: ${enrichmentTopic}`);

    // Optional: cache by user/day/topic to avoid regenerating the same audio
    let cacheRef = null;
    if (userId && date && useCache) {
      const slug = slugifyForId(enrichmentTopic);
      cacheRef = admin
        .firestore()
        .collection('dailyTaskAudio')
        .doc(userId)
        .collection('tasks')
        .doc(`${date}_${slug}`);

      const cachedDoc = await cacheRef.get();
      if (cachedDoc.exists) {
        const cached = cachedDoc.data();
        console.log(`♻️  Returning cached audio for ${enrichmentTopic} on ${date}`);
        return res.json({
          success: true,
          cached: true,
          audioUrl: cached.audioUrl,
          filename: cached.filename,
          topic: enrichmentTopic,
          structuredContent: cached.structuredContent,
          dialogueSegments: cached.dialogue?.length || 0,
          dialogue: cached.dialogue || []
        });
      }
    }

    // Step 1: Call OpenRouter with structured format request
    const structuredPrompt = `Create comprehensive educational notes on "${enrichmentTopic}" with the following exact structure:

DEFINITION:
[Clear, concise definition]

MEANING:
[What does it mean in simple terms?]

MORE INFORMATION:
[Detailed information and key details about the concept]

WHERE CONCEPT IS USED:
[Real-world applications and practical uses]

IMPORTANT POINTS:
[Key takeaways and important facts - list 4-6 bullet points]

IMPORTANT POINTS FOR 20 MARKS:
[The most critical concepts, exam-focused points, and detailed explanations that would help answer 20-mark questions. Include the highest-value learning points, main theories, essential definitions, and key concepts that examiners focus on. List 5-7 main points with detailed explanations.]

EXAMPLE/ANALOGY:
[One or two clear examples or analogies to help understand]

Q&A:
[5-7 important questions and answers related to the concept]
Question 1: [question]
Answer 1: [answer]

Make each section comprehensive (30-100 words per section) and suitable for educational audio conversion.`;

    const openrouterResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'user', content: structuredPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!openrouterResponse.ok) {
      const errorData = await openrouterResponse.json();
      console.error('OpenRouter error:', errorData);
      return res.status(500).json({ error: 'OpenRouter enrichment failed', details: errorData });
    }

    const openrouterData = await openrouterResponse.json();
    const structuredContent = openrouterData.choices?.[0]?.message?.content;

    if (!structuredContent) {
      return res.status(500).json({ error: 'No content from OpenRouter' });
    }

    console.log('✅ Structured notes retrieved, converting to dialogue...');

    // Step 2: Parse structured content into dialogue format
    const dialogue = parseStructuredContentToDialogue(structuredContent, enrichmentTopic);

    if (dialogue.length === 0) {
      return res.status(500).json({ error: 'Failed to parse dialogue from structured content' });
    }

    console.log(`📋 Parsed ${dialogue.length} dialogue segments`);

    // Step 3: Call TTS service with dialogue
    const ttsResponse = await fetch('http://127.0.0.1:5001/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogue })
    });

    if (!ttsResponse.ok) {
      const text = await ttsResponse.text();
      console.error('TTS service error:', ttsResponse.status, text);
      return res.status(500).json({ 
        error: 'TTS service failed',
        status: ttsResponse.status 
      });
    }

    const ttsData = await ttsResponse.json();

    // Save to cache for the day if requested
    if (cacheRef) {
      await cacheRef.set({
        topic: enrichmentTopic,
        date,
        audioUrl: ttsData.url,
        filename: ttsData.filename,
        structuredContent,
        dialogue,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`💾 Cached audio for ${enrichmentTopic} on ${date}`);
    }

    return res.json({
      success: true,
      audioUrl: ttsData.url,
      filename: ttsData.filename,
      topic: enrichmentTopic,
      structuredContent,
      dialogueSegments: dialogue.length,
      dialogue
    });

  } catch (err) {
    console.error('Structured notes TTS generation failed:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}

/**
 * Parse structured content into teacher-student dialogue
 * Converts sections into interactive dialogue format
 */
function parseStructuredContentToDialogue(content, topic) {
  const dialogue = [];

  // Intro dialogue
  dialogue.push({
    role: 'teacher',
    text: `Today, let's learn about ${topic}. Are you ready?`
  });
  dialogue.push({
    role: 'student',
    text: 'Yes, I am excited to learn!'
  });

  // Extract sections
  const sections = {
    definition: extractSection(content, 'DEFINITION'),
    meaning: extractSection(content, 'MEANING'),
    moreInfo: extractSection(content, 'MORE INFORMATION'),
    applications: extractSection(content, 'WHERE CONCEPT IS USED'),
    points: extractSection(content, 'IMPORTANT POINTS'),
    pointsFor20Marks: extractSection(content, 'IMPORTANT POINTS FOR 20 MARKS'),
    example: extractSection(content, 'EXAMPLE/ANALOGY'),
    qa: extractQASection(content)
  };

  // Definition
  if (sections.definition) {
    dialogue.push({
      role: 'teacher',
      text: `First, let me define ${topic}. ${sections.definition}`
    });
    dialogue.push({
      role: 'student',
      text: 'Thank you for that clear definition.'
    });
  }

  // Meaning
  if (sections.meaning) {
    dialogue.push({
      role: 'teacher',
      text: `Now, let me explain what it really means. ${sections.meaning}`
    });
    dialogue.push({
      role: 'student',
      text: 'That makes sense now!'
    });
  }

  // More Information
  if (sections.moreInfo) {
    dialogue.push({
      role: 'teacher',
      text: `Here is more detailed information. ${sections.moreInfo}`
    });
    dialogue.push({
      role: 'student',
      text: 'Wow, there is so much to know about this!'
    });
  }

  // Applications
  if (sections.applications) {
    dialogue.push({
      role: 'teacher',
      text: `Let me tell you where this concept is used in real life. ${sections.applications}`
    });
    dialogue.push({
      role: 'student',
      text: 'I did not know it had so many practical uses!'
    });
  }

  // Important Points
  if (sections.points) {
    dialogue.push({
      role: 'teacher',
      text: `Here are the key points to remember. ${sections.points}`
    });
    dialogue.push({
      role: 'student',
      text: 'These are helpful to remember.'
    });
  }

  // Important Points for 20 Marks (Exam-focused)
  if (sections.pointsFor20Marks) {
    dialogue.push({
      role: 'teacher',
      text: `Now, let me share the most important points that are crucial for understanding and exams. These are the key concepts worth focusing on. ${sections.pointsFor20Marks}`
    });
    dialogue.push({
      role: 'student',
      text: 'Thank you! These exam-important points will really help me prepare well.'
    });
  }

  // Example/Analogy
  if (sections.example) {
    dialogue.push({
      role: 'teacher',
      text: `Let me give you an example to help you understand better. ${sections.example}`
    });
    dialogue.push({
      role: 'student',
      text: 'Perfect! That example really helps me understand.'
    });
  }

  // Q&A
  if (sections.qa && sections.qa.length > 0) {
    dialogue.push({
      role: 'teacher',
      text: 'Now, let me answer some important questions about this topic.'
    });
    
    sections.qa.forEach((item, index) => {
      if (index < 5) { // Limit to 5 Q&A pairs for audio length
        dialogue.push({
          role: 'student',
          text: item.question
        });
        dialogue.push({
          role: 'teacher',
          text: item.answer
        });
      }
    });
  }

  // Closing
  dialogue.push({
    role: 'teacher',
    text: `I hope you now have a good understanding of ${topic}. Do you have any more questions?`
  });
  dialogue.push({
    role: 'student',
    text: 'No, thank you! This was very helpful.'
  });

  return dialogue;
}

/**
 * Extract a section from structured content
 */
function extractSection(content, sectionName) {
  const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim().substring(0, 300) : null;
}

/**
 * Extract Q&A pairs from content
 */
function extractQASection(content) {
  const qa = [];
  const qaMatch = content.match(/Q&A:[\s\S]*?(?=$|[A-Z]+:)/i);
  
  if (!qaMatch) return qa;

  const qaContent = qaMatch[0];
  const qaPairs = qaContent.match(/(?:Question|Q)\s*\d*:?\s*([^?\n]+\?)[^\n]*\n\s*(?:Answer|A)\s*\d*:?\s*([^?\n][^(?:Question|Answer)]*?)(?=(?:Question|Q)\s*\d|$)/gi);

  if (qaPairs) {
    qaPairs.forEach(pair => {
      const parts = pair.split(/(?:Answer|A)\s*\d*:?\s*/i);
      if (parts.length === 2) {
        qa.push({
          question: parts[0].replace(/(?:Question|Q)\s*\d*:?\s*/i, '').trim(),
          answer: parts[1].trim()
        });
      }
    });
  }

  return qa;
}/**
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

// Simple slugify for Firestore doc IDs
function slugifyForId(text) {
  return (text || 'topic')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'topic';
}

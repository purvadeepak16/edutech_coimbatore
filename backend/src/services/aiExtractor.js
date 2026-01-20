import axios from 'axios';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Validate API key on module load
if (!OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not set in environment variables. AI features will not work.');
}

/**
 * Check if API key is configured
 */
function validateApiKey() {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_key_here') {
    throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file.');
  }
}

/**
 * Extract structured syllabus from cleaned PDF text using AI
 * @param {string} cleanedText - Cleaned PDF text
 * @param {Object} structure - Structure hints from PDF
 * @param {string} subject - Subject name (optional hint)
 * @returns {Promise<Array>} Extracted units with topics
 */
export async function extractSyllabusFromText(cleanedText, structure, subject = '') {
  const systemPrompt = `You are a precise syllabus parser. Extract ONLY the topics explicitly mentioned in the provided text.

STRICT RULES:
1. DO NOT invent or infer topics not present in the text
2. Preserve the exact hierarchy and names from the text
3. Return ONLY valid JSON, no explanations
4. If units/chapters are present, group topics under them
5. If only topics are listed, create a single unit called "Topics"

Output format:
[
  {
    "name": "Unit/Chapter name",
    "topics": [
      {
        "title": "Exact topic name from text",
        "difficulty": "easy|medium|hard (optional, only if mentioned)",
        "estimatedHours": number (optional, only if mentioned)
      }
    ]
  }
]`;

  const userPrompt = `Subject: ${subject || 'Not specified'}

Structure hints:
- Has units/chapters: ${structure.hasUnits}
- Has topics: ${structure.hasTopics}
- Has bullet points: ${structure.hasBulletPoints}

Text to parse:
${cleanedText}

Extract syllabus structure as JSON:`;

  try {
    // Validate API key before making request
    validateApiKey();

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for precision
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'StudySync'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    const extracted = JSON.parse(jsonText);
    
    // Validate structure
    if (!Array.isArray(extracted)) {
      throw new Error('AI response must be an array of units');
    }
    
    return extracted;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI extraction failed: ${error.response.data.error?.message || error.message}`);
    }
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

/**
 * Generate syllabus for manual mode
 * @param {string} subject - Subject name
 * @param {string} level - Education level
 * @returns {Promise<Array>} Proposed syllabus units
 */
export async function proposeSyllabus(subject, level) {
  const systemPrompt = `You are an education expert. Propose a comprehensive syllabus for the given subject and level.

Return a structured JSON with units and topics. Be thorough but realistic.

Output format:
[
  {
    "name": "Unit name",
    "topics": [
      {
        "title": "Topic title",
        "difficulty": "easy|medium|hard",
        "estimatedHours": number
      }
    ]
  }
]`;

  const userPrompt = `Subject: ${subject}
Level: ${level}

Propose a comprehensive syllabus structure:`;

  try {
    // Validate API key before making request
    validateApiKey();

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'StudySync'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    if (error.response) {
      throw new Error(`AI proposal failed: ${error.response.data.error?.message || error.message}`);
    }
    throw new Error(`AI proposal failed: ${error.message}`);
  }
}

/**
 * Generate a dedicated study plan with important points highlighted
 * @param {Array} units - Syllabus units with topics
 * @param {string} subject - Subject name
 * @param {Object} metadata - PDF metadata
 * @returns {Promise<Object>} Study plan with highlighted important points
 */
export async function generateStudyPlan(units, subject, metadata) {
  const systemPrompt = `You are an expert study planner. Based on the syllabus provided, create:
1. A week-by-week study schedule
2. Identify and highlight the MOST IMPORTANT topics (mark as high priority)
3. Suggest time allocation for each unit
4. Mark prerequisite topics
5. Identify topics that require extra practice

Return ONLY valid JSON with this structure:
{
  "studyPlan": {
    "totalWeeks": number,
    "weeklySchedule": [
      {
        "week": number,
        "unit": "unit name",
        "topics": ["topic1", "topic2"],
        "hoursRequired": number
      }
    ]
  },
  "importantPoints": [
    {
      "topic": "topic title",
      "unit": "unit name",
      "priority": "high|medium|critical",
      "reason": "why this is important",
      "estimatedHours": number,
      "isPrerequisite": boolean,
      "requiresExtraPractice": boolean
    }
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}`;

  // Build syllabus summary
  const syllabusSummary = units.map(unit => {
    const topics = unit.topics.map(t => t.title).join(', ');
    return `${unit.name}: ${topics}`;
  }).join('\n');

  const userPrompt = `Subject: ${subject}
Total Pages: ${metadata.pages || 'Unknown'}

Syllabus Structure:
${syllabusSummary}

Generate a comprehensive study plan with important points highlighted:`;

  try {
    validateApiKey();

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'StudySync'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Study plan generation error:', error.message);
    // Return a basic structure if AI fails
    return {
      studyPlan: {
        totalWeeks: Math.ceil(units.length * 2),
        weeklySchedule: units.map((unit, index) => ({
          week: index + 1,
          unit: unit.name,
          topics: unit.topics.map(t => t.title),
          hoursRequired: unit.topics.length * 2
        }))
      },
      importantPoints: [],
      recommendations: ['Review the syllabus and prioritize topics based on your exam schedule']
    };
  }
}

/**
 * Structure pre-stored exam syllabus text
 * @param {string} examText - Official exam syllabus text
 * @param {string} examType - Exam type (JEE, GATE, etc.)
 * @returns {Promise<Array>} Structured syllabus
 */
export async function structureExamSyllabus(examText, examType) {
  const systemPrompt = `You are structuring an official ${examType} syllabus. 
DO NOT add, remove, or modify any topics. ONLY organize the provided text into a structured format.

Return valid JSON with units and topics as they appear in the text.

Output format:
[
  {
    "name": "Unit/Section name",
    "topics": [
      {
        "title": "Exact topic from text"
      }
    ]
  }
]`;

  const userPrompt = `Official ${examType} syllabus text:

${examText}

Structure this into JSON format:`;

  try {
    // Validate API key before making request
    validateApiKey();

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0, // Zero temperature for exact structuring
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'StudySync'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    if (error.response) {
      throw new Error(`Exam structuring failed: ${error.response.data.error?.message || error.message}`);
    }
    throw new Error(`Exam structuring failed: ${error.message}`);
  }
}

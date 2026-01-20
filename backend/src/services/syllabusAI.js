import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';

function validateApiKey() {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in environment');
  }
}

/**
 * Plan a syllabus using OpenRouter model.
 * Returns strictly parsed JSON as specified in the prompt.
 * @param {string} syllabusText
 * @param {string} subject
 * @param {string} classOrLevel
 */
export async function planSyllabus(syllabusText, subject = '', classOrLevel = '') {
  validateApiKey();

  const systemPrompt = `You are an academic curriculum expert.`;

  const userPrompt = `You are an academic curriculum expert.

Given the following syllabus text, do the following:
1. Extract chapters and topics
2. Group them into a logical study plan
3. Highlight important and high-weightage topics
4. Classify topic difficulty (easy, medium, hard)

Return strictly valid JSON with this structure:
{
  "subject": "",
  "class_or_level": "",
  "study_plan": [
    {
      "phase": "",
      "topics": []
    }
  ],
  "important_topics": [
    {
      "topic": "",
      "reason": "",
      "difficulty": ""
    }
  ]
}

Syllabus text:
<<<SYLLABUS_TEXT>>>

Replace <<<SYLLABUS_TEXT>>> with the syllabus content provided to you. Return ONLY valid JSON and nothing else.`;

  const fullUserPrompt = userPrompt.replace('<<<SYLLABUS_TEXT>>>', syllabusText);

  try {
    const resp = await axios.post(
      OPENROUTER_URL,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullUserPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = resp.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenRouter');
    }

    // Extract JSON from code block if present
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

    return parsed;
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenRouter error: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`OpenRouter request failed: ${error.message}`);
  }
}

export default { planSyllabus };

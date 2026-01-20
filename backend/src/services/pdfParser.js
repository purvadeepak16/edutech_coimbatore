import { createRequire } from 'module';

// Load pdf-parse (CommonJS) - v2 API uses PDFParse class
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Clean and normalize PDF text
 * @param {string} rawText - Raw text from PDF
 * @returns {string} Cleaned text
 */
function cleanPdfText(rawText) {
  let text = rawText;

  // Remove page numbers (common patterns)
  text = text.replace(/\n\s*\d+\s*\n/g, '\n');
  text = text.replace(/Page \d+ of \d+/gi, '');
  
  // Remove headers/footers (repeated patterns at line starts/ends)
  const lines = text.split('\n');
  const lineFrequency = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && trimmed.length < 100) {
      lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
    }
  });
  
  // Remove lines that appear more than 3 times (likely headers/footers)
  const repeatedLines = Object.keys(lineFrequency).filter(line => lineFrequency[line] > 3);
  repeatedLines.forEach(repeatedLine => {
    text = text.split(repeatedLine).join('');
  });

  // Merge broken lines (lines ending with lowercase letter followed by capitalized word)
  text = text.replace(/([a-z])\n([A-Z])/g, '$1 $2');
  
  // Normalize bullet points
  text = text.replace(/[•●○■▪]/g, '-');
  
  // Remove excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  
  return text.trim();
}

/**
 * Detect structure hints from PDF text
 * @param {string} cleanedText - Cleaned PDF text
 * @returns {Object} Structure hints
 */
function detectStructure(cleanedText) {
  const lines = cleanedText.split('\n').filter(line => line.trim());
  
  const hints = {
    hasUnits: false,
    hasTopics: false,
    hasBulletPoints: false,
    hasNumbering: false,
    unitPatterns: [],
    topicPatterns: []
  };

  // Detect common patterns
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Unit patterns (all caps, "Unit X", "Chapter X", etc.)
    if (
      /^UNIT\s+\d+/i.test(trimmed) ||
      /^CHAPTER\s+\d+/i.test(trimmed) ||
      /^MODULE\s+\d+/i.test(trimmed) ||
      /^[A-Z\s]{10,}$/.test(trimmed)
    ) {
      hints.hasUnits = true;
      hints.unitPatterns.push(trimmed);
    }
    
    // Topic patterns (bullet points, numbered lists)
    if (/^[-•●○]\s/.test(trimmed)) {
      hints.hasBulletPoints = true;
      hints.topicPatterns.push(trimmed);
    }
    
    if (/^\d+\.\s/.test(trimmed) || /^\d+\)\s/.test(trimmed)) {
      hints.hasNumbering = true;
      hints.topicPatterns.push(trimmed);
    }
  });

  hints.hasTopics = hints.hasBulletPoints || hints.hasNumbering;
  
  return hints;
}

/**
 * Parse PDF file and extract structured text
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed PDF data: {text: string, pageCount: number}
 */
export async function parsePdf(pdfBuffer) {
  // Validate input
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF buffer provided to parsePdf');
  }

  // pdf-parse v2 API: instantiate with new PDFParse() then call getText()
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();

  if (!result || typeof result.text !== 'string') {
    throw new Error('PDF parsing returned no text content');
  }

  const cleanedText = cleanPdfText(result.text || '');

  return {
    text: cleanedText,
    pageCount: result.total || 0
  };
}

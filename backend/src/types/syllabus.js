/**
 * @typedef {Object} Topic
 * @property {string} id - Unique identifier
 * @property {string} title - Topic title
 * @property {string} [difficulty] - Optional difficulty level (easy/medium/hard)
 * @property {number} [estimatedHours] - Optional estimated study hours
 * @property {number} [confidence] - Confidence score for AI-extracted topics (0-1)
 */

/**
 * @typedef {Object} Unit
 * @property {string} id - Unique identifier
 * @property {string} name - Unit name
 * @property {Topic[]} topics - Array of topics in this unit
 */

/**
 * @typedef {'pdf' | 'manual' | 'exam'} SyllabusSource
 */

/**
 * @typedef {Object} NormalizedSyllabus
 * @property {string} id - Unique identifier
 * @property {string} subject - Subject name
 * @property {SyllabusSource} source - How the syllabus was created
 * @property {string} [level] - Educational level (high-school, undergrad, etc.)
 * @property {Unit[]} units - Array of units containing topics
 * @property {Date} createdAt - Timestamp of creation
 * @property {Object} [metadata] - Additional metadata
 * @property {string} [metadata.pdfName] - Original PDF filename
 * @property {string} [metadata.examType] - Exam type (JEE, GATE, etc.)
 */

export default {};

import { randomUUID } from 'crypto';

/**
 * Parse topic title into subtopics array by splitting on comma or period
 * Example: "Food Crop, Micro-organisms. Soil Fertility" 
 * Returns: ["Food Crop", "Micro-organisms", "Soil Fertility"]
 * @param {string} title - Topic title (comma/period separated)
 * @returns {Array} Array of subtopic strings
 */
function parseSubtopics(title) {
  if (!title || typeof title !== 'string') {
    return [title];
  }
  
  // Split by comma or period, trim whitespace, filter empty strings
  const subtopics = title
    .split(/[,.]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // If nothing found after split, return original title as single item
  return subtopics.length > 0 ? subtopics : [title];
}

/**
 * Normalize syllabus data to unified format
 * @param {Object} params - Normalization parameters
 * @param {string} params.subject - Subject name
 * @param {'pdf'|'manual'|'exam'} params.source - Source type
 * @param {Array} params.units - Units with topics
 * @param {string} [params.level] - Education level
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Object} Normalized syllabus
 */
export function normalizeSyllabus({ subject, source, units, level, metadata = {} }) {
  const normalizedUnits = units.map(unit => ({
    id: unit.id || randomUUID(),
    name: unit.name,
    topics: unit.topics.map(topic => ({
      id: topic.id || randomUUID(),
      title: topic.title,
      subtopics: parseSubtopics(topic.title),
      difficulty: topic.difficulty || undefined,
      estimatedHours: topic.estimatedHours || undefined,
      confidence: topic.confidence || undefined
    }))
  }));

  return {
    id: randomUUID(),
    subject,
    source,
    level,
    units: normalizedUnits,
    createdAt: new Date(),
    metadata
  };
}

/**
 * Add a new unit to syllabus
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitName - Name of new unit
 * @returns {Object} Updated syllabus
 */
export function addUnit(syllabus, unitName) {
  return {
    ...syllabus,
    units: [
      ...syllabus.units,
      {
        id: randomUUID(),
        name: unitName,
        topics: []
      }
    ]
  };
}

/**
 * Remove a unit from syllabus
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitId - ID of unit to remove
 * @returns {Object} Updated syllabus
 */
export function removeUnit(syllabus, unitId) {
  return {
    ...syllabus,
    units: syllabus.units.filter(unit => unit.id !== unitId)
  };
}

/**
 * Update unit name
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitId - ID of unit to update
 * @param {string} newName - New unit name
 * @returns {Object} Updated syllabus
 */
export function updateUnitName(syllabus, unitId, newName) {
  return {
    ...syllabus,
    units: syllabus.units.map(unit =>
      unit.id === unitId ? { ...unit, name: newName } : unit
    )
  };
}

/**
 * Add a topic to a unit
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitId - ID of unit
 * @param {Object} topic - Topic to add
 * @returns {Object} Updated syllabus
 */
export function addTopic(syllabus, unitId, topic) {
  return {
    ...syllabus,
    units: syllabus.units.map(unit =>
      unit.id === unitId
        ? {
            ...unit,
            topics: [
              ...unit.topics,
              {
                id: randomUUID(),
                ...topic
              }
            ]
          }
        : unit
    )
  };
}

/**
 * Remove a topic from a unit
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitId - ID of unit
 * @param {string} topicId - ID of topic to remove
 * @returns {Object} Updated syllabus
 */
export function removeTopic(syllabus, unitId, topicId) {
  return {
    ...syllabus,
    units: syllabus.units.map(unit =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.filter(topic => topic.id !== topicId)
          }
        : unit
    )
  };
}

/**
 * Update a topic
 * @param {Object} syllabus - Normalized syllabus
 * @param {string} unitId - ID of unit
 * @param {string} topicId - ID of topic to update
 * @param {Object} updates - Topic updates
 * @returns {Object} Updated syllabus
 */
export function updateTopic(syllabus, unitId, topicId, updates) {
  return {
    ...syllabus,
    units: syllabus.units.map(unit =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.map(topic =>
              topic.id === topicId ? { ...topic, ...updates } : topic
            )
          }
        : unit
    )
  };
}

/**
 * Validate AI-extracted topics against original PDF text
 * @param {Array} extractedTopics - Topics extracted by AI
 * @param {string} cleanedText - Original cleaned PDF text
 * @returns {Array} Topics with confidence scores
 */
export function validateExtractedTopics(extractedTopics, cleanedText) {
  const lowerText = (cleanedText || '').toLowerCase();
  
  const validateTopic = (topic) => {
    const lowerTitle = (topic.title || '').toLowerCase();
    
    // Check if topic title appears in text (exact match)
    const exactMatch = lowerText.includes(lowerTitle);
    
    // Check for partial word matches
    const words = lowerTitle.split(/\s+/).filter(Boolean);
    const matchedWords = words.filter(word => 
      word.length > 3 && lowerText.includes(word)
    ).length;
    const partialMatch = words.length ? (matchedWords / words.length) : 0;
    
    // Calculate confidence score
    let confidence = 0;
    if (exactMatch) {
      confidence = 1.0;
    } else if (partialMatch > 0.7) {
      confidence = 0.8;
    } else if (partialMatch > 0.5) {
      confidence = 0.6;
    } else {
      confidence = 0.3; // Low confidence - likely hallucinated
    }
    
    return {
      ...topic,
      id: topic.id || randomUUID(),
      confidence
    };
  };
  
  const validateUnit = (unit) => ({
    ...unit,
    id: unit.id || randomUUID(),
    topics: (unit.topics || []).map(validateTopic)
  });
  
  return (extractedTopics || []).map(validateUnit);
}

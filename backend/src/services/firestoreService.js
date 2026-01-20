import { db } from '../config/firebase.js';

/**
 * Remove undefined values from object recursively
 * @param {*} obj - Object to clean
 * @returns {*} Cleaned object
 */
function removeUndefined(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(item => item !== undefined);
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned;
}

/**
 * Save syllabus structure with units and topics
 * @param {string} userId - User ID
 * @param {object} syllabusData - Syllabus data with units and topics
 * @returns {Promise<string>} Document ID
 */
export async function saveSyllabus(userId, syllabusData) {
  try {
    const syllabusRef = db.collection('userSyllabi').doc(userId);
    
    const dataToSave = removeUndefined({
      ...syllabusData,
      userId,
      updatedAt: new Date().toISOString(),
      createdAt: syllabusData.createdAt || new Date().toISOString()
    });

    await syllabusRef.set(dataToSave, { merge: true });
    
    console.log(`✅ Syllabus saved to Firestore for user: ${userId}`);
    return userId;
  } catch (error) {
    console.error('Error saving syllabus to Firestore:', error);
    throw new Error('Failed to save syllabus to database');
  }
}

/**
 * Get syllabus from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Syllabus data or null
 */
export async function getSyllabus(userId) {
  try {
    const syllabusRef = db.collection('userSyllabi').doc(userId);
    const doc = await syllabusRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error('Error fetching syllabus from Firestore:', error);
    throw new Error('Failed to fetch syllabus from database');
  }
}

/**
 * Save topic assignments for specific dates
 * @param {string} userId - User ID
 * @param {Array} assignments - Array of {date, topics, units, topicIds}
 * @returns {Promise<void>}
 */
export async function saveTopicAssignments(userId, assignments) {
  try {
    const batch = db.batch();
    
    assignments.forEach(assignment => {
      const assignmentRef = db.collection('topicAssignments')
        .doc(`${userId}_${assignment.date}`);
      
      const cleanedAssignment = removeUndefined({
        userId,
        date: assignment.date,
        topics: assignment.topics || [],
        units: assignment.units || [],
        topicIds: assignment.topicIds || [],
        topicCount: assignment.topics?.length || 0,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      batch.set(assignmentRef, cleanedAssignment, { merge: true });
    });

    await batch.commit();
    console.log(`✅ Saved ${assignments.length} topic assignments for user: ${userId}`);
  } catch (error) {
    console.error('Error saving topic assignments:', error);
    throw new Error('Failed to save topic assignments');
  }
}

/**
 * Get all assigned topics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of assigned topic IDs
 */
export async function getAssignedTopics(userId) {
  try {
    const assignmentsRef = db.collection('topicAssignments')
      .where('userId', '==', userId);
    
    const snapshot = await assignmentsRef.get();
    
    const assignedTopicIds = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.topicIds && Array.isArray(data.topicIds)) {
        data.topicIds.forEach(id => assignedTopicIds.add(id));
      }
    });

    return Array.from(assignedTopicIds);
  } catch (error) {
    console.error('Error fetching assigned topics:', error);
    throw new Error('Failed to fetch assigned topics');
  }
}

/**
 * Get topic assignments for a date range
 * @param {string} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of assignments
 */
export async function getTopicAssignmentsByDateRange(userId, startDate, endDate) {
  try {
    const assignmentsRef = db.collection('topicAssignments')
      .where('userId', '==', userId);
    
    const snapshot = await assignmentsRef.get();
    
    // Filter by date range in JavaScript
    const assignments = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.date >= startDate && data.date <= endDate) {
        assignments.push(data);
      }
    });

    // Sort by date
    assignments.sort((a, b) => new Date(a.date) - new Date(b.date));

    return assignments;
  } catch (error) {
    console.error('Error fetching assignments by date range:', error);
    throw new Error('Failed to fetch assignments');
  }
}

/**
 * Get daily schedule from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Schedule data or null
 */
export async function getDailySchedule(userId) {
  try {
    const assignmentsRef = db.collection('topicAssignments')
      .where('userId', '==', userId);
    
    const snapshot = await assignmentsRef.get();

    if (snapshot.empty) {
      return null;
    }

    // Get all assignments and sort by date in JavaScript
    const assignments = [];
    snapshot.forEach(doc => {
      assignments.push(doc.data());
    });

    // Sort by date
    assignments.sort((a, b) => new Date(a.date) - new Date(b.date));

    const schedule = [];
    let dayCounter = 1;
    assignments.forEach(data => {
      schedule.push({
        day: dayCounter++,
        date: data.date,
        topics: data.topics,
        units: data.units,
        topicCount: data.topicCount,
        completed: data.completed || false
      });
    });

    return {
      totalDays: schedule.length,
      startDate: schedule[0]?.date,
      endDate: schedule[schedule.length - 1]?.date,
      totalTopics: schedule.reduce((sum, day) => sum + day.topicCount, 0),
      schedule
    };
  } catch (error) {
    console.error('Error fetching schedule from Firestore:', error);
    throw new Error('Failed to fetch schedule from database');
  }
}

/**
 * Delete daily schedule from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteDailySchedule(userId) {
  try {
    // Delete all topic assignments for this user
    const assignmentsRef = db.collection('topicAssignments')
      .where('userId', '==', userId);
    
    const snapshot = await assignmentsRef.get();
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Schedule deleted for user: ${userId}`);
  } catch (error) {
    console.error('Error deleting schedule from Firestore:', error);
    throw new Error('Failed to delete schedule from database');
  }
}

/**
 * Mark topic assignment as completed
 * @param {string} userId - User ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<void>}
 */
export async function markAssignmentCompleted(userId, date) {
  try {
    const assignmentRef = db.collection('topicAssignments')
      .doc(`${userId}_${date}`);
    
    await assignmentRef.update({
      completed: true,
      completedAt: new Date().toISOString()
    });

    console.log(`✅ Marked assignment as completed for ${date}`);
  } catch (error) {
    console.error('Error marking assignment as completed:', error);
    throw new Error('Failed to mark assignment as completed');
  }
}

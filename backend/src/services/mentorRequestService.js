import { db } from '../config/firebase.js';

/**
 * Mentor Request Service
 * Handles all database operations for mentor-student connections
 * 
 * Collection: mentorRequests
 * Document structure:
 * {
 *   id: string,
 *   studentId: string,
 *   studentName: string,
 *   mentorId: string,
 *   mentorName: string,
 *   status: 'pending' | 'accepted' | 'rejected',
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 */

/**
 * Get all mentors from users collection
 * @returns {Promise<Array>} List of mentors
 */
export async function getAllMentors() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('userRole', '==', 'Mentor').get();
    
    if (snapshot.empty) {
      return [];
    }

    const mentors = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      mentors.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        email: data.email,
        specializations: data.mentorSpecializations || [],
        gender: data.gender,
        preferredTimeSlots: data.preferredTimeSlots || []
      });
    });

    return mentors;
  } catch (error) {
    console.error('Error fetching mentors:', error);
    throw new Error('Failed to fetch mentors from database');
  }
}

/**
 * Create a new mentor connection request
 * @param {string} studentId - Student's user ID
 * @param {string} studentName - Student's name
 * @param {string} mentorId - Mentor's user ID
 * @param {string} mentorName - Mentor's name
 * @returns {Promise<object>} Created request
 */
export async function createMentorRequest(studentId, studentName, mentorId, mentorName) {
  try {
    // Check if request already exists
    const existingRequest = await getMentorRequest(studentId, mentorId);
    
    if (existingRequest) {
      // If rejected, allow re-request
      if (existingRequest.status === 'rejected') {
        return updateMentorRequestStatus(existingRequest.id, 'pending');
      }
      throw new Error('Request already exists');
    }

    // Create unique ID combining student and mentor IDs
    const requestId = `${studentId}_${mentorId}`;
    const requestRef = db.collection('mentorRequests').doc(requestId);
    
    const requestData = {
      id: requestId,
      studentId,
      studentName,
      mentorId,
      mentorName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await requestRef.set(requestData);
    
    console.log(`✅ Mentor request created: ${studentId} -> ${mentorId}`);
    return requestData;
  } catch (error) {
    console.error('Error creating mentor request:', error);
    throw error;
  }
}

/**
 * Get a specific mentor request
 * @param {string} studentId - Student's user ID
 * @param {string} mentorId - Mentor's user ID
 * @returns {Promise<object|null>} Request data or null
 */
export async function getMentorRequest(studentId, mentorId) {
  try {
    const requestId = `${studentId}_${mentorId}`;
    const requestRef = db.collection('mentorRequests').doc(requestId);
    const doc = await requestRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error('Error fetching mentor request:', error);
    throw new Error('Failed to fetch mentor request');
  }
}

/**
 * Get all mentor requests for a student with status per mentor
 * @param {string} studentId - Student's user ID
 * @returns {Promise<object>} Map of mentorId -> status
 */
export async function getStudentMentorRequests(studentId) {
  try {
    const requestsRef = db.collection('mentorRequests');
    const snapshot = await requestsRef.where('studentId', '==', studentId).get();
    
    const requestsMap = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      requestsMap[data.mentorId] = {
        status: data.status,
        mentorName: data.mentorName,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    return requestsMap;
  } catch (error) {
    console.error('Error fetching student requests:', error);
    throw new Error('Failed to fetch student requests');
  }
}

/**
 * Get all incoming mentor requests for a mentor
 * @param {string} mentorId - Mentor's user ID
 * @returns {Promise<Array>} List of pending requests
 */
export async function getMentorIncomingRequests(mentorId) {
  try {
    const requestsRef = db.collection('mentorRequests');
    const snapshot = await requestsRef
      .where('mentorId', '==', mentorId)
      .where('status', '==', 'pending')
      .get();
    
    if (snapshot.empty) {
      return [];
    }

    const requests = [];
    snapshot.forEach(doc => {
      requests.push(doc.data());
    });

    // Sort by creation date (newest first)
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return requests;
  } catch (error) {
    console.error('Error fetching mentor requests:', error);
    throw new Error('Failed to fetch mentor requests');
  }
}

/**
 * Update mentor request status (accept/reject)
 * @param {string} requestId - Request ID (studentId_mentorId)
 * @param {string} status - New status ('accepted' | 'rejected')
 * @returns {Promise<object>} Updated request
 */
export async function updateMentorRequestStatus(requestId, status) {
  try {
    const requestRef = db.collection('mentorRequests').doc(requestId);
    const doc = await requestRef.get();

    if (!doc.exists) {
      throw new Error('Request not found');
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    await requestRef.update(updateData);
    
    console.log(`✅ Mentor request ${requestId} updated to ${status}`);
    
    return {
      ...doc.data(),
      ...updateData
    };
  } catch (error) {
    console.error('Error updating mentor request:', error);
    throw error;
  }
}

/**
 * Get all connected mentors for a student
 * @param {string} studentId - Student's user ID
 * @returns {Promise<Array>} List of connected mentors
 */
export async function getConnectedMentors(studentId) {
  try {
    const requestsRef = db.collection('mentorRequests');
    const snapshot = await requestsRef
      .where('studentId', '==', studentId)
      .where('status', '==', 'accepted')
      .get();
    
    if (snapshot.empty) {
      return [];
    }

    const mentors = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      mentors.push({
        mentorId: data.mentorId,
        mentorName: data.mentorName,
        connectedAt: data.updatedAt
      });
    });

    return mentors;
  } catch (error) {
    console.error('Error fetching connected mentors:', error);
    throw new Error('Failed to fetch connected mentors');
  }
}

/**
 * Get all connected students for a mentor
 * @param {string} mentorId - Mentor's user ID
 * @returns {Promise<Array>} List of connected students
 */
export async function getConnectedStudents(mentorId) {
  try {
    const requestsRef = db.collection('mentorRequests');
    const snapshot = await requestsRef
      .where('mentorId', '==', mentorId)
      .where('status', '==', 'accepted')
      .get();
    
    if (snapshot.empty) {
      return [];
    }

    const students = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      students.push({
        studentId: data.studentId,
        studentName: data.studentName,
        connectedAt: data.updatedAt
      });
    });

    return students;
  } catch (error) {
    console.error('Error fetching connected students:', error);
    throw new Error('Failed to fetch connected students');
  }
}

/**
 * Delete a mentor request (optional - for admin cleanup)
 * @param {string} requestId - Request ID to delete
 * @returns {Promise<void>}
 */
export async function deleteMentorRequest(requestId) {
  try {
    const requestRef = db.collection('mentorRequests').doc(requestId);
    await requestRef.delete();
    
    console.log(`✅ Mentor request ${requestId} deleted`);
  } catch (error) {
    console.error('Error deleting mentor request:', error);
    throw new Error('Failed to delete mentor request');
  }
}

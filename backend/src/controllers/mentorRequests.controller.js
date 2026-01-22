import admin, { db } from "../config/firebase.js";

// Single, cleaned controller for mentor<->student connection requests
const REQ_COL = 'mentor_requests';

async function readUserRole(userId) {
  if (!userId) return null;
  try {
    const d = await db.collection('users').doc(userId).get();
    if (!d.exists) return null;
    const data = d.data();
    return (data.userRole || data.role || '').toString().toLowerCase();
  } catch (err) {
    console.warn('readUserRole failed:', err.message || err);
    return null;
  }
}

export const listMentors = async (req, res) => {
  try {
    const mentors = [];
    // Try common role fields
    const snaps = [];
    const q1 = await db.collection('users').where('userRole', '==', 'Mentor').limit(500).get().catch(() => null);
    if (q1) snaps.push(q1);
    const q2 = await db.collection('users').where('role', '==', 'mentor').limit(500).get().catch(() => null);
    if (q2) snaps.push(q2);

    if (!snaps.length) {
      const all = await db.collection('users').limit(500).get();
      all.forEach(d => {
        const data = d.data();
        const role = (data.userRole || data.role || '').toString().toLowerCase();
        if (role.startsWith('mentor')) {
          const displayName = data.userName || data.username || data.displayName || data.name || (data.userData && (data.userData.userName || data.userData.username || data.userData.displayName || data.userData.name)) || '';
          const specs = data.mentorSpecializations || data.specializations || [];
          mentors.push({ id: d.id, displayName, mentorSpecializations: specs });
        }
      });
    } else {
      for (const s of snaps) s.forEach(d => {
        const data = d.data();
        const displayName = data.userName || data.username || data.displayName || data.name || (data.userData && (data.userData.userName || data.userData.username || data.userData.displayName || data.userData.name)) || '';
        const specs = data.mentorSpecializations || data.specializations || [];
        mentors.push({ id: d.id, displayName, mentorSpecializations: specs });
      });
    }

    // Hydrate missing display names from Firebase Auth if possible
    const finalMentors = await hydrateMentorNames(mentors);
    res.json({ success: true, mentors: finalMentors });
  } catch (err) {
    console.error('listMentors error:', err);
    res.status(500).json({ success: false, message: 'Failed to list mentors', error: err.message });
  }
};

// Try to fill missing display names from Firebase Auth when not present in user doc
async function hydrateMentorNames(mentors) {
  const missing = mentors.filter(m => !m.displayName).map(m => m.id);
  if (!missing.length) return mentors;
  try {
    // Try to fetch auth records and also fallback to user doc's userName/username
    for (const id of missing) {
      const u = await admin.auth().getUser(id).catch(() => null);
      const m = mentors.find(x => x.id === id);
      if (!m) continue;
      let name = null;
      // Primary: Firestore `userName` / `username` field only
      const doc = await db.collection('users').doc(id).get().catch(() => null);
      if (doc && doc.exists) {
        const d = doc.data();
        name = d?.userName || d?.username || null;
      }
      // Secondary: auth custom claims 'userName' or 'username'
      if (!name && u && u.customClaims) {
        name = u.customClaims.userName || u.customClaims.username || null;
      }
      // Do NOT use auth.displayName or email as a fallback to avoid showing emails
      if (!name) name = m.displayName || '';
      m.displayName = name;
    }
  } catch (err) {
    console.warn('hydrateMentorNames warning:', err.message || err);
  }
  return mentors;
}

export const createMentorRequest = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { mentorId } = req.body;
    if (!mentorId) return res.status(400).json({ success: false, message: 'mentorId required' });

    const role = await readUserRole(studentId);
    if (role && role.startsWith('mentor')) return res.status(403).json({ success: false, message: 'Mentors cannot create mentor requests' });

    // use deterministic doc id to prevent duplicates
    const docId = `${studentId}_${mentorId}`;
    const docRef = db.collection(REQ_COL).doc(docId);
    const existing = await docRef.get();
    if (existing.exists) return res.status(400).json({ success: false, message: 'Request already exists', request: { id: existing.id, ...existing.data() } });

    const now = new Date().toISOString();
    const payload = { studentId, mentorId, status: 'pending', createdAt: now, updatedAt: now };
    await docRef.set(payload);
    res.status(201).json({ success: true, request: { id: docId, ...payload } });
  } catch (err) {
    console.error('createMentorRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to create request', error: err.message });
  }
};

export const getMentorRequestStatuses = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { mentorIds } = req.query;
    if (mentorIds) {
      const ids = String(mentorIds).split(',').map(x => x.trim()).filter(Boolean);
      const result = {};
      for (const m of ids) {
        const doc = await db.collection(REQ_COL).doc(`${studentId}_${m}`).get();
        result[m] = doc.exists ? doc.data().status : 'none';
      }
      return res.json({ success: true, statuses: result });
    }
    const snap = await db.collection(REQ_COL).where('studentId', '==', studentId).get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, requests });
  } catch (err) {
    console.error('getMentorRequestStatuses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch statuses', error: err.message });
  }
};

export const listIncomingRequests = async (req, res) => {
  try {
    const mentorId = req.user?.id;
    if (!mentorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const role = await readUserRole(mentorId);
    if (role && !role.startsWith('mentor')) return res.status(403).json({ success: false, message: 'Only mentors can view incoming requests' });
    
    // Get only PENDING requests for this mentor
    const snap = await db.collection(REQ_COL)
      .where('mentorId', '==', mentorId)
      .where('status', '==', 'pending')
      .get();
    let requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt if it exists
    requests.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA; // Newest first
    });
    
    // enrich with student name
    const studentIds = [...new Set(requests.map(r => r.studentId))];
    const students = {};
    if (studentIds.length) {
      const promises = studentIds.map(id => db.collection('users').doc(id).get());
      const snaps = await Promise.all(promises);
      snaps.forEach(s => { if (s.exists) students[s.id] = s.data(); });
    }
    const enriched = requests.map(r => ({ 
      ...r, 
      student: students[r.studentId] ? { 
        id: r.studentId, 
        name: students[r.studentId].userName || students[r.studentId].displayName || students[r.studentId].name || 'Unknown Student' 
      } : null 
    }));
    res.json({ success: true, requests: enriched });
  } catch (err) {
    console.error('listIncomingRequests error:', err);
    res.status(500).json({ success: false, message: 'Failed to list requests', error: err.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const mentorId = req.user?.id;
    if (!mentorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Request id required' });
    const docRef = db.collection(REQ_COL).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    const data = doc.data();
    if (data.mentorId !== mentorId) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (data.status === 'accepted') return res.json({ success: true, message: 'Already accepted' });
    const now = new Date().toISOString();
    const batch = db.batch();
    batch.update(docRef, { status: 'accepted', updatedAt: now });
    const connRef = db.collection('mentor_connections').doc();
    batch.set(connRef, { studentId: data.studentId, mentorId, status: 'connected', createdAt: now, updatedAt: now });
    await batch.commit();
    res.json({ success: true, message: 'Request accepted', requestId: id });
  } catch (err) {
    console.error('acceptRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept request', error: err.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const mentorId = req.user?.id;
    if (!mentorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Request id required' });
    const docRef = db.collection(REQ_COL).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    const data = doc.data();
    if (data.mentorId !== mentorId) return res.status(403).json({ success: false, message: 'Not authorized' });
    await docRef.update({ status: 'rejected', updatedAt: new Date().toISOString() });
    res.json({ success: true, message: 'Request rejected', requestId: id });
  } catch (err) {
    console.error('rejectRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject request', error: err.message });
  }
};

export const listConnectedStudents = async (req, res) => {
  try {
    const mentorId = req.user?.id;
    if (!mentorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const role = await readUserRole(mentorId);
    if (role && !role.startsWith('mentor')) {
      return res.status(403).json({ success: false, message: 'Only mentors can view connected students' });
    }
    
    // Get all connected students for this mentor
    const snap = await db.collection('mentor_connections')
      .where('mentorId', '==', mentorId)
      .where('status', '==', 'connected')
      .get();
    
    let connections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort by createdAt (most recent first)
    connections.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    // Enrich with student details
    const studentIds = [...new Set(connections.map(c => c.studentId))];
    const students = {};
    
    if (studentIds.length) {
      const promises = studentIds.map(id => db.collection('users').doc(id).get());
      const snaps = await Promise.all(promises);
      snaps.forEach(s => { 
        if (s.exists) students[s.id] = s.data(); 
      });
    }
    
    const enriched = connections.map(c => ({
      ...c,
      student: students[c.studentId] ? {
        id: c.studentId,
        name: students[c.studentId].userName || students[c.studentId].displayName || students[c.studentId].name || 'Unknown Student',
        email: students[c.studentId].email || null
      } : null
    }));
    
    res.json({ success: true, connections: enriched });
  } catch (err) {
    console.error('listConnectedStudents error:', err);
    res.status(500).json({ success: false, message: 'Failed to list connected students', error: err.message });
  }
};

export default {
  listMentors,
  createMentorRequest,
  getMentorRequestStatuses,
  listIncomingRequests,
  acceptRequest,
  rejectRequest,
  listConnectedStudents
};


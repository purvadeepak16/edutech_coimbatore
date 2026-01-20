import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";

// POST /api/group-meet/start
// body: { groupId }
export const startMeeting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.body;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!groupId) return res.status(400).json({ success: false, message: "groupId required" });

    // verify group exists and user is organizer
    const groupRef = db.collection('studyGroups').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: 'Group not found' });
    const group = groupDoc.data();
    if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can start meeting' });
    // If group already has a meetingUrl and is active, return it
    if (group.meetingUrl && group.meetingIsActive) {
      return res.json({ success: true, meeting: { meetingUrl: group.meetingUrl, createdBy: group.meetingCreatedBy, createdAt: group.meetingCreatedAt } });
    }

    // create a meeting URL (Jitsi) - use groupId to keep it stable
    const roomName = `studygroup-${groupId}`;
    const meetingUrl = `https://meet.jit.si/${roomName}`;

    // store meeting info on the group document (one meeting per group)
    try {
      await groupRef.update({
        meetingUrl,
        meetingCreatedBy: userId,
        meetingCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        meetingIsActive: true,
      });
    } catch (upErr) {
      // If update fails (e.g., missing permissions), still return meetingUrl to client
      console.warn('Failed to persist meeting URL on group doc:', upErr.message || upErr);
    }

    res.status(201).json({ success: true, meeting: { meetingUrl, createdBy: userId } });
  } catch (err) {
    console.error('Start meeting error:', err);
    res.status(500).json({ success: false, message: 'Failed to start meeting', error: err.message });
  }
};

// GET /api/group-meet/:groupId
export const getMeeting = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId required' });
    const groupRef = db.collection('studyGroups').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: 'Group not found' });
    const group = groupDoc.data();
    if (group.meetingUrl && group.meetingIsActive) {
      return res.json({ success: true, meeting: { meetingUrl: group.meetingUrl, createdBy: group.meetingCreatedBy, createdAt: group.meetingCreatedAt } });
    }
    return res.status(404).json({ success: false, message: 'No active meeting' });
  } catch (err) {
    console.error('Get meeting error:', err);
    res.status(500).json({ success: false, message: 'Failed to get meeting', error: err.message });
  }
};

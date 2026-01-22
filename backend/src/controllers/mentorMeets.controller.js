import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";

// ==================== MENTOR MEETS ====================

/**
 * Create a new mentor meet
 * POST /api/mentor/meets
 */
export const createMeet = async (req, res) => {
  try {
    const { title, subject, scheduledAt, duration, meetingUrl, maxParticipants } = req.body;
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!title || !scheduledAt) {
      return res.status(400).json({ success: false, message: "Title and scheduledAt are required" });
    }

    const data = {
      mentorId,
      title,
      subject: subject || "",
      scheduledAt,
      duration: duration || 60, // minutes
      meetingUrl: meetingUrl || null,
      maxParticipants: maxParticipants || 10,
      status: "scheduled", // scheduled | active | completed | cancelled
      participants: [], // Array of { userId, joinedAt }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection("mentorMeets").add(data);

    res.status(201).json({ 
      success: true, 
      meetId: ref.id, 
      meet: { id: ref.id, ...data } 
    });
  } catch (err) {
    console.error("Create meet error:", err);
    res.status(500).json({ success: false, message: "Failed to create meet", error: err.message });
  }
};

/**
 * List meets (for mentor: their meets; for student: available meets or their joined meets)
 * GET /api/mentor/meets?role=mentor|student&status=scheduled|active|completed
 */
export const listMeets = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role, status } = req.query;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let query = db.collection("mentorMeets");

    if (role === "mentor") {
      // Mentor viewing their meets
      query = query.where("mentorId", "==", userId);
    } else {
      // Student viewing available meets (or filter by joined meets)
      // For now, return all scheduled/active meets
      // You could add a separate endpoint for "my joined meets"
    }

    // Filter by status
    if (status && ["scheduled", "active", "completed", "cancelled"].includes(status)) {
      query = query.where("status", "==", status);
    }

    const snap = await query.orderBy("scheduledAt", "desc").limit(100).get();
    const meets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, meets, total: meets.length });
  } catch (err) {
    console.error("List meets error:", err);
    res.status(500).json({ success: false, message: "Failed to list meets", error: err.message });
  }
};

/**
 * Get meet details
 * GET /api/mentor/meets/:id
 */
export const getMeet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!id) return res.status(400).json({ success: false, message: "Meet ID required" });

    const doc = await db.collection("mentorMeets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const data = doc.data();

    res.json({ 
      success: true, 
      meet: { id: doc.id, ...data } 
    });
  } catch (err) {
    console.error("Get meet error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch meet", error: err.message });
  }
};

/**
 * Request to join a meet
 * POST /api/mentor/meets/:id/join
 */
export const requestJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const doc = await db.collection("mentorMeets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const data = doc.data();

    // Check if already requested or joined
    const existingRequest = await db.collection("mentorMeets").doc(id).collection("joinRequests")
      .doc(studentId)
      .get();

    if (existingRequest.exists) {
      const status = existingRequest.data().status;
      return res.status(400).json({ 
        success: false, 
        message: `You already ${status === "pending" ? "requested" : status} to join this meet` 
      });
    }

    // Create join request
    const requestData = {
      studentId,
      status: "pending", // pending | accepted | rejected
      requestedAt: new Date().toISOString(),
    };

    await db.collection("mentorMeets").doc(id).collection("joinRequests")
      .doc(studentId)
      .set(requestData);

    res.status(201).json({ 
      success: true, 
      message: "Join request sent",
      request: requestData 
    });
  } catch (err) {
    console.error("Request join error:", err);
    res.status(500).json({ success: false, message: "Failed to request join", error: err.message });
  }
};

/**
 * Get join requests for a meet
 * GET /api/mentor/meets/:id/join-requests
 */
export const getJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const meetDoc = await db.collection("mentorMeets").doc(id).get();
    if (!meetDoc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const meetData = meetDoc.data();

    // Verify mentor ownership
    if (meetData.mentorId !== userId) {
      return res.status(403).json({ success: false, message: "Only meet creator can view join requests" });
    }

    const requestsSnap = await db.collection("mentorMeets").doc(id).collection("joinRequests")
      .where("status", "==", "pending")
      .get();

    const requests = requestsSnap.docs.map(doc => ({ 
      id: doc.id, 
      studentId: doc.id, 
      ...doc.data() 
    }));

    res.json({ success: true, requests, total: requests.length });
  } catch (err) {
    console.error("Get join requests error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch join requests", error: err.message });
  }
};

/**
 * Accept join request
 * POST /api/mentor/meets/:id/join-requests/:studentId/accept
 */
export const acceptJoinRequest = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const meetDoc = await db.collection("mentorMeets").doc(id).get();
    if (!meetDoc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const meetData = meetDoc.data();

    // Verify mentor ownership
    if (meetData.mentorId !== mentorId) {
      return res.status(403).json({ success: false, message: "Only meet creator can accept requests" });
    }

    // Check max participants
    const participants = meetData.participants || [];
    if (participants.length >= meetData.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        message: "Meet is full" 
      });
    }

    // Update join request status
    await db.collection("mentorMeets").doc(id).collection("joinRequests")
      .doc(studentId)
      .update({
        status: "accepted",
        acceptedAt: new Date().toISOString()
      });

    // Add to participants
    await db.collection("mentorMeets").doc(id).update({
      participants: admin.firestore.FieldValue.arrayUnion({
        userId: studentId,
        joinedAt: new Date().toISOString()
      }),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Join request accepted" });
  } catch (err) {
    console.error("Accept join request error:", err);
    res.status(500).json({ success: false, message: "Failed to accept request", error: err.message });
  }
};

/**
 * Reject join request
 * POST /api/mentor/meets/:id/join-requests/:studentId/reject
 */
export const rejectJoinRequest = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const meetDoc = await db.collection("mentorMeets").doc(id).get();
    if (!meetDoc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const meetData = meetDoc.data();

    // Verify mentor ownership
    if (meetData.mentorId !== mentorId) {
      return res.status(403).json({ success: false, message: "Only meet creator can reject requests" });
    }

    // Update join request status
    await db.collection("mentorMeets").doc(id).collection("joinRequests")
      .doc(studentId)
      .update({
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });

    res.json({ success: true, message: "Join request rejected" });
  } catch (err) {
    console.error("Reject join request error:", err);
    res.status(500).json({ success: false, message: "Failed to reject request", error: err.message });
  }
};

/**
 * Start a meet (change status to active)
 * POST /api/mentor/meets/:id/start
 */
export const startMeet = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingUrl } = req.body;
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const doc = await db.collection("mentorMeets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const data = doc.data();

    // Verify mentor ownership
    if (data.mentorId !== mentorId) {
      return res.status(403).json({ success: false, message: "Only meet creator can start the meet" });
    }

    await db.collection("mentorMeets").doc(id).update({
      status: "active",
      meetingUrl: meetingUrl || data.meetingUrl,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Meet started" });
  } catch (err) {
    console.error("Start meet error:", err);
    res.status(500).json({ success: false, message: "Failed to start meet", error: err.message });
  }
};

/**
 * End a meet (change status to completed)
 * POST /api/mentor/meets/:id/end
 */
export const endMeet = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const doc = await db.collection("mentorMeets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Meet not found" });

    const data = doc.data();

    // Verify mentor ownership
    if (data.mentorId !== mentorId) {
      return res.status(403).json({ success: false, message: "Only meet creator can end the meet" });
    }

    await db.collection("mentorMeets").doc(id).update({
      status: "completed",
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Meet ended" });
  } catch (err) {
    console.error("End meet error:", err);
    res.status(500).json({ success: false, message: "Failed to end meet", error: err.message });
  }
};

/**
 * Get upcoming meets for mentor
 * GET /api/mentor/meets/upcoming
 */
export const getUpcomingMeets = async (req, res) => {
  try {
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const now = new Date().toISOString();

    // Firestore may require a composite index for combined filters (status IN + range on scheduledAt).
    // To avoid requiring a composite index during local/dev runs, fetch by mentorId and scheduledAt
    // then filter the `status` values in application code.
    let meets = [];
    try {
      const snap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .where("scheduledAt", ">=", now)
        .orderBy("scheduledAt", "asc")
        // fetch a larger batch and filter in memory
        .limit(50)
        .get();

      meets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      meets = meets.filter(m => ["scheduled", "active"].includes(m.status)).slice(0, 10);
    } catch (qerr) {
      // Fallback: some Firestore setups require a composite index for complex queries.
      // Fall back to fetching by mentorId only and filter in application code.
      console.warn('Upcoming meets query failed, falling back to mentor-only fetch:', qerr.message || qerr);
      const snap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .limit(200)
        .get();
      meets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.scheduledAt >= now && ["scheduled", "active"].includes(m.status))
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        .slice(0, 10);
    }

    res.json({ success: true, meets });
  } catch (err) {
    console.error("Upcoming meets error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch upcoming meets", error: err.message });
  }
};

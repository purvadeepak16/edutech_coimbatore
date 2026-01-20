import { db } from "../config/firebase.js";

const LIVE_SESSIONS_COLLECTION = "liveSessions";

// CREATE SESSION (Teacher)
export const createLiveSession = async (req, res) => {
  try {
    const { sessionName, sessionUrl, teacherId, teacherName, teacherEmail } = req.body;

    if (!sessionName || !sessionUrl || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Session name, session URL, and teacher ID are required",
      });
    }

    const session = {
      sessionName,
      sessionUrl,
      teacherId,
      teacherName: teacherName || "",
      teacherEmail: teacherEmail || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(LIVE_SESSIONS_COLLECTION).add(session);

    return res.status(201).json({
      success: true,
      id: docRef.id,
      session: { id: docRef.id, ...session },
    });
  } catch (error) {
    console.error("Failed to create live session", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create live session",
      error: error.message,
    });
  }
};

// GET TEACHER SESSIONS
export const getTeacherSessions = async (req, res) => {
  try {
    const { teacherId } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required",
      });
    }

    const snapshot = await db
      .collection(LIVE_SESSIONS_COLLECTION)
      .where("teacherId", "==", teacherId)
      .get();

    const sessions = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error("Failed to fetch teacher sessions", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
    });
  }
};

// GET STUDENT SESSIONS (CONNECTED TEACHERS ONLY)
export const getStudentSessions = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const teacherIds = new Set();

    // Prefer per-user connections
    try {
      const userConnSnap = await db
        .collection("users")
        .doc(studentId)
        .collection("connections")
        .where("status", "==", "accepted")
        .get();

      userConnSnap.forEach((doc) => {
        const data = doc.data();
        if (data.teacherId) teacherIds.add(data.teacherId);
      });
    } catch (err) {
      console.warn("Per-user connections failed, falling back", err.message || err);
    }

    // Fallback to global connections collection
    if (!teacherIds.size) {
      const connectionsSnap = await db
        .collection("connections")
        .where("studentId", "==", studentId)
        .where("status", "==", "accepted")
        .get();

      connectionsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.teacherId) teacherIds.add(data.teacherId);
      });
    }

    if (!teacherIds.size) {
      return res.json({ success: true, sessions: [] });
    }

    const sessions = [];
    const teacherIdArray = Array.from(teacherIds);

    // Firestore "in" limit handling
    for (let i = 0; i < teacherIdArray.length; i += 10) {
      const chunk = teacherIdArray.slice(i, i + 10);
      const snap = await db
        .collection(LIVE_SESSIONS_COLLECTION)
        .where("teacherId", "in", chunk)
        .get();

      snap.forEach((doc) => sessions.push({ id: doc.id, ...doc.data() }));
    }

    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error("Failed to fetch student sessions", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
    });
  }
};

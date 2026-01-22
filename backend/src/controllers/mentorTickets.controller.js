import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";

// ==================== DOUBT TICKETS ====================

/**
 * Create a new doubt ticket
 * POST /api/mentor/tickets
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, topic, doubt, mentorId } = req.body;
    const studentId = req.user?.id;

    if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!subject || !topic || !doubt || !mentorId) {
      return res.status(400).json({ success: false, message: "Subject, topic, doubt, and mentorId are required" });
    }

    // Check if student already has 5 active tickets with this mentor
    const activeTicketsSnap = await db.collection("doubtTickets")
      .where("studentId", "==", studentId)
      .where("mentorId", "==", mentorId)
      .where("status", "in", ["New", "In Progress"])
      .get();

    if (activeTicketsSnap.size >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have 5 active tickets with this mentor. Please resolve some before creating more." 
      });
    }

    const data = {
      studentId,
      mentorId,
      subject,
      topic,
      doubt,
      status: "New", // New | In Progress | Resolved | Closed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [], // Will store in subcollection instead
    };

    const ref = await db.collection("doubtTickets").add(data);

    res.status(201).json({ 
      success: true, 
      ticketId: ref.id, 
      ticket: { id: ref.id, ...data } 
    });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ success: false, message: "Failed to create ticket", error: err.message });
  }
};

/**
 * List tickets (for mentor: all their tickets; for student: their own tickets)
 * GET /api/mentor/tickets?role=mentor|student&mentorId=xxx
 */
export const listTickets = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role, mentorId, status } = req.query;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let query = db.collection("doubtTickets");

    if (role === "mentor") {
      // Mentor viewing their tickets
      query = query.where("mentorId", "==", userId);
    } else {
      // Student viewing their tickets (optionally filtered by mentorId)
      query = query.where("studentId", "==", userId);
      if (mentorId) query = query.where("mentorId", "==", mentorId);
    }

    // Filter by status if provided
    if (status && ["New", "In Progress", "Resolved", "Closed"].includes(status)) {
      query = query.where("status", "==", status);
    }

    const snap = await query.orderBy("createdAt", "desc").limit(100).get();
    const tickets = [];
    
    for (const doc of snap.docs) {
      const data = doc.data();
      
      // Fetch replies count from subcollection
      const repliesSnap = await db.collection("doubtTickets").doc(doc.id).collection("replies").get();
      
      tickets.push({ 
        id: doc.id, 
        ...data,
        repliesCount: repliesSnap.size
      });
    }

    res.json({ success: true, tickets, total: tickets.length });
  } catch (err) {
    console.error("List tickets error:", err);
    res.status(500).json({ success: false, message: "Failed to list tickets", error: err.message });
  }
};

/**
 * Get ticket details with replies
 * GET /api/mentor/tickets/:id
 */
export const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!id) return res.status(400).json({ success: false, message: "Ticket ID required" });

    const doc = await db.collection("doubtTickets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Ticket not found" });

    const data = doc.data();

    // Verify access: only student who created or assigned mentor can view
    if (data.studentId !== userId && data.mentorId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Fetch replies
    const repliesSnap = await db.collection("doubtTickets").doc(id).collection("replies")
      .orderBy("createdAt", "asc")
      .get();
    
    const replies = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ 
      success: true, 
      ticket: { id: doc.id, ...data },
      replies 
    });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ticket", error: err.message });
  }
};

/**
 * Update ticket status (mentor: open, resolve, close; student: close)
 * PATCH /api/mentor/tickets/:id/status
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const validStatuses = ["New", "In Progress", "Resolved", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const doc = await db.collection("doubtTickets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Ticket not found" });

    const data = doc.data();

    // Verify mentor ownership
    if (data.mentorId !== userId) {
      // Students can only close their own tickets
      if (data.studentId === userId && status === "Closed") {
        await db.collection("doubtTickets").doc(id).update({
          status: "Closed",
          updatedAt: new Date().toISOString()
        });
        return res.json({ success: true, message: "Ticket closed" });
      }
      return res.status(403).json({ success: false, message: "Only assigned mentor can update status" });
    }

    // Mentor opening ticket: check if they already have an active ticket
    if (status === "In Progress" && data.status === "New") {
      const activeTicketsSnap = await db.collection("doubtTickets")
        .where("mentorId", "==", userId)
        .where("status", "==", "In Progress")
        .get();

      if (activeTicketsSnap.size >= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "You already have an active ticket. Please resolve it before opening another." 
        });
      }
    }

    await db.collection("doubtTickets").doc(id).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Status updated", status });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.status(500).json({ success: false, message: "Failed to update status", error: err.message });
  }
};

/**
 * Add reply to ticket
 * POST /api/mentor/tickets/:id/replies
 */
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const doc = await db.collection("doubtTickets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Ticket not found" });

    const data = doc.data();

    // Verify access
    if (data.studentId !== userId && data.mentorId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Mentor can only reply when status is "In Progress"
    if (data.mentorId === userId && data.status !== "In Progress") {
      return res.status(400).json({ 
        success: false, 
        message: "Ticket must be opened (In Progress) before replying" 
      });
    }

    const replyData = {
      userId,
      message,
      createdAt: new Date().toISOString()
    };

    const replyRef = await db.collection("doubtTickets").doc(id).collection("replies").add(replyData);

    // Update ticket's updatedAt
    await db.collection("doubtTickets").doc(id).update({
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ 
      success: true, 
      reply: { id: replyRef.id, ...replyData } 
    });
  } catch (err) {
    console.error("Add reply error:", err);
    res.status(500).json({ success: false, message: "Failed to add reply", error: err.message });
  }
};

/**
 * Get mentor dashboard stats
 * GET /api/mentor/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get ticket counts
    const newTicketsSnap = await db.collection("doubtTickets")
      .where("mentorId", "==", mentorId)
      .where("status", "==", "New")
      .get();

    const activeTicketsSnap = await db.collection("doubtTickets")
      .where("mentorId", "==", mentorId)
      .where("status", "==", "In Progress")
      .get();

    // Get today's meets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    let todayMeetsSnap;
    try {
      todayMeetsSnap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .where("scheduledAt", ">=", todayISO)
        .orderBy("scheduledAt", "asc")
        .limit(50)
        .get();
    } catch (qerr) {
      console.warn('Today meets optimized query failed, falling back to mentor-only fetch:', qerr.message || qerr);
      todayMeetsSnap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .limit(500)
        .get();
    }

    // Get this week's meets
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartISO = weekStart.toISOString();

    let weekMeetsSnap;
    try {
      weekMeetsSnap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .where("scheduledAt", ">=", weekStartISO)
        .orderBy("scheduledAt", "asc")
        .limit(200)
        .get();
    } catch (qerr) {
      console.warn('Week meets optimized query failed, falling back to mentor-only fetch:', qerr.message || qerr);
      weekMeetsSnap = await db.collection("mentorMeets")
        .where("mentorId", "==", mentorId)
        .limit(500)
        .get();
    }

    const todayMeets = todayMeetsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.scheduledAt >= todayISO && ["scheduled", "active"].includes(m.status));

    const weekMeets = weekMeetsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.scheduledAt >= weekStartISO && ["scheduled", "active"].includes(m.status));

    res.json({
      success: true,
      stats: {
        newTickets: newTicketsSnap.size,
        activeTickets: activeTicketsSnap.size,
        meetsToday: todayMeets.length,
        meetsThisWeek: weekMeets.length
      }
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats", error: err.message });
  }
};

/**
 * Get priority tickets (new tickets sorted by pending time)
 * GET /api/mentor/tickets/priority
 */
export const getPriorityTickets = async (req, res) => {
  try {
    const mentorId = req.user?.id;

    if (!mentorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get all New tickets for this mentor (removed orderBy to avoid index issues)
    const snap = await db.collection("doubtTickets")
      .where("mentorId", "==", mentorId)
      .where("status", "==", "New")
      .get();

    let tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory by createdAt (oldest first for priority)
    tickets.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateA - dateB; // Oldest first
    });
    
    // Limit to 5
    tickets = tickets.slice(0, 5);

    res.json({ success: true, tickets });
  } catch (err) {
    console.error("Priority tickets error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch priority tickets", error: err.message });
  }
};

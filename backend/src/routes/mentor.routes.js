import express from "express";
import auth from "../middleware/auth.js";
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  addReply,
  getDashboardStats,
  getPriorityTickets,
} from "../controllers/mentorTickets.controller.js";
import {
  createMeet,
  listMeets,
  getMeet,
  requestJoin,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  startMeet,
  endMeet,
  getUpcomingMeets,
} from "../controllers/mentorMeets.controller.js";

const router = express.Router();

// ==================== DOUBT TICKETS ====================

// List tickets (query params: role=mentor|student, mentorId, status)
router.get("/tickets", auth, listTickets);

// Get priority tickets (for mentor dashboard)
router.get("/tickets/priority", auth, getPriorityTickets);

// Create ticket
router.post("/tickets", auth, createTicket);

// Get ticket details
router.get("/tickets/:id", auth, getTicket);

// Update ticket status
router.patch("/tickets/:id/status", auth, updateTicketStatus);

// Add reply to ticket
router.post("/tickets/:id/replies", auth, addReply);

// ==================== DASHBOARD ====================

// Get dashboard stats
router.get("/dashboard/stats", auth, getDashboardStats);

// ==================== MEETS ====================

// List meets (query params: role=mentor|student, status)
router.get("/meets", auth, listMeets);

// Get upcoming meets
router.get("/meets/upcoming", auth, getUpcomingMeets);

// Create meet
router.post("/meets", auth, createMeet);

// Get meet details
router.get("/meets/:id", auth, getMeet);

// Join request
router.post("/meets/:id/join", auth, requestJoin);

// Get join requests (mentor only)
router.get("/meets/:id/join-requests", auth, getJoinRequests);

// Accept join request
router.post("/meets/:id/join-requests/:studentId/accept", auth, acceptJoinRequest);

// Reject join request
router.post("/meets/:id/join-requests/:studentId/reject", auth, rejectJoinRequest);

// Start meet
router.post("/meets/:id/start", auth, startMeet);

// End meet
router.post("/meets/:id/end", auth, endMeet);

export default router;

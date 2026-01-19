import express from "express";
import auth from "../middleware/auth.js";
import {
  createStudyGroup,
  listStudyGroups,
  getStudyGroup,
  joinStudyGroup,
  sendMessage,
  getMessages,
  approveRequest,
  leaveStudyGroup,
  deleteStudyGroup,
} from "../controllers/studyGroups.controller.js";

const router = express.Router();

// List groups (public + my groups)
router.get("/", auth, listStudyGroups);

// Create group
router.post("/", auth, createStudyGroup);

// Get group details
router.get("/:id", auth, getStudyGroup);

// Join group
router.post("/:id/join", auth, joinStudyGroup);

// Chat
router.post("/:id/messages", auth, sendMessage);
// Fetch messages
router.get("/:id/messages", auth, getMessages);

// Leave
router.post("/:id/leave", auth, leaveStudyGroup);

// Delete
router.delete("/:id", auth, deleteStudyGroup);

export default router;

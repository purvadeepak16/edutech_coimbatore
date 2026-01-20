import express from "express";
import {
  createLiveSession,
  getTeacherSessions,
  getStudentSessions,
} from "../controllers/liveSessions.controller.js";

const router = express.Router();

// Teacher creates a live session
router.post("/", createLiveSession);

// Teacher fetches own sessions
router.get("/teacher", getTeacherSessions);

// Student fetches live sessions
router.get("/student", getStudentSessions);

export default router;

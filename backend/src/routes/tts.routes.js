import express from "express";
import { generateTTSFromConversation, generateTTSFromText } from "../controllers/tts.controller.js";

const router = express.Router();

// POST /api/tts/conversation - Generate TTS from stored conversation
router.post("/conversation", generateTTSFromConversation);

// POST /api/tts/text - Generate TTS from plain text
router.post("/text", generateTTSFromText);

// Backward compatibility: /generate as alias for /text
router.post("/generate", generateTTSFromText);

export default router;

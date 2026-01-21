import express from "express";
import { generateTTSFromConversation, generateTTSFromText, generateEnrichedTTS, generateStructuredNotesTTS } from "../controllers/tts.controller.js";

const router = express.Router();

// POST /api/tts/conversation - Generate TTS from stored conversation
router.post("/conversation", generateTTSFromConversation);

// POST /api/tts/text - Generate TTS from plain text
router.post("/text", generateTTSFromText);

// POST /api/tts/enriched - Generate enriched notes via OpenRouter, then TTS
// Body: { task: "topic" } or { topic: "topic" }
router.post("/enriched", generateEnrichedTTS);

// POST /api/tts/structured-notes - Generate structured notes (Definition/Meaning/Examples), then dialogue TTS
// Body: { topic: "topic" } or { subtopic: "topic" }
// Returns: structured notes + dialogue audio with male/female voices
router.post("/structured-notes", generateStructuredNotesTTS);

// Backward compatibility: /generate as alias for /text
router.post("/generate", generateTTSFromText);

export default router;

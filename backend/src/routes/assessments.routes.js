import express from 'express';
import { generateQuiz, saveQuiz } from '../controllers/assessments.controller.js';

const router = express.Router();

// POST /api/assessments/generate-quiz
router.post('/generate-quiz', generateQuiz);
router.post('/save-quiz', saveQuiz);

export default router;

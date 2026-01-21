import express from 'express';
import { generateQuiz } from '../controllers/assessments.controller.js';

const router = express.Router();

// POST /api/assessments/generate-quiz
router.post('/generate-quiz', generateQuiz);

export default router;

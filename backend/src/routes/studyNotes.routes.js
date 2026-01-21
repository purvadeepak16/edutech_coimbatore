import express from 'express';
import auth from '../middleware/auth.js';
import { generateStudyNotesWithCache } from '../controllers/studyNotes.controller.js';

const router = express.Router();

router.post('/generate', auth, generateStudyNotesWithCache);

export default router;

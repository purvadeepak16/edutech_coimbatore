import express from 'express';
import auth from '../middleware/auth.js';
import { startMeeting, getMeeting } from '../controllers/groupMeet.controller.js';

const router = express.Router();

// Organizer starts meeting (idempotent)
router.post('/start', auth, startMeeting);

// Get active meeting for group
router.get('/:groupId', auth, getMeeting);

export default router;

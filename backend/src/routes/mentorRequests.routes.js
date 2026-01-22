import express from 'express';
import auth from '../middleware/auth.js';
import {
  listMentors,
  createMentorRequest,
  getMentorRequestStatuses,
  listIncomingRequests,
  acceptRequest,
  rejectRequest,
  listConnectedStudents,
} from '../controllers/mentorRequests.controller.js';

const router = express.Router();

// Student: list mentors (public)
router.get('/mentors', listMentors);

// Student: create mentor request
router.post('/mentor-requests', auth, createMentorRequest);

// Student: get request statuses (for current student)
router.get('/mentor-requests/status', auth, getMentorRequestStatuses);

// Mentor: list incoming requests
router.get('/mentor-requests', auth, listIncomingRequests);

// Mentor: accept/reject
router.post('/mentor-requests/:id/accept', auth, acceptRequest);
router.post('/mentor-requests/:id/reject', auth, rejectRequest);

// Mentor: list connected students
router.get('/mentor-connections', auth, listConnectedStudents);

export default router;

import express from 'express';
import multer from 'multer';
import { parsePdf } from '../services/pdfParser.js';
import { validateExtractedTopics, normalizeSyllabus } from '../services/syllabusService.js';
import { extractSyllabusFromText, proposeSyllabus, structureExamSyllabus, generateStudyPlan } from '../services/aiExtractor.js';
import { planSyllabus } from '../services/syllabusAI.js';
import { generateDailySchedule, formatDailySchedule } from '../services/scheduleService.js';
import { saveSyllabus, saveTopicAssignments, getAssignedTopics, getDailySchedule } from '../services/firestoreService.js';
import { getExamSyllabus, listAvailableExams } from '../data/examSyllabi.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * POST /api/syllabus/pdf
 * Process PDF syllabus upload
 */
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No PDF file uploaded',
        message: 'Please select a PDF file to upload'
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Empty PDF file',
        message: 'The uploaded file is empty'
      });
    }

    const { subject, userId } = req.body;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a user ID to save the schedule'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
        message: 'Please provide both start and end dates for the study plan'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'End date must be after start date'
      });
    }

    console.log('Processing PDF:', req.file.originalname, '(' + req.file.size + ' bytes)');

    // Parse PDF (single attempt)
    const { text: cleanedText, pageCount } = await parsePdf(req.file.buffer);

    // Delegate AI planning to syllabusAI (OpenRouter)
    const aiPlan = await planSyllabus(cleanedText, subject || '', req.body.level || '');

    // Transform AI plan into frontend-expected format
    const units = (aiPlan.study_plan || []).map((phase, idx) => ({
      id: `unit-${idx + 1}`,
      name: phase.phase || `Phase ${idx + 1}`,
      topics: (phase.topics || []).map((topic, topicIdx) => ({
        id: `topic-${idx}-${topicIdx}`,
        title: typeof topic === 'string' ? topic : topic.title || topic.topic || 'Unknown',
        difficulty: (typeof topic === 'string' ? 'medium' : topic.difficulty) || 'medium',
        confidence: 1.0
      }))
    }));

    // Transform important_topics from AI to match frontend expectations
    const importantPoints = (aiPlan.important_topics || []).map((item, idx) => ({
      topic: item.topic || 'Unknown Topic',
      unit: units[0]?.name || 'General',
      priority: item.difficulty || 'medium',
      reason: item.reason || 'Important for understanding the subject',
      estimatedHours: 2,
      isPrerequisite: false,
      requiresExtraPractice: (item.difficulty === 'hard')
    }));

    // Normalize syllabus for frontend compatibility
    const normalizedSyllabus = normalizeSyllabus({
      subject: aiPlan.subject || subject || 'Unknown Subject',
      source: 'pdf',
      units,
      metadata: {
        pdfName: req.file.originalname,
        pdfSize: req.file.size,
        pages: pageCount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });

    // Check for already assigned topics to avoid redundancy
    let assignedTopicIds = [];
    try {
      assignedTopicIds = await getAssignedTopics(userId);
      console.log(`Found ${assignedTopicIds.length} already assigned topics for user ${userId}`);
    } catch (error) {
      console.log('No previous assignments found, starting fresh');
    }

    // Generate daily schedule excluding already assigned topics
    const dailySchedule = generateDailySchedule(units, startDate, endDate, assignedTopicIds);
    const formattedSchedule = formatDailySchedule(dailySchedule);

    // Save to Firestore
    try {
      // Save syllabus structure with defaults for all undefined values
      await saveSyllabus(userId, {
        subject: normalizedSyllabus.subject || 'Unknown Subject',
        units: units.map(unit => ({
          id: unit.id || `unit-${Math.random()}`,
          name: unit.name || 'Unnamed Unit',
          topics: unit.topics.map(topic => ({
            id: topic.id || `topic-${Math.random()}`,
            title: topic.title || 'Unnamed Topic',
            difficulty: topic.difficulty || 'medium',
            confidence: topic.confidence || 1.0
          }))
        })),
        metadata: normalizedSyllabus.metadata || {}
      });

      // Save topic assignments
      const assignments = formattedSchedule.schedule.map(day => ({
        date: day.date,
        topics: day.topics,
        topicIds: day.topicIds,
        units: day.units
      }));
      
      await saveTopicAssignments(userId, assignments);
      
      console.log(`✅ Saved syllabus and ${assignments.length} daily assignments`);
    } catch (firestoreError) {
      console.error('Failed to save to Firestore:', firestoreError);
      // Continue execution even if Firestore save fails
    }

    // Return frontend-compatible response
    res.json({
      success: true,
      syllabus: normalizedSyllabus,
      dailySchedule: formattedSchedule,
      studyPlan: {
        totalWeeks: Math.ceil(units.length * 2),
        weeklySchedule: units.map((unit, idx) => ({
          week: idx + 1,
          unit: unit.name,
          topics: unit.topics.map(t => t.title),
          hoursRequired: unit.topics.length * 2
        }))
      },
      importantPoints: importantPoints,
      recommendations: [`Review ${aiPlan.subject || 'the syllabus'} systematically following the daily plan from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`],
      warnings: null
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Return detailed error without crashing server
    const statusCode = error.message.includes('pdf-parse') ? 503 : 500;
    res.status(statusCode).json({ 
      success: false,
      error: 'Failed to process PDF',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/syllabus/manual
 * Generate syllabus proposal for manual input mode
 */
router.post('/manual', async (req, res) => {
  try {
    const { subject, level } = req.body;

    if (!subject || !level) {
      return res.status(400).json({ 
        error: 'Subject and level are required' 
      });
    }

    // Generate AI proposal (if AI is unavailable, fall back to a deterministic proposal)
    let proposedUnits;
    try {
      proposedUnits = await proposeSyllabus(subject, level);
    } catch (aiError) {
      console.warn('AI proposeSyllabus failed, falling back to local proposal:', aiError.message);
      // Fallback deterministic proposal: create 4 units with simple topics derived from subject
      const baseTopics = (subject || 'Topic').split(/\s+/).filter(Boolean);
      const topicSeed = baseTopics.length > 0 ? baseTopics : ['Introduction', 'Core', 'Advanced'];
      proposedUnits = Array.from({ length: 4 }).map((_, ui) => ({
        name: `Unit ${ui + 1}`,
        topics: Array.from({ length: Math.min(3, topicSeed.length) }).map((__, ti) => ({
          title: `${topicSeed[ti % topicSeed.length]} - Part ${ui + 1}`,
          difficulty: ti === 0 ? 'easy' : ti === 1 ? 'medium' : 'hard',
          estimatedHours: 2 + ui
        }))
      }));
    }

    // Normalize syllabus
    const normalizedSyllabus = normalizeSyllabus({
      subject,
      source: 'manual',
      level,
      units: proposedUnits,
      metadata: {
        isDraft: true
      }
    });

    res.json({
      success: true,
      syllabus: normalizedSyllabus,
      message: 'This is a draft proposal. Please review and edit as needed.'
    });

  } catch (error) {
    console.error('Manual syllabus generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate syllabus proposal',
      message: error.message 
    });
  }
});

/**
 * GET /api/syllabus/exam/list
 * List available exam syllabi
 */
router.get('/exam/list', (req, res) => {
  try {
    const exams = listAvailableExams();
    res.json({
      success: true,
      exams
    });
  } catch (error) {
    console.error('List exams error:', error);
    res.status(500).json({ 
      error: 'Failed to list exams',
      message: error.message 
    });
  }
});

/**
 * POST /api/syllabus/exam
 * Structure exam-based syllabus
 */
router.post('/exam', async (req, res) => {
  try {
    const { examType, subject } = req.body;

    if (!examType || !subject) {
      return res.status(400).json({ 
        error: 'Exam type and subject are required' 
      });
    }

    // Get pre-stored exam syllabus
    const examText = getExamSyllabus(examType, subject);

    if (!examText) {
      return res.status(404).json({ 
        error: 'Exam syllabus not found',
        message: `No syllabus available for ${examType} - ${subject}` 
      });
    }

    // Structure using AI (only for formatting, not content)
    const structuredUnits = await structureExamSyllabus(examText, examType);

    // Normalize syllabus
    const normalizedSyllabus = normalizeSyllabus({
      subject,
      source: 'exam',
      level: examType,
      units: structuredUnits,
      metadata: {
        examType,
        official: true
      }
    });

    res.json({
      success: true,
      syllabus: normalizedSyllabus,
      message: 'Official exam syllabus loaded. You can edit topics as needed.'
    });

  } catch (error) {
    console.error('Exam syllabus processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process exam syllabus',
      message: error.message 
    });
  }
});

/**
 * POST /api/syllabus/confirm
 * Confirm and save edited syllabus
 */
router.post('/confirm', async (req, res) => {
  try {
    const { syllabus } = req.body;

    if (!syllabus || !syllabus.units) {
      return res.status(400).json({ 
        error: 'Invalid syllabus data' 
      });
    }

    // In a real app, save to database here
    // For now, just return the confirmed syllabus
    const confirmedSyllabus = {
      ...syllabus,
      metadata: {
        ...syllabus.metadata,
        confirmed: true,
        confirmedAt: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      syllabus: confirmedSyllabus,
      message: 'Syllabus confirmed and saved'
    });

  } catch (error) {
    console.error('Syllabus confirmation error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm syllabus',
      message: error.message 
    });
  }
});

/**
 * GET /api/syllabus/schedule/:userId
 * Get daily schedule for a user
 */
router.get('/schedule/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const schedule = await getDailySchedule(userId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'No schedule found for this user',
        message: 'Please upload a syllabus to generate a schedule'
      });
    }

    res.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule',
      message: error.message
    });
  }
});

export default router;

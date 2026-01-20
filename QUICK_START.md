# Quick Start Guide

## Prerequisites
- Node.js (v16 or higher)
- OpenRouter API key (get one at https://openrouter.ai/)

## Step 1: Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Create `.env` file:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=5000
```

3. Start backend server:
```bash
npm run dev
```

You should see:
```
✓ Backend server running on http://localhost:5000
✓ Health check available at http://localhost:5000/api/health
✓ Syllabus API available at http://localhost:5000/api/syllabus
```

## Step 2: Frontend Setup

1. Open new terminal and navigate to frontend:
```bash
cd frontend
```

2. Start frontend (dependencies already installed):
```bash
npm run dev
```

3. Open browser to `http://localhost:5173`

## Step 3: Using the System

### Navigate to Syllabus Page
- Click "Syllabus" in the sidebar

### Try PDF Mode
1. Click "PDF Upload" card
2. Enter subject name (optional)
3. Upload a syllabus PDF
4. Click "Upload & Extract"
5. Wait for AI to process (10-30 seconds)
6. Review extracted topics
7. Check for low-confidence warnings (yellow highlights)
8. Edit any incorrect topics by clicking the ✏️ icon
9. Click "Confirm & Save"

### Try Manual Mode
1. Click "Manual Input" card
2. Enter subject (e.g., "Data Structures")
3. Select level (e.g., "Undergraduate")
4. Click "Generate Proposal"
5. AI will propose a comprehensive syllabus
6. Edit topics as needed
7. Click "Confirm & Save"

### Try Exam Mode
1. Click "Exam-Based" card
2. Select an exam (e.g., "JEE Main - Physics")
3. Click "Load Syllabus"
4. Review official exam syllabus
5. Make edits if needed
6. Click "Confirm & Save"

## Available Exam Syllabi

- JEE Main - Physics
- JEE Main - Chemistry
- JEE Main - Mathematics
- GATE - Computer Science
- Mathematical Olympiad

## Editing Features

### Units
- Click unit name to rename
- Click ➕ to add topic to unit
- Click 🗑️ to delete unit

### Topics
- Click ✏️ to edit topic
- Edit title, difficulty, estimated hours
- Click "Done" when finished
- Click 🗑️ to delete topic

### Global Actions
- "Add Unit" button at bottom to add new unit
- "Cancel" to discard changes
- "Confirm & Save" to finalize

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify all npm packages installed: `npm install`

### PDF upload fails
- Check file is actually PDF (max 10MB)
- Verify OpenRouter API key is set in `.env`
- Check backend console for errors

### AI extraction takes too long
- Normal processing time: 10-30 seconds
- Check internet connection
- Verify OpenRouter API key is valid

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check for CORS errors in browser console
- Ensure both servers are running

## API Testing with curl

### Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

### List available exams:
```bash
curl http://localhost:5000/api/syllabus/exam/list
```

### Test manual mode:
```bash
curl -X POST http://localhost:5000/api/syllabus/manual \
  -H "Content-Type: application/json" \
  -d '{"subject":"Physics","level":"high-school"}'
```

## Next Steps

1. Add your own exam syllabi to `backend/src/data/examSyllabi.js`
2. Integrate with database for persistence
3. Connect syllabus to study plan generation
4. Build scheduling logic on top of normalized syllabus data

## Important Files

- Backend API: `backend/src/routes/syllabus.js`
- PDF Parser: `backend/src/services/pdfParser.js`
- AI Service: `backend/src/services/aiExtractor.js`
- Frontend UI: `frontend/src/components/SyllabusIngestion.jsx`
- Editor: `frontend/src/components/SyllabusEditor.jsx`

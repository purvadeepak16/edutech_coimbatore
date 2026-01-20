# Quick Start Guide: Syllabus Ingestion System

## Prerequisites
- Node.js 18+ installed
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

## Setup (5 minutes)

### 1. Configure Backend

```bash
cd backend

# Add your OpenRouter API key to .env file
# Edit backend/.env and replace 'your_key_here' with your actual key
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✓ Backend server running on http://localhost:5000
✓ Health check available at http://localhost:5000/api/health
✓ Syllabus API available at http://localhost:5000/api/syllabus
```

### 3. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Using the System

### Test the Backend First

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# List available exams
curl http://localhost:5000/api/syllabus/exam/list
```

### Access the Frontend

1. Open `http://localhost:5173` in your browser
2. Navigate to "Syllabus" page
3. Try each mode:

#### PDF Mode
- Select "PDF Upload"
- Enter subject name (e.g., "Physics")
- Upload a syllabus PDF
- Wait for parsing (10-30 seconds)
- Review extracted topics
- Edit if needed
- Save

#### Manual Mode
- Select "Manual Input"
- Enter subject (e.g., "Chemistry")
- Choose level (e.g., "High School")
- Wait for AI generation
- Edit proposed topics
- Save

#### Exam Mode
- Select "Exam-Based"
- Choose exam (e.g., "JEE Main - Physics")
- Load official syllabus
- Edit if needed
- Save

---

## Key Features to Test

✅ **Single Mode Selection** - Other modes disable when one is selected
✅ **Low Confidence Warnings** (PDF mode) - Check which topics need review
✅ **Full Editing** - Add, rename, delete units and topics
✅ **Validation** - Try submitting without required fields
✅ **Reset** - Click "Start New Syllabus" to try another mode

---

## Troubleshooting

### Server won't start?
- Check if port 5000 is available
- Verify .env file exists in backend/
- Check Node.js version (should be 18+)

### Frontend shows connection error?
- Ensure backend is running on port 5000
- Check browser console for specific errors
- Verify CORS is not being blocked

### PDF upload fails?
- Check file size (must be < 10MB)
- Verify it's a valid PDF file
- Check backend console for errors

### AI extraction fails?
- Verify OPENROUTER_API_KEY is set in backend/.env
- Check you have API credits on OpenRouter
- Review backend logs for specific error message

---

## Next Steps

- **Add more exam syllabi** in [backend/src/data/examSyllabi.js](backend/src/data/examSyllabi.js)
- **Customize AI prompts** in [backend/src/services/aiExtractor.js](backend/src/services/aiExtractor.js)
- **Adjust PDF cleaning** in [backend/src/services/pdfParser.js](backend/src/services/pdfParser.js)
- **Style the UI** in `frontend/src/components/SyllabusIngestion.css`

---

## API Documentation

### Endpoints

**GET** `/api/health`
- Health check

**GET** `/api/syllabus/exam/list`
- Get available exams
- Response: `{ success: true, exams: [...] }`

**POST** `/api/syllabus/pdf`
- Upload PDF (multipart/form-data)
- Fields: `pdf` (file), `subject` (string)
- Response: `{ success: true, syllabus: {...}, warnings: [...] }`

**POST** `/api/syllabus/manual`
- Generate manual syllabus
- Body: `{ subject: string, level: string }`
- Response: `{ success: true, syllabus: {...} }`

**POST** `/api/syllabus/exam`
- Load exam syllabus
- Body: `{ examId: string }`
- Response: `{ success: true, syllabus: {...} }`

**PUT** `/api/syllabus/:id`
- Update syllabus
- Body: `{ syllabus: {...} }`
- Response: `{ success: true, syllabus: {...} }`

---

## Data Model

All syllabi normalize to:

```javascript
{
  id: "uuid",
  subject: "Physics",
  source: "pdf" | "manual" | "exam",
  units: [
    {
      id: "uuid",
      name: "Unit 1: Mechanics",
      topics: [
        {
          id: "uuid",
          title: "Newton's Laws",
          difficulty: "medium",        // optional
          estimatedHours: 4,           // optional
          confidence: 0.95             // PDF mode only
        }
      ]
    }
  ],
  createdAt: "ISO timestamp",
  metadata: {
    pdfName: "syllabus.pdf",          // PDF mode
    level: "undergraduate",            // Manual mode
    examType: "JEE Main - Physics"    // Exam mode
  }
}
```

---

**Ready to Go! 🚀**

Start both servers and navigate to http://localhost:5173/syllabus

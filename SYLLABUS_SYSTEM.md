# Syllabus Ingestion System

A comprehensive syllabus management system with three distinct ingestion modes and AI-powered extraction.

## 🎯 Features

### Three Ingestion Modes (One at a Time)

1. **PDF Upload Mode**
   - Upload syllabus PDF files
   - Automatic text cleaning (removes headers/footers/page numbers)
   - Structure detection using layout heuristics
   - AI-powered topic extraction with validation
   - Confidence scoring for extracted topics
   - Low-confidence topics are flagged for review

2. **Manual Input Mode**
   - Select subject and education level
   - AI proposes comprehensive syllabus structure
   - Fully editable draft proposal
   - User confirms or modifies before saving

3. **Exam-Based Mode**
   - Pre-stored official exam syllabi (JEE, GATE, Olympiad)
   - AI only structures content (doesn't modify topics)
   - Editable after loading

## 🏗️ Architecture

### Backend Structure

```
backend/
├── src/
│   ├── server.js                    # Main server with routes
│   ├── types/
│   │   └── syllabus.js             # Data model definitions
│   ├── services/
│   │   ├── pdfParser.js            # PDF parsing & cleaning
│   │   ├── aiExtractor.js          # OpenRouter AI integration
│   │   └── syllabusService.js      # Normalization & CRUD ops
│   ├── data/
│   │   └── examSyllabi.js          # Pre-stored exam syllabi
│   └── routes/
│       └── syllabus.js             # API endpoints
└── .env.example                     # Environment variables template
```

### Unified Data Model

All modes normalize to this structure:

```javascript
{
  id: string,
  subject: string,
  source: 'pdf' | 'manual' | 'exam',
  level?: string,
  units: [
    {
      id: string,
      name: string,
      topics: [
        {
          id: string,
          title: string,
          difficulty?: 'easy' | 'medium' | 'hard',
          estimatedHours?: number,
          confidence?: number  // For PDF mode
        }
      ]
    }
  ],
  createdAt: Date,
  metadata: {
    pdfName?: string,
    examType?: string,
    confirmed?: boolean
  }
}
```

## 🔧 Setup

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_key_here
```

4. Start server:
```bash
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start dev server:
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

## 📡 API Endpoints

### POST /api/syllabus/pdf
Upload and parse PDF syllabus

**Request:**
- Content-Type: `multipart/form-data`
- Body: `pdf` (file), `subject` (string, optional)

**Response:**
```json
{
  "success": true,
  "syllabus": { /* normalized syllabus */ },
  "warnings": {
    "message": "Some topics have low confidence scores",
    "topics": [/* low confidence topics */]
  }
}
```

### POST /api/syllabus/manual
Generate syllabus proposal

**Request:**
```json
{
  "subject": "Computer Science",
  "level": "undergraduate"
}
```

**Response:**
```json
{
  "success": true,
  "syllabus": { /* normalized syllabus */ },
  "message": "This is a draft proposal. Please review and edit."
}
```

### GET /api/syllabus/exam/list
List available exam syllabi

**Response:**
```json
{
  "success": true,
  "exams": [
    { "examType": "JEE_MAIN", "subject": "PHYSICS", "label": "JEE Main - Physics" }
  ]
}
```

### POST /api/syllabus/exam
Load exam syllabus

**Request:**
```json
{
  "examType": "JEE_MAIN",
  "subject": "PHYSICS"
}
```

### POST /api/syllabus/confirm
Confirm and save edited syllabus

**Request:**
```json
{
  "syllabus": { /* edited syllabus */ }
}
```

## 🎨 Frontend Components

### SyllabusIngestion.jsx
- Mode selection UI
- Form inputs for each mode
- API integration
- Loading states and error handling

### SyllabusEditor.jsx
- Editable tree view of syllabus
- Add/edit/delete units and topics
- Expand/collapse units
- Highlight low-confidence topics
- Inline editing with keyboard support

## 🔐 Environment Variables

### Backend (.env)
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

## 🧪 Testing the System

### Test PDF Mode
1. Select "PDF Upload" mode
2. Upload a syllabus PDF
3. Review extracted topics
4. Check for low-confidence warnings
5. Edit any incorrect topics
6. Confirm and save

### Test Manual Mode
1. Select "Manual Input" mode
2. Enter subject (e.g., "Physics")
3. Select level (e.g., "High School")
4. Review AI-proposed syllabus
5. Edit topics as needed
6. Confirm and save

### Test Exam Mode
1. Select "Exam-Based" mode
2. Choose exam (e.g., "JEE Main - Physics")
3. Review loaded syllabus
4. Make edits if needed
5. Confirm and save

## 🚀 Key Design Decisions

### 1. Exclusive Mode Selection
Only ONE mode can be active at a time to prevent confusion and ensure clear user intent.

### 2. Separation of Concerns
- **pdfParser.js**: Pure PDF processing (no AI)
- **aiExtractor.js**: AI operations only
- **syllabusService.js**: Data normalization and CRUD

### 3. AI Validation
PDF-extracted topics are matched against original text with confidence scores to detect hallucinations.

### 4. User Control
AI output is always a draft. Users must review and confirm before saving.

### 5. Pre-stored Exam Data
Official exam syllabi are stored locally, not fetched from the internet, ensuring accuracy.

## 📊 Confidence Scoring (PDF Mode)

Topics are validated against source text:
- **1.0**: Exact match found in PDF
- **0.8**: Partial match (>70% of words)
- **0.6**: Weak match (>50% of words)
- **0.3**: Very weak/likely hallucinated

Topics with confidence < 0.6 are flagged for review.

## 🔄 Future Enhancements

- Database integration for persistence
- Batch PDF processing
- Custom exam syllabus addition
- Export to various formats (JSON, CSV)
- Syllabus comparison tool
- Study plan generation from syllabus

## 📝 Notes

- PDF processing quality depends on PDF structure
- OpenRouter API key required for AI features
- Frontend expects backend at `localhost:5000`
- All paths use forward slashes, works on Windows/Mac/Linux

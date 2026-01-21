# 🎤 Text-to-Speech Feature Implementation Guide

## Overview
The feature generates an interactive conversation between a student and teacher based on study notes, then converts that conversation to speech.

## ✅ Architecture & Flow

### 1. **Frontend (React)**
- User enters study notes in `StudyPlanSection.jsx`
- Clicks "Generate Audio" button
- Saves note to Firestore with `status: "generating-conversation"`
- Gets Firebase ID token for authentication

### 2. **Backend Node.js Server** (runs on `http://localhost:5000`)

#### Step 1: Generate Conversation
- **Endpoint:** `POST /api/openrouter/conversation`
- **Controller:** `openrouter.controller.js`
- **Process:**
  - Verifies Firebase token
  - Takes user's study notes
  - Calls OpenRouter API with gpt-4o-mini model
  - Receives conversation JSON: `[{ role: "student", text: "..." }, { role: "teacher", text: "..." }]`
  - Stores conversation in Firestore at: `notes/audioNotes/users/{userId}/entries/{noteId}`

#### Step 2: Generate TTS from Conversation
- **Endpoint:** `POST /api/tts/conversation`
- **Controller:** `tts.controller.js` (NEW)
- **Process:**
  - Verifies Firebase token
  - Fetches the stored conversation from Firestore
  - Formats dialogue as readable text: "Student: question\nTeacher: answer\n..."
  - Calls Python Flask TTS service at `http://127.0.0.1:5001/tts`
  - Receives audio URL and filename
  - Stores audio URL in same Firestore document
  - Returns audio URL to frontend

### 3. **Python Flask TTS Service** (runs on `http://127.0.0.1:5001`)

- **Endpoint:** `POST /tts`
- **Process:**
  - Receives text (conversation dialogue)
  - Uses TTS library (VITS model) with eSpeak NG
  - Generates WAV audio file
  - Saves to `generated_audio/` folder
  - Returns JSON: `{ "url": "http://127.0.0.1:5001/audio/{filename}", "filename": "..." }`

- **Endpoint:** `GET /audio/<filename>`
  - Serves audio files from `generated_audio/` folder
  - Handles CORS for browser playback

---

## 📋 Required Services

### 1. **Python Virtual Environment (tts-env)**
```bash
cd backend/tts_service
python -m venv tts-env
# Activate:
tts-env\Scripts\activate  # Windows
```

### 2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 3. **System Requirements**
- **eSpeak NG** installed at: `C:\Program Files\eSpeak NG\`
  - Download from: https://github.com/espeak-ng/espeak-ng/releases
  - Path automatically configured in app.py

---

## 🚀 Running the Application

### Terminal 1: Python TTS Service
```bash
cd backend/tts_service
tts-env\Scripts\activate  # Activate virtual env
python app.py
# Expected output: "Running on http://127.0.0.1:5001"
```

### Terminal 2: Node Backend
```bash
cd backend
npm install  # if not done
npm run dev
# Expected output: "Backend server running on http://localhost:5000"
```

### Terminal 3: React Frontend
```bash
cd frontend
npm install  # if not done
npm run dev
# Expected output: "Local: http://localhost:5173/"
```

---

## 🔄 Complete Flow Sequence

```
1. User enters notes in frontend
   ↓
2. Frontend saves note to Firestore
   ↓
3. Frontend calls POST /api/openrouter/conversation with token
   ↓
4. Backend generates conversation with OpenRouter (30-60 seconds)
   ↓
5. Backend stores conversation in Firestore
   ↓
6. Frontend calls POST /api/tts/conversation with token
   ↓
7. Backend fetches conversation from Firestore
   ↓
8. Backend sends formatted dialogue to Python TTS service
   ↓
9. Python service generates WAV audio (20-40 seconds)
   ↓
10. Backend stores audio URL in Firestore
    ↓
11. Frontend plays audio in <audio> element
```

---

## 🔐 Security & Authentication

- All requests require Firebase ID token in `Authorization: Bearer {token}` header
- Tokens are verified on backend before accessing Firestore
- Only authenticated users can create/access their own notes

---

## 📁 File Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── openrouter.routes.js       (Conversation generation)
│   │   └── tts.routes.js              (TTS endpoints)
│   └── controllers/
│       ├── openrouter.controller.js   (Conversation logic)
│       └── tts.controller.js          (TTS & Firestore fetch)
└── tts_service/
    ├── app.py                         (Flask TTS service)
    ├── requirements.txt               (Python dependencies)
    └── generated_audio/               (Generated WAV files)

frontend/
└── src/
    └── sections/
        └── StudyPlanSection.jsx       (UI & orchestration)
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "TTS service failed" or CORS error
**Solution:**
- Ensure Python Flask service is running on port 5001
- Check firewall allows localhost:5001
- Verify CORS is enabled in app.py

### Issue 2: "Conversation not found"
**Solution:**
- Wait 5-10 seconds after "Generate Audio" click
- OpenRouter API needs time to generate conversation
- Check browser console for detailed error messages

### Issue 3: eSpeak NG not found
**Solution:**
```bash
# Verify installation
where espeak-ng
# Should output: C:\Program Files\eSpeak NG\espeak-ng.exe

# If not installed:
# Download from: https://github.com/espeak-ng/espeak-ng/releases
# Install to default location
```

### Issue 4: "Note not found" error
**Solution:**
- Ensure Firebase is properly configured
- Verify user is authenticated (currentUser exists)
- Check Firestore security rules allow read/write for authenticated users

---

## 🧪 Testing

### Manual Test Steps:
1. Open http://localhost:5173 in browser
2. Login with test account
3. Go to "Today's Plan" section
4. Enter test notes: "Explain photosynthesis to a 10-year-old"
5. Click "Generate Audio"
6. Wait 30-60 seconds for processing
7. Audio player should appear with playable audio
8. Click play button to listen

---

## 📊 Performance Notes

- **Conversation Generation:** 30-60 seconds (depends on OpenRouter)
- **Audio Generation:** 20-40 seconds (depends on text length)
- **Total Time:** 1-2 minutes for full process

Future optimization: Implement caching for common conversations

---

## 🔧 Environment Variables

Create `.env` in `backend/` folder:
```
OPENROUTER_API_KEY=your_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

---

## 📚 API Reference

### Conversation Generation
```http
POST /api/openrouter/conversation
Authorization: Bearer {token}
Content-Type: application/json

{
  "noteId": "doc-id-from-firestore",
  "noteText": "study notes here..."
}

Response:
{
  "success": true,
  "conversation": [
    { "role": "student", "text": "..." },
    { "role": "teacher", "text": "..." }
  ]
}
```

### TTS Generation
```http
POST /api/tts/conversation
Authorization: Bearer {token}
Content-Type: application/json

{
  "noteId": "same-doc-id"
}

Response:
{
  "success": true,
  "audioUrl": "http://127.0.0.1:5001/audio/uuid.wav",
  "filename": "uuid.wav"
}
```

---

## ✨ Features Implemented

✅ Conversation generation with OpenRouter
✅ Firestore integration for persistence
✅ TTS audio generation with VITS model
✅ Audio file serving and streaming
✅ Firebase authentication & authorization
✅ CORS handling for cross-origin requests
✅ Error handling & user feedback
✅ Progress logging in console

---

## 📝 Next Steps (Optional Enhancements)

- [ ] Add audio caching to avoid regenerating same conversations
- [ ] Implement voice selection (male/female/accents)
- [ ] Add background music/sound effects
- [ ] Create playlist of conversations
- [ ] Add speed control for playback
- [ ] Implement audio download functionality
- [ ] Add transcription of generated audio
- [ ] Support for multiple languages


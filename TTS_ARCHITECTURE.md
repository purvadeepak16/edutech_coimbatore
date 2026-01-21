# 🎤 TTS Feature - System Architecture

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
│                  http://localhost:5173                           │
├─────────────────────────────────────────────────────────────────┤
│  StudyPlanSection.jsx                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ User enters notes: "Explain photosynthesis"              │   │
│  │ Click: "Generate Audio" button                           │   │
│  │ handleGenerateAudio() triggers                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1. POST /api/openrouter/conversation
         │    { noteText: "...", noteId: "..." }
         │    Header: Authorization: Bearer {token}
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                             │
│                  http://localhost:5000                           │
├─────────────────────────────────────────────────────────────────┤
│  openrouter.routes.js → openrouter.controller.js                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Verify Firebase Token                                │   │
│  │ 2. Create Firestore document in "entries" collection    │   │
│  │ 3. Call OpenRouter API (gpt-4o-mini)                    │   │
│  │    Prompt: "Convert notes to student-teacher dialogue"  │   │
│  │ 4. Parse JSON response:                                 │   │
│  │    [{ role: "student", text: "..." },                   │   │
│  │     { role: "teacher", text: "..." }]                   │   │
│  │ 5. Save conversation to Firestore                       │   │
│  │    Path: notes/audioNotes/users/{userId}/entries/{id}   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Response: { conversation: [...] }
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                                │
│                  Receives conversation                           │
├─────────────────────────────────────────────────────────────────┤
│  2. POST /api/tts/conversation                                   │
│     { noteId: "..." }                                            │
│     Header: Authorization: Bearer {token}                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                             │
│                  http://localhost:5000                           │
├─────────────────────────────────────────────────────────────────┤
│  tts.routes.js → tts.controller.js                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Verify Firebase Token                                │   │
│  │ 2. Fetch Firestore document by noteId                   │   │
│  │ 3. Extract conversation.dialogue array                  │   │
│  │ 4. Format as text:                                      │   │
│  │    "Student: What is photosynthesis?                    │   │
│  │     Teacher: It's the process where..."                 │   │
│  │ 5. Call Python TTS Service                              │   │
│  │    POST http://127.0.0.1:5001/tts                       │   │
│  │    { text: "formatted dialogue" }                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ HTTP Call to Python Service
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PYTHON TTS SERVICE (Flask)                          │
│               http://127.0.0.1:5001                              │
├─────────────────────────────────────────────────────────────────┤
│  app.py                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /tts                                                │   │
│  │ 1. Receive text from Node backend                        │   │
│  │ 2. Initialize TTS model (VITS):                          │   │
│  │    - Uses eSpeak NG for phonemization                    │   │
│  │    - Loads neural vocoder weights                        │   │
│  │ 3. Generate audio waveform                               │   │
│  │ 4. Save as WAV file                                      │   │
│  │    Location: tts_service/generated_audio/{uuid}.wav      │   │
│  │ 5. Return JSON:                                          │   │
│  │    {                                                      │   │
│  │      "url": "http://127.0.0.1:5001/audio/{uuid}.wav",   │   │
│  │      "filename": "{uuid}.wav"                            │   │
│  │    }                                                      │   │
│  │                                                           │   │
│  │ GET /audio/{filename}                                    │   │
│  │ - Serve WAV file for playback                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Response: { url: "...", filename: "..." }
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                             │
│                  Receives TTS response                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Save audio.url to Firestore document                         │
│     Path: notes/audioNotes/users/{userId}/entries/{noteId}       │
│     Field: audio: { url: "...", filename: "..." }                │
│  2. Return response to Frontend                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Response: { audioUrl: "...", filename: "..." }
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                                │
│                  Receives audio URL                              │
├─────────────────────────────────────────────────────────────────┤
│  1. setAudioUrl(ttsData.audioUrl)                                │
│  2. Render <audio> element:                                      │
│     <audio controls src={audioUrl} />                            │
│  3. User clicks play button                                      │
│  4. Browser fetches from:                                        │
│     http://127.0.0.1:5001/audio/{filename}                       │
│  5. Audio plays in browser                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
User Login (Firebase)
    │
    ├─ Browser receives ID Token
    │
    ├─ Store in state: currentUser
    │
    ├─ On API request:
    │  ├─ Call: currentUser.getIdToken()
    │  └─ Add header: Authorization: Bearer {token}
    │
    ├─ Backend receives request
    │  ├─ Extract token from header
    │  ├─ Call: admin.auth().verifyIdToken(token)
    │  ├─ Extract: userId = decoded.uid
    │  └─ Use userId to access user's Firestore data
    │
    └─ Access granted only for authenticated users
```

---

## 📁 Database Structure (Firestore)

```
notes/
└── audioNotes/
    └── users/
        └── {userId}/
            └── entries/
                └── {noteId}/
                    ├── text: "study notes text here"
                    ├── type: "text-to-audio"
                    ├── status: "completed"
                    ├── createdAt: timestamp
                    ├── conversation: {
                    │   ├── model: "openrouter"
                    │   ├── createdAt: timestamp
                    │   └── dialogue: [
                    │       {
                    │           "role": "student",
                    │           "text": "What is photosynthesis?"
                    │       },
                    │       {
                    │           "role": "teacher",
                    │           "text": "Photosynthesis is the process..."
                    │       }
                    │   ]
                    │}
                    └── audio: {
                        ├── url: "http://127.0.0.1:5001/audio/uuid.wav"
                        ├── filename: "uuid.wav"
                        └── generatedAt: timestamp
                    }
```

---

## 🔗 API Endpoints

### 1. OpenRouter Conversation Generation
```
Method: POST
Endpoint: /api/openrouter/conversation
Host: http://localhost:5000
Auth: Bearer {token}

Request Body:
{
  "noteId": "firestore-doc-id",
  "noteText": "student's study notes"
}

Response:
{
  "success": true,
  "conversation": [
    { "role": "student", "text": "?" },
    { "role": "teacher", "text": "Answer" }
  ]
}
```

### 2. TTS from Conversation
```
Method: POST
Endpoint: /api/tts/conversation
Host: http://localhost:5000
Auth: Bearer {token}

Request Body:
{
  "noteId": "firestore-doc-id"
}

Response:
{
  "success": true,
  "audioUrl": "http://127.0.0.1:5001/audio/uuid.wav",
  "filename": "uuid.wav"
}
```

### 3. TTS from Plain Text
```
Method: POST
Endpoint: /api/tts/text
Host: http://localhost:5000

Request Body:
{
  "text": "Any text to convert to speech"
}

Response:
{
  "success": true,
  "audioUrl": "http://127.0.0.1:5001/audio/uuid.wav",
  "filename": "uuid.wav"
}
```

### 4. Serve Audio File
```
Method: GET
Endpoint: /audio/{filename}
Host: http://127.0.0.1:5001

Response: WAV audio file (binary)
MIME Type: audio/wav
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **HTTP Client**: Fetch API
- **State Management**: React Context
- **UI Components**: Custom CSS + Lucide Icons
- **Authentication**: Firebase Auth

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **HTTP Client**: node-fetch
- **Database**: Firebase Firestore
- **External API**: OpenRouter (gpt-4o-mini)
- **File System**: Local directory storage

### TTS Service
- **Language**: Python 3.10+
- **Framework**: Flask
- **TTS Engine**: TTS Library (Coqui)
- **Vocoder**: VITS (Variational Inference Text-to-Speech)
- **Phonemization**: eSpeak NG
- **Audio Format**: WAV (22050 Hz, 16-bit PCM)

---

## ⚙️ Configuration Files

### Python (tts_service/app.py)
```python
TTS Model: tts_models/en/ljspeech/vits
Sample Rate: 22050 Hz
eSpeak Path: C:\Program Files\eSpeak NG\espeak-ng.exe
Output Directory: tts_service/generated_audio
Port: 5001
```

### Node Backend (src/server.js)
```javascript
OpenRouter API Key: process.env.OPENROUTER_API_KEY
TTS Service URL: http://127.0.0.1:5001
Firestore Database: Default
Port: 5000
```

### React Frontend (src/sections/StudyPlanSection.jsx)
```javascript
Backend API: http://localhost:5000
Frontend Port: 5173
Firebase Config: src/config/firebase.js
```

---

## 📊 Performance Metrics

| Component | Duration | Notes |
|-----------|----------|-------|
| Note Submission | <1s | Local Firestore write |
| Conversation Gen | 30-60s | OpenRouter API call (gpt-4o-mini) |
| TTS Generation | 20-40s | Depends on text length |
| Audio Streaming | <5s | Network transfer |
| **Total** | **1-2 min** | Full end-to-end |

---

## 🔒 Security Measures

1. **Firebase Auth Token Verification**
   - Every API request validated
   - User ID extracted from token
   - Access limited to user's own data

2. **Firestore Security Rules**
   - Read/Write only for authenticated users
   - Collection-level access control
   - Document-level user validation

3. **API Validation**
   - Input sanitization
   - Required field validation
   - Error message filtering

4. **CORS Configuration**
   - Whitelisted origins
   - Allowed methods: GET, POST, OPTIONS
   - Secure headers configured

---

## 🚨 Error Handling

All endpoints include comprehensive error handling:

```
400: Bad Request
├─ Missing required fields
├─ Invalid request format
└─ Failed validation

401: Unauthorized
├─ Missing auth token
├─ Invalid token
└─ Token verification failed

404: Not Found
├─ Firestore document not found
└─ Audio file not found

500: Internal Server Error
├─ API service failure
├─ Firestore operation failure
├─ File system error
└─ Unexpected exceptions
```

---

## 🔄 State Transitions

```
Note States:
├── "generating-conversation" - Waiting for OpenRouter
├── "conversation-ready" - Ready for TTS
├── "generating-audio" - Waiting for TTS service
└── "completed" - Audio ready for playback

Audio File Lifecycle:
├── Generated by Flask service
├── Stored on disk: generated_audio/
├── Served via HTTP: /audio/{filename}
├── Referenced in Firestore: audio.url field
└── Cached in browser: <audio> element
```


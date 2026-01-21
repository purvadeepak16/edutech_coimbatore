# ✅ Quick Start Checklist - TTS Feature

## 🔧 Before Running

### 1. Install Flask-CORS in Python Virtual Environment
```powershell
cd backend\tts_service
tts-env\Scripts\activate
pip install flask-cors
```

### 2. Restart All Services (in this order)

#### Terminal 1: Python TTS Service
```powershell
cd backend\tts_service
tts-env\Scripts\activate
python app.py
```
✅ Should see:
```
✅ TTS model loaded successfully
🚀 Starting TTS Service on http://127.0.0.1:5001
```

#### Terminal 2: Node Backend
```powershell
cd backend
npm run dev
```
✅ Should see:
```
✓ Firebase Admin initialized 
✓ Backend server running on http://localhost:5000
✓ Health check available at http://localhost:5000/api/health
```

#### Terminal 3: React Frontend
```powershell
cd frontend
npm run dev
```
✅ Should see:
```
VITE v7.3.1  ready in 802 ms
➜  Local:   http://localhost:5173/
```

---

## 🧪 Testing the Feature

1. **Open** http://localhost:5173/
2. **Login** with your test account
3. **Navigate** to "Today's Plan" section (StudyPlanSection)
4. **Find** the "🎧 Text to Audio Learning" card
5. **Enter** sample text:
   ```
   Photosynthesis is the process by which plants convert sunlight into chemical energy.
   It involves water, carbon dioxide, and light energy to produce glucose and oxygen.
   ```
6. **Click** "Generate Audio" button
7. **Wait** 1-2 minutes:
   - 30-60s: Conversation generation with OpenRouter
   - 20-40s: Audio generation from conversation
8. **Listen** to the generated audio

---

## 📊 Expected Console Logs

### Backend Console:
```
📝 Generating conversation...
Conversation generation request received for userId: ...
✅ Conversation generated: [conversation array]
🎤 Generating audio from conversation...
Audio TTS generation request received for noteId: ...
TTS service response: { success: true, ... }
✅ Audio generated: { audioUrl: "...", filename: "..." }
```

### Frontend Console:
```
📝 Generating conversation...
✅ Conversation generated: {...}
🎤 Generating audio from conversation...
✅ Audio generated: {...}
```

### Python TTS Service Console:
```
🎤 Generating audio for text: Student: ...
[TTS Processing...]
✅ Audio generated: uuid.wav
```

---

## ❌ Troubleshooting

### Python Service Won't Start
```powershell
# Check if port 5001 is in use
netstat -ano | findstr :5001

# If port is in use, kill the process
taskkill /PID {process_id} /F

# Then try again
python app.py
```

### "TTS model not loaded" Error
```powershell
# Reinstall dependencies
pip install --upgrade TTS torch torchaudio
pip install flask flask-cors

# Try again
python app.py
```

### "Conversation not found" Error
- Wait longer (OpenRouter API might be slow)
- Check that noteId matches exactly
- Verify Firestore has the conversation saved:
  - Go to Firebase Console
  - Check: notes → audioNotes → users → {userId} → entries → {noteId}
  - Should have "conversation" field with "dialogue" array

### Audio File Not Playing
- Check browser console for CORS errors
- Verify Python service is running on port 5001
- Check if /audio/{filename} endpoint works directly:
  - Open in browser: http://127.0.0.1:5001/audio/{filename}
  - Should download or play WAV file

---

## 🎯 Success Indicators

✅ All three services running without errors
✅ No CORS warnings in browser console
✅ "Generate Audio" button works without throwing errors
✅ Audio player appears in UI
✅ Audio plays when clicked
✅ Firestore document updates with conversation and audio fields

---

## 📝 Files Changed

1. ✅ `backend/src/controllers/tts.controller.js` - NEW FILE
2. ✅ `backend/src/routes/tts.routes.js` - UPDATED
3. ✅ `backend/tts_service/app.py` - UPDATED (added CORS)
4. ✅ `backend/tts_service/requirements.txt` - UPDATED (added flask-cors)
5. ✅ `frontend/src/sections/StudyPlanSection.jsx` - UPDATED (fixed flow)

---

## 🚀 Commands Summary

```bash
# Terminal 1: Python Service
cd backend\tts_service
tts-env\Scripts\activate
pip install flask-cors  # Only first time
python app.py

# Terminal 2: Node Backend  
cd backend
npm run dev

# Terminal 3: React Frontend
cd frontend
npm run dev
```

---

## 💡 Key Changes Made

### 1. **New Backend Endpoint Flow**
- Frontend now calls: POST `/api/tts/conversation` (through Node backend)
- Instead of: Direct calls to Python service
- Benefit: Authentication, Firestore access, error handling

### 2. **Proper Sequencing**
- Wait for conversation generation to complete
- THEN call TTS generation
- Previous: Called both in parallel (race condition)

### 3. **CORS Support**
- Flask app now has CORS enabled
- Handles OPTIONS preflight requests
- Supports multiple origins (localhost, 127.0.0.1, both ports)

### 4. **Better Error Messages**
- User gets specific error reasons
- Console logs show progress
- Easier debugging

---

## 📞 Support

If issues persist:
1. Check all three services are running
2. Open browser developer tools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests
5. Share the exact error message for debugging


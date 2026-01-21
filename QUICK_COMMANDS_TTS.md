# 🚀 Quick Command Reference - TTS Feature

## One-Time Setup

### 1. Install Flask-CORS
```powershell
cd backend\tts_service
tts-env\Scripts\activate
pip install flask-cors
```

---

## Starting Services (3 Terminals)

### Terminal 1: Python TTS Service
```powershell
cd backend\tts_service
tts-env\Scripts\activate
python app.py
```
**Expected output:**
```
✅ TTS model loaded successfully
🚀 Starting TTS Service on http://127.0.0.1:5001
```

### Terminal 2: Node Backend
```powershell
cd backend
npm run dev
```
**Expected output:**
```
✓ Firebase Admin initialized 
✓ Backend server running on http://localhost:5000
✓ Health check available at http://localhost:5000/api/health
```

### Terminal 3: React Frontend
```powershell
cd frontend
npm run dev
```
**Expected output:**
```
VITE v7.3.1  ready in 802 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## Testing Commands

### Test Python TTS Service Health
```powershell
curl -X GET http://127.0.0.1:5001/health
```

### Test Node Backend Health
```powershell
curl -X GET http://localhost:5000/api/health
```

### Test Conversation Generation (with token)
```powershell
# Replace {TOKEN} with actual Firebase token
curl -X POST http://localhost:5000/api/openrouter/conversation `
  -H "Authorization: Bearer {TOKEN}" `
  -H "Content-Type: application/json" `
  -d '{"noteId":"test-123","noteText":"explain gravity"}'
```

### Test TTS Generation (with token)
```powershell
# Replace {TOKEN} with actual Firebase token
curl -X POST http://localhost:5000/api/tts/conversation `
  -H "Authorization: Bearer {TOKEN}" `
  -H "Content-Type: application/json" `
  -d '{"noteId":"test-123"}'
```

### Test Direct TTS (no auth)
```powershell
curl -X POST http://127.0.0.1:5001/tts `
  -H "Content-Type: application/json" `
  -d '{"text":"Hello, this is a test"}'
```

### Test Audio Serving
```powershell
# Replace {filename} with actual filename
curl -X GET http://127.0.0.1:5001/audio/{filename}.wav -o test_audio.wav
```

---

## Debugging Commands

### Check Python Virtual Environment
```powershell
cd backend\tts_service
tts-env\Scripts\activate
pip list  # See all installed packages
python --version  # Check Python version
```

### Check Node Installation
```powershell
node --version
npm --version
```

### Check Installed npm Packages
```powershell
cd backend
npm list
```

### Check Python Package Versions
```powershell
pip show TTS
pip show torch
pip show flask
pip show flask-cors
```

### Verify eSpeak NG Installation
```powershell
where espeak-ng
# Should output: C:\Program Files\eSpeak NG\espeak-ng.exe
```

### Kill Process on Port 5001 (if stuck)
```powershell
netstat -ano | findstr :5001
# Get PID, then:
taskkill /PID {PID} /F
```

### Kill Process on Port 5000 (if stuck)
```powershell
netstat -ano | findstr :5000
taskkill /PID {PID} /F
```

### Kill Process on Port 5173 (if stuck)
```powershell
netstat -ano | findstr :5173
taskkill /PID {PID} /F
```

---

## Viewing Logs

### Python TTS Logs
```
[In Python terminal]
- Shows TTS model loading
- Shows audio generation progress
- Shows request/response details
```

### Node Backend Logs
```
[In Node terminal]
- Shows Firebase initialization
- Shows server startup
- Shows API requests
- Shows Firestore operations
```

### Frontend Console Logs (Browser)
```
Press F12 in browser
Click "Console" tab
Look for:
- 📝 Generating conversation...
- ✅ Conversation generated
- 🎤 Generating audio
- ✅ Audio generated
```

---

## File Locations

### Python TTS Service
```powershell
# Main app
backend\tts_service\app.py

# Generated audio files
backend\tts_service\generated_audio\

# Virtual environment
backend\tts_service\tts-env\

# Dependencies
backend\tts_service\requirements.txt
```

### Node Backend
```powershell
# Server
backend\src\server.js

# Controllers
backend\src\controllers\tts.controller.js
backend\src\controllers\openrouter.controller.js

# Routes
backend\src\routes\tts.routes.js
backend\src\routes\openrouter.routes.js

# Dependencies
backend\package.json
backend\node_modules\
```

### React Frontend
```powershell
# Main component using TTS
frontend\src\sections\StudyPlanSection.jsx

# Firebase config
frontend\src\config\firebase.js

# Dependencies
frontend\package.json
frontend\node_modules\
```

---

## Common Commands

### Reinstall All Dependencies
```powershell
# Backend
cd backend
rm -r node_modules package-lock.json
npm install

# Python
cd tts_service
tts-env\Scripts\activate
pip install --upgrade -r requirements.txt
```

### Clear Python Cache
```powershell
cd backend\tts_service
tts-env\Scripts\activate
python -c "from TTS.api import TTS; TTS.list_models()"
```

### Clear Generated Audio Files
```powershell
cd backend\tts_service
rm -r generated_audio\*
mkdir generated_audio
```

### View Firestore Data (via CLI)
```powershell
# Install Firebase CLI first
firebase login
firebase firestore:inspect --project {project-id}
```

---

## Environment Variables

### Create .env file in backend/
```
OPENROUTER_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### Load env variables (Node detects automatically)
```powershell
# .env file is auto-loaded by Express
```

---

## Port Reference

| Service | Port | URL | Check Command |
|---------|------|-----|---------------|
| Python TTS | 5001 | http://127.0.0.1:5001 | `curl http://127.0.0.1:5001/health` |
| Node Backend | 5000 | http://localhost:5000 | `curl http://localhost:5000/api/health` |
| React Frontend | 5173 | http://localhost:5173 | Open in browser |

---

## Keyboard Shortcuts

### Browser Console (F12)
- **Ctrl+Shift+J** - Open Console
- **Ctrl+Shift+K** - Open Network tab
- **Ctrl+Shift+I** - Open DevTools

### PowerShell
- **Ctrl+C** - Stop current service
- **Clear** - Clear screen
- **Ctrl+L** - Clear screen
- **↑** - Previous command
- **↓** - Next command

### VS Code
- **Ctrl+\`** - Open terminal
- **Ctrl+J** - Toggle panel
- **F5** - Start debugging
- **Ctrl+Shift+D** - Debug view

---

## Troubleshooting Quick Commands

### Restart All Services
```powershell
# Terminal 1: Kill old processes
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Then start fresh in new terminals

# Terminal 1
cd backend\tts_service
tts-env\Scripts\activate
python app.py

# Terminal 2
cd backend
npm run dev

# Terminal 3
cd frontend
npm run dev
```

### Check All Ports
```powershell
netstat -ano | findstr :5001
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

### Verify All Services Running
```powershell
# Python
curl -s http://127.0.0.1:5001/health | python -m json.tool

# Backend
curl -s http://localhost:5000/api/health | python -m json.tool

# Frontend (just open in browser)
start http://localhost:5173/
```

### Full System Diagnostic
```powershell
echo "=== Python Check ==="
python --version
pip list | findstr "TTS torch flask"

echo "=== Node Check ==="
node --version
npm --version

echo "=== eSpeak Check ==="
where espeak-ng

echo "=== Ports Check ==="
netstat -ano | findstr ":5001 :5000 :5173"

echo "=== Firestore Check ==="
firebase status --project {project-id}
```

---

## Documentation Reference

All documentation is in the root folder:

```
c:\Users\sailee\OneDrive\Pictures\Documents\edutech_coimbatore\
├── README_TTS_COMPLETE.md
├── TTS_IMPLEMENTATION_SUMMARY.md
├── TTS_FEATURE_IMPLEMENTATION.md
├── TTS_ARCHITECTURE.md
├── TTS_SYSTEM_DIAGRAMS.md
├── QUICK_START_TTS.md
├── TTS_TESTING_CHECKLIST.md
└── This file
```

---

## Quick Reference by Task

### "I want to start everything fresh"
```powershell
# Terminal 1
cd backend\tts_service && tts-env\Scripts\activate && python app.py

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```

### "I want to test if something is working"
```powershell
curl http://127.0.0.1:5001/health
curl http://localhost:5000/api/health
# or just open http://localhost:5173/ in browser
```

### "I want to see what's in Firestore"
```
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click: notes → audioNotes → users → {your-id} → entries
4. Click on any document to see its contents
```

### "I want to clear generated audio files"
```powershell
cd backend\tts_service
Remove-Item generated_audio\* -Force
mkdir generated_audio
```

### "I want to see console logs"
```
Frontend: Press F12 → Console tab
Backend: Check terminal output
Python: Check terminal output
```

### "Something broke, I want to start over"
```powershell
# Kill all services
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Clear caches
cd backend\tts_service && rm -r generated_audio\* 
cd backend && rm -r node_modules && npm install
cd frontend && rm -r node_modules && npm install

# Start fresh
# Then run the start commands above
```

---

## Quick Checklist

- [ ] Python running? `curl http://127.0.0.1:5001/health`
- [ ] Backend running? `curl http://localhost:5000/api/health`
- [ ] Frontend running? Open http://localhost:5173/ in browser
- [ ] Logged in? Check if user profile shows in UI
- [ ] Can navigate to Study Plan? Check if "Today's Plan" visible
- [ ] Can enter notes? Check if textarea accepts input
- [ ] Can click Generate Audio? Check if click works
- [ ] Audio generated? Check console for logs
- [ ] Audio player appears? Check if <audio> element shows
- [ ] Audio plays? Click play and listen

---

## Emergency Commands

### Nuclear Option (Kill Everything)
```powershell
Get-Process | Where-Object { $_.Name -like "*python*" -or $_.Name -like "*node*" } | Stop-Process -Force
```

### Force Kill Specific Port
```powershell
Get-NetTCPConnection -LocalPort 5001 | Stop-Process -Force
Get-NetTCPConnection -LocalPort 5000 | Stop-Process -Force
Get-NetTCPConnection -LocalPort 5173 | Stop-Process -Force
```

### Clear Everything and Start Fresh
```powershell
# Kill processes
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Delete caches
cd backend\tts_service && rm -r generated_audio\* && rm -r __pycache__
cd backend && rm -r node_modules && rm package-lock.json
cd frontend && rm -r node_modules && rm package-lock.json

# Reinstall
cd backend && npm install
cd frontend && npm install
cd backend\tts_service && tts-env\Scripts\activate && pip install -r requirements.txt

# Start fresh (use 3 new terminals)
```

---

## Contact & Support

If issues persist:
1. Check all console logs (F12 → Console)
2. Check all terminal outputs
3. Run diagnostic: See "Full System Diagnostic" section above
4. Check Firestore to see if data is saving
5. Read the documentation files listed above

Everything should work smoothly now! 🚀


# ✅ TTS Feature - Complete Implementation Checklist

## 🔧 Installation & Setup

- [ ] **Install Flask-CORS**
  ```powershell
  cd backend\tts_service
  tts-env\Scripts\activate
  pip install flask-cors
  ```

- [ ] **Verify eSpeak NG Installation**
  ```powershell
  where espeak-ng
  # Should output: C:\Program Files\eSpeak NG\espeak-ng.exe
  ```
  If not installed, download from: https://github.com/espeak-ng/espeak-ng/releases

- [ ] **Verify Node Dependencies**
  ```powershell
  cd backend
  npm list  # Check all packages installed
  ```

- [ ] **Verify Python Dependencies**
  ```powershell
  cd backend\tts_service
  tts-env\Scripts\activate
  pip list  # Check TTS, torch, soundfile installed
  ```

---

## 🚀 Services Startup

- [ ] **Terminal 1: Python TTS Service**
  ```powershell
  cd backend\tts_service
  tts-env\Scripts\activate
  python app.py
  ```
  Wait for: ✅ TTS model loaded successfully
  Wait for: Running on http://127.0.0.1:5001

- [ ] **Terminal 2: Node Backend**
  ```powershell
  cd backend
  npm run dev
  ```
  Wait for: ✓ Firebase Admin initialized
  Wait for: ✓ Backend server running on http://localhost:5000

- [ ] **Terminal 3: React Frontend**
  ```powershell
  cd frontend
  npm run dev
  ```
  Wait for: ➜ Local: http://localhost:5173/

---

## 🌐 Browser Verification

- [ ] **Access Frontend**
  - Open: http://localhost:5173/
  - Check: Page loads without errors
  - Check: No 404 errors in console

- [ ] **Login**
  - Enter credentials
  - Verify: Authentication successful
  - Check: User displayed in app

- [ ] **Navigate to Study Plan**
  - Find: "Today's Plan" section
  - Find: "🎧 Text to Audio Learning" card
  - Check: Textarea visible
  - Check: "Generate Audio" button visible

---

## 📝 Feature Testing

### Test 1: Basic Audio Generation
- [ ] **Enter Text**
  ```
  Photosynthesis is the process by which plants convert 
  sunlight into chemical energy using water and carbon dioxide.
  ```

- [ ] **Click "Generate Audio"**
  - Check: No immediate errors
  - Check: Button stays clickable
  - Check: Console shows no JS errors

- [ ] **Wait for Processing**
  - Watch console for logs
  - Wait 30-60s for conversation generation
  - Then 20-40s for audio generation
  - Total: ~1-2 minutes

- [ ] **Check Results**
  - Check: Audio player appears
  - Check: Player has play/pause controls
  - Check: Filename shown in player
  - Check: URL starts with http://127.0.0.1:5001/audio/

- [ ] **Play Audio**
  - Click: Play button
  - Listen: Audio plays
  - Check: Sound quality acceptable
  - Check: Both student and teacher voices present

### Test 2: Console Verification
- [ ] **Open Developer Tools** (F12)
  - Check: Network tab shows successful requests
  - Check: POST /api/openrouter/conversation → 200
  - Check: POST /api/tts/conversation → 200
  - Check: GET /audio/{filename} → 200
  - Check: No CORS errors
  - Check: Console logs show progress

### Test 3: Firestore Verification
- [ ] **Go to Firebase Console**
  - Navigate to: Firestore Database
  - Find: notes → audioNotes → users → {your-user-id} → entries
  - Verify: Document created
  - Check: Fields present:
    - [ ] text: "study notes..."
    - [ ] conversation: { dialogue: [...] }
    - [ ] audio: { url: "...", filename: "..." }

---

## 🔒 Security Verification

- [ ] **Authentication Required**
  - Logout first
  - Try to access API endpoint
  - Should get: 401 Unauthorized
  - Login again
  - Should work: Audio generation works

- [ ] **User Data Isolation**
  - Login with User A
  - Generate audio and note Firestore path
  - Logout and login with User B
  - Generate audio
  - Verify: User B has separate documents
  - Verify: User B cannot access User A's data

---

## 🐛 Error Handling Tests

### Test 1: Empty Text
- [ ] **Try to generate audio with no text**
  - Enter: Nothing (empty textarea)
  - Click: "Generate Audio"
  - Expect: No request sent
  - Verify: Alert shown or nothing happens

### Test 2: Service Unavailable
- [ ] **Stop Python TTS Service**
  - Ctrl+C in Python terminal
  - Try: Generate audio with text
  - Expect: Error message within 10 seconds
  - Verify: User gets meaningful error
  - Restart: Python service
  - Verify: Works again

### Test 3: Network Error
- [ ] **Disable internet**
  - Try: Generate audio
  - Expect: Error message
  - Verify: Handled gracefully
  - Enable: Internet
  - Verify: Works again

### Test 4: Long Text Processing
- [ ] **Enter very long notes**
  ```
  [Paste 2-3 paragraphs of text]
  ```
  - Click: "Generate Audio"
  - Verify: Takes longer but completes
  - Verify: Audio generated successfully
  - Note: Larger files will take longer to generate

---

## 📊 Performance Verification

- [ ] **Measure Conversation Generation Time**
  - Start: Click "Generate Audio"
  - Watch: Console logs
  - Note time: "✅ Conversation generated" appears
  - Expected: 30-60 seconds
  - Record: Actual time: _____ seconds

- [ ] **Measure Audio Generation Time**
  - Note time: Conversation generation completes
  - Note time: "✅ Audio generated" appears
  - Expected: 20-40 seconds
  - Record: Actual time: _____ seconds

- [ ] **Measure Total Time**
  - From: Click "Generate Audio"
  - To: Audio player appears
  - Expected: 1-2 minutes
  - Record: Actual time: _____ minutes

---

## 🔍 Logging Verification

### Frontend Console Should Show:
- [ ] `📝 Generating conversation...`
- [ ] `✅ Conversation generated: {...}`
- [ ] `🎤 Generating audio from conversation...`
- [ ] `✅ Audio generated: {...}`

### Python Service Console Should Show:
- [ ] `✅ TTS model loaded successfully`
- [ ] `🎤 Generating audio for text: Student: ...`
- [ ] `✅ Audio generated: {filename}.wav`

### Node Backend Console Should Show:
- [ ] `✓ Firebase Admin initialized`
- [ ] `✓ Backend server running on http://localhost:5000`

---

## 🔗 API Endpoint Verification

- [ ] **Test Conversation Endpoint**
  ```
  curl -X POST http://localhost:5000/api/openrouter/conversation \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer {your-firebase-token}" \
    -d '{"noteId":"test-123","noteText":"explain water cycle"}'
  ```
  Expect: JSON response with conversation array

- [ ] **Test TTS Endpoint**
  ```
  curl -X POST http://localhost:5000/api/tts/conversation \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer {your-firebase-token}" \
    -d '{"noteId":"test-123"}'
  ```
  Expect: JSON response with audioUrl

- [ ] **Test Audio Serving**
  ```
  Open in browser: http://127.0.0.1:5001/audio/{filename}.wav
  ```
  Expect: WAV file downloads or plays

---

## 📱 Cross-Browser Testing

- [ ] **Chrome**
  - [ ] Feature works
  - [ ] Audio plays
  - [ ] No console errors

- [ ] **Firefox**
  - [ ] Feature works
  - [ ] Audio plays
  - [ ] No console errors

- [ ] **Edge**
  - [ ] Feature works
  - [ ] Audio plays
  - [ ] No console errors

---

## 🎯 Final Verification

- [ ] All three services running without errors
- [ ] Frontend loads at http://localhost:5173/
- [ ] User can login
- [ ] User can navigate to Study Plan section
- [ ] User can enter notes
- [ ] "Generate Audio" button works
- [ ] Conversation generates (30-60s)
- [ ] Audio generates (20-40s)
- [ ] Audio player appears
- [ ] Audio plays successfully
- [ ] Firestore saves all data
- [ ] No CORS errors in console
- [ ] No authentication errors
- [ ] Error handling works for edge cases

---

## ✅ Sign Off

- [ ] **Developer Name**: _________________
- [ ] **Date Tested**: _________________
- [ ] **All Tests Passed**: Yes / No
- [ ] **Notes/Issues**: 
  ```
  
  
  ```

---

## 📞 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| "Port 5001 in use" | Kill process: `taskkill /PID {pid} /F` |
| "TTS model not loaded" | Reinstall: `pip install --upgrade TTS torch` |
| CORS error | Ensure Python service running, install flask-cors |
| "Conversation not found" | Wait longer, check Firestore has conversation |
| No audio player | Check console errors, wait for TTS to complete |
| Audio won't play | Check http://127.0.0.1:5001/audio/{filename} |
| Firebase auth fails | Logout/login, check token expiry |

---

## 🎉 Success!

If all checks pass, your TTS feature is fully functional and ready for production use!


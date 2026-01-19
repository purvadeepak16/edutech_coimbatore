# 🔧 Troubleshooting Guide - Mind Map & Learning Path Features

## Quick Diagnosis Steps

### Step 1: Verify Backend is Running
```powershell
# In backend folder
npm run dev
# OR
npm start
```

**Expected Output:**
```
✓ Backend server running on http://localhost:5000
✓ Firebase Admin initialized (or ✗ if credentials missing)
```

---

### Step 2: Test the API Endpoint Directly
```powershell
# Test the mindmap endpoint
$body = @{ topic = "machine learning" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/mindmap/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "learningMap": {
    "subject": "machine learning",
    "units": [
      {
        "title": "Supervised Learning",
        "status": "mastered",
        "progress": "90%",
        "topics": [...]
      }
    ]
  },
  "mindMap": {
    "center": "machine learning",
    "branches": [...]
  }
}
```

---

### Step 3: Check Frontend Console
1. Open DevTools: **F12** or **Right-click → Inspect**
2. Go to **Console** tab
3. Try generating a mind map for a topic
4. Look for:
   - ✅ `✅ AI DATA: {...}` - Success
   - ❌ `❌ Error: ...` - Failure with error details
   - 🗺️ `🗺️ Loading mind map with data: {...}` - MindMap loading
   - 📍 `📍 Generated nodes: [...]` - Nodes created

---

### Step 4: Check Network Requests
1. In DevTools, go to **Network** tab
2. Generate a mind map
3. Look for request to `http://localhost:5000/api/mindmap/generate`
4. Check:
   - **Status**: Should be `200 OK`
   - **Preview**: Should show JSON response
   - **Response**: Should have `learningMap` and `mindMap`

---

## Common Issues & Solutions

### ❌ Issue: "Failed to fetch" or connection refused

**Cause:** Backend not running or wrong port

**Solution:**
```powershell
# Terminal 1: Start backend
cd backend
npm install
npm run dev

# Terminal 2: Start frontend (in separate terminal)
cd frontend
npm run dev
```

**Verify:** 
- Backend should show: `Backend server running on http://localhost:5000`
- Frontend should show: `Local: http://localhost:5173/`

---

### ❌ Issue: "API error: 500" or "Invalid JSON"

**Cause:** Backend error or malformed request

**Check:**
1. Open backend console for error messages
2. Check that `topic` is being sent properly
3. Verify `OPENROUTER_API_KEY` is set in backend `.env`

**Debug:**
```powershell
# Check if backend receives the request
# Look for logs in backend terminal

# Test with curl
curl -X POST http://localhost:5000/api/mindmap/generate `
  -H "Content-Type: application/json" `
  -d "{\"topic\": \"algebra\"}"
```

---

### ❌ Issue: Mind map renders but nodes not visible

**Cause:** Canvas/positioning issues

**Check:**
1. Open DevTools → **Elements** tab
2. Look for `<div class="mind-node">` elements
3. Check if they have proper `style` attributes
4. Verify canvas is rendering (should see gray lines)

**Debug:**
```javascript
// Open console and run:
document.querySelectorAll('.mind-node').forEach(n => {
  console.log(n.textContent, n.style.left, n.style.top);
});
```

**Expected Output:**
```
machine learning 1000px 600px
Supervised Learning 1350px 200px
...
```

---

### ❌ Issue: Learning Map shows but Mind Map doesn't

**Cause:** `mindMapData` is not being set in context

**Check:**
```javascript
// In console:
// 1. Check if mindMapData is in context
localStorage.getItem('mindMapData')

// 2. Manually check what was returned
console.log("Last API response stored in memory")
```

**Solution:**
1. Verify API is returning `mindMap` object
2. Check that `setMindMapData(data.mindMap)` is being called
3. Look for errors in console

---

### ❌ Issue: "Generate AI" button shows "Generating..." forever

**Cause:** Request hung or API timeout

**Solution:**
1. Check backend logs - is it receiving the request?
2. Check Network tab - is request still pending?
3. Kill and restart backend:
   ```powershell
   Get-Process node | Stop-Process
   # Then restart with npm run dev
   ```

---

## Advanced Debugging

### Enable Detailed Logging

**In KnowledgeGraphSection.jsx:**
```javascript
const generateMindMapFromAI = async () => {
  console.log("📤 Sending request with topic:", topic);
  const res = await fetch("http://localhost:5000/api/mindmap/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  
  console.log("📥 Response status:", res.status);
  const data = await res.json();
  console.log("📦 Response data:", data);
  // ... rest of code
};
```

### Monitor Network Activity
```powershell
# In backend server.js, add:
app.post("/api/mindmap/generate", async (req, res) => {
  console.log("🔔 Received request:", {
    topic: req.body.topic,
    timestamp: new Date().toISOString()
  });
  // ... rest of handler
});
```

---

## Performance Checklist

- [ ] Backend responding in < 2 seconds
- [ ] Canvas renders < 1 second after modal opens
- [ ] No memory leaks when opening/closing modal multiple times
- [ ] Nodes are properly positioned (not overlapping)
- [ ] No console errors or warnings

---

## Verification Checklist

- [ ] Backend `.env` has `OPENROUTER_API_KEY`
- [ ] Backend is running on port 5000
- [ ] Frontend can reach `http://localhost:5000/api/mindmap/generate`
- [ ] API response has both `learningMap` and `mindMap`
- [ ] Context stores data correctly
- [ ] MindMap component receives data
- [ ] Canvas draws connection lines
- [ ] Nodes are visible and interactive
- [ ] Browser DevTools shows no errors

---

## If Still Not Working

1. **Clear Cache & Restart:**
   ```powershell
   # Kill all Node processes
   Get-Process node | Stop-Process -Force
   
   # Clear browser cache: Ctrl+Shift+Delete
   
   # Restart backend and frontend
   ```

2. **Check File Integrity:**
   - Verify `.env` files exist and have correct keys
   - Check `serviceAccount.json` exists in backend/

3. **Review Recent Changes:**
   - Look at git history to see what changed
   - Revert recent modifications if needed

4. **Check Package Versions:**
   ```powershell
   cd backend && npm list express axios
   cd ../frontend && npm list react react-dom
   ```

5. **Nuclear Option:**
   ```powershell
   # Reinstall dependencies
   cd backend
   rm -r node_modules package-lock.json
   npm install
   
   cd ../frontend
   rm -r node_modules package-lock.json
   npm install
   ```


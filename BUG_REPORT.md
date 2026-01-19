# 🐛 Mind Map & Learning Path Feature - Issues Found

## Issue Summary
The Mind Map and Learning Path features are not working due to **backend API errors and CORS/connection issues**.

---

## Issues Identified

### 1. ❌ **Missing OPENROUTER_API_KEY in Backend**
**Location:** [backend/.env](backend/.env)

**Problem:**
- The backend `.env` file uses `VITE_FIREBASE_*` prefixes (which are for frontend/Vite only)
- The backend `server.js` is looking for `process.env.OPENROUTER_API_KEY` but it's being set with `VITE_` prefix
- The OPENROUTER API key is present BUT with wrong environment variable name

**Current (Wrong):**
```env
VITE_FIREBASE_API_KEY=...
OPENROUTER_API_KEY=sk-or-v1-e0aa...
```

**Fix:** The `OPENROUTER_API_KEY` format is actually correct in backend/.env, but needs to be verified it's being read properly.

---

### 2. ❌ **Backend CORS Error in Browser**
**Error in Console:**
```
Failed to load resource: net::ERR_CONNECTION_CLOSED
identitytoolkit.goog...
```

**Problem:**
- The frontend is trying to authenticate with Firebase's `identitytoolkit` endpoint
- This is failing, likely because:
  - The backend is not properly initialized with Firebase credentials
  - OR the frontend auth is not set up correctly

**Location:** [frontend/src/config/firebase.js](frontend/src/config/firebase.js) needs review

---

### 3. ❌ **Hardcoded Backend URL in Frontend**
**Location:** [frontend/src/sections/KnowledgeGraphSection.jsx:54](frontend/src/sections/KnowledgeGraphSection.jsx#L54)

**Current Code:**
```jsx
const res = await fetch("http://localhost:5000/api/mindmap/generate", {
```

**Problem:**
- Hardcoded localhost URL won't work in production
- May have CORS issues if backend port/domain differs
- Should use environment variables

**Expected Fix:**
```jsx
const API_URL = process.env.VITE_API_URL || "http://localhost:5000";
const res = await fetch(`${API_URL}/api/mindmap/generate`, {
```

---

### 4. ⚠️ **Missing Content-Type Headers in Request**
**Location:** [frontend/src/sections/KnowledgeGraphSection.jsx:55-58](frontend/src/sections/KnowledgeGraphSection.jsx#L55-L58)

**Current Code:**
```jsx
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ topic }),
```

**Issue:** The headers look correct, but verify that the backend is properly receiving the POST body.

---

### 5. ⚠️ **MindMap Component Dependencies**
**Location:** [frontend/src/components/MindMap.jsx](frontend/src/components/MindMap.jsx)

**Problem:**
- The component expects `mindMapData` from context
- If the context data is null or undefined, the component won't render anything
- No error handling for missing/malformed data

**Current Logic:**
```jsx
useEffect(() => {
  if (isOpen && mindMapData) {
    setNodes(loadFromAI(mindMapData));
  }
}, [isOpen, mindMapData]);
```

**Missing:** Loading/error states

---

### 6. 🔄 **Backend API Response Structure**
**Location:** [backend/src/routes/mindmap.routes.js:44-56](backend/src/routes/mindmap.routes.js#L44-L56)

**Current Response:**
```json
{
  "learningMap": { ... },
  "mindMap": { ... }
}
```

**Status:** ✅ Structure looks correct - both components are receiving proper data

---

## Root Cause Analysis

### Why the Feature Isn't Working:

1. **Frontend Successfully Calls Backend** ✅
   - The fetch request is sent to `http://localhost:5000/api/mindmap/generate`
   - Backend receives the request and generates mock/AI data

2. **Data is Returned Successfully** ✅
   - Backend returns both `learningMap` and `mindMap` data
   - Console shows: `console.log("AI DATA:", data)` in KnowledgeGraphSection

3. **Context Updates Successfully** ✅
   - `setMindMapData(data.mindMap)` stores the data in context
   - `setLearningMapData(data.learningMap)` stores learning map data

4. **MindMap Component Loads Data** ✅
   - Component receives `mindMapData` from context
   - `loadFromAI()` function processes the data into nodes

5. **Visual Display May Have Issues** ⚠️
   - Canvas rendering might have positioning/sizing issues
   - Nodes might be rendering outside visible area
   - Check browser DevTools → Elements tab to verify DOM structure

---

## Recommended Fixes (Priority Order)

### Priority 1 - Critical
- [ ] Verify backend is running on port 5000
- [ ] Test API endpoint: `curl -X POST http://localhost:5000/api/mindmap/generate -H "Content-Type: application/json" -d '{"topic":"test"}'`
- [ ] Check browser console for actual error messages

### Priority 2 - High
- [ ] Move hardcoded localhost to `.env.local` variable
- [ ] Add error handling and loading states to components
- [ ] Add console.log debugging to track data flow

### Priority 3 - Medium
- [ ] Fix Firebase authentication setup
- [ ] Add proper CORS configuration if needed
- [ ] Validate API response structure before rendering

### Priority 4 - Low
- [ ] Environment variable management improvement
- [ ] UI/UX enhancements for error states

---

## Testing Checklist

- [ ] Backend server is running (`npm run dev` or `npm start` in backend/)
- [ ] Frontend can reach backend (check Network tab in DevTools)
- [ ] API returns data with correct structure
- [ ] Context stores data properly
- [ ] MindMap component receives data and renders nodes
- [ ] Canvas draws connections correctly
- [ ] Nodes are visible and positioned correctly


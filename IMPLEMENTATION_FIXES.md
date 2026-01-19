# 🛠️ Recommended Fixes to Implement

## Fix 1: Add API URL to Environment Variables

### Problem
Backend URL is hardcoded as `http://localhost:5000` in the code.

### Solution

**File:** `frontend/.env.local`

Add this line:
```env
VITE_API_URL=http://localhost:5000
```

**Then Update:** `frontend/src/sections/KnowledgeGraphSection.jsx`

Replace this line:
```jsx
const res = await fetch("http://localhost:5000/api/mindmap/generate", {
```

With:
```jsx
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const res = await fetch(`${API_URL}/api/mindmap/generate`, {
```

---

## Fix 2: Add Loading State to MindMap Component

### Problem
No visual feedback while MindMap is loading or if data fails to load.

### Current Code (MindMap.jsx):
```jsx
const MindMap = ({ isOpen, onClose }) => {
  const { mindMapData } = useStudyMap();
  const [nodes, setNodes] = useState([]);
  const canvasRef = useRef(null);
```

### Improved Code:
```jsx
const MindMap = ({ isOpen, onClose }) => {
  const { mindMapData } = useStudyMap();
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && mindMapData) {
      try {
        console.log("🗺️ Loading mind map with data:", mindMapData);
        const loadedNodes = loadFromAI(mindMapData);
        console.log("📍 Generated nodes:", loadedNodes);
        setNodes(loadedNodes);
        setError(null);
      } catch (error) {
        console.error("❌ Error loading mind map:", error);
        setError(`Failed to load mind map: ${error.message}`);
      }
    }
  }, [isOpen, mindMapData]);

  if (!isOpen) return null;

  return (
    <div className="mind-map-modal">
      <div className="mind-map-container">
        <div className="mind-map-header">
          <h2>Visual Mind Map</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {error && (
          <div style={{ padding: '20px', color: 'red', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
            ⚠️ {error}
          </div>
        )}

        {!error && nodes.length === 0 && (
          <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
            📍 No nodes to display. Generate a mind map first.
          </div>
        )}

        {/* ... rest of component ... */}
      </div>
    </div>
  );
};
```

---

## Fix 3: Add Error Boundary Component

### Create New File: `frontend/src/components/ErrorBoundary.jsx`

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#ffe6e6' }}>
          <h2>❌ Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Use in App.jsx:
```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your existing routes/components */}
    </ErrorBoundary>
  );
}
```

---

## Fix 4: Improve Backend Error Logging

### File: `backend/src/routes/mindmap.routes.js`

Replace error handling:
```javascript
} catch (err) {
  console.error(err);
  res.status(500).json({ error: "Mind map generation failed" });
}
```

With:
```javascript
} catch (err) {
  console.error("❌ Mind map generation failed:", {
    message: err.message,
    stack: err.stack,
    topic: topic
  });
  res.status(500).json({ 
    error: "Mind map generation failed",
    details: err.message,
    timestamp: new Date().toISOString()
  });
}
```

---

## Fix 5: Add Health Check Button

### In KnowledgeGraphSection.jsx, add this function:

```jsx
const checkHealthStatus = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/health");
    const data = await res.json();
    console.log("✅ Backend is healthy:", data);
    alert("✅ Backend is running!\n" + JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Backend health check failed:", error);
    alert("❌ Cannot connect to backend at http://localhost:5000\nError: " + error.message);
  }
};
```

And add a button in the JSX:
```jsx
<button onClick={checkHealthStatus} style={{ marginLeft: '10px' }}>
  🏥 Health Check
</button>
```

---

## Fix 6: Add Request Timeout

### In KnowledgeGraphSection.jsx:

```jsx
const generateMindMapFromAI = async () => {
  if (!topic.trim()) return alert("Enter a topic");

  setLoading(true);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const res = await fetch(`${API_URL}/api/mindmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✅ AI DATA:", data);

    if (!data.mindMap || !data.learningMap) {
      throw new Error("Invalid API response structure");
    }

    setMindMapData(data.mindMap);
    setLearningMapData(data.learningMap);
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.name === 'AbortError') {
      alert("Request timed out after 30 seconds. Check if backend is running.");
    } else {
      alert(`Failed to generate mind map: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Implementation Priority

### 🔴 Critical (Do First)
- [ ] Fix 6: Add request timeout - prevents UI from hanging
- [ ] Fix 1: Add API URL to env - makes code portable

### 🟠 High (Do Soon)
- [ ] Fix 3: Add error boundary - prevents app crashes
- [ ] Fix 4: Improve backend logging - helps debugging

### 🟡 Medium (Do Later)
- [ ] Fix 2: Add loading states - better UX
- [ ] Fix 5: Add health check button - helps troubleshooting

---

## Quick Implementation Checklist

```powershell
# 1. Update .env
# Add: VITE_API_URL=http://localhost:5000

# 2. Update KnowledgeGraphSection.jsx
# - Add API_URL from env
# - Add error handling
# - Add timeout

# 3. Update MindMap.jsx
# - Add error state
# - Add error display

# 4. Create ErrorBoundary.jsx
# - Copy the component code above

# 5. Update backend error logging
# - Add detailed error logging

# 6. Test everything
npm run dev  # Both backend and frontend
```

---

## Verification After Fixes

1. ✅ Backend healthcheck passes
2. ✅ Mind map generates without hanging
3. ✅ Learning map displays correctly
4. ✅ Visual mind map renders nodes
5. ✅ No console errors
6. ✅ Detailed error messages if something fails


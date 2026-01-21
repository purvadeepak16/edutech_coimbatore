import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { Network, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import MindMap from "../components/MindMap";
// VisualMindMap will be loaded on its own page
import "./KnowledgeGraphSection.css";
import VisualMapButton from '../components/VisualMapButton';
import { useStudyMap } from "../context/StudyMapContext";

/* ---------- Tree Node ---------- */
const toText = (v) => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    if (typeof v.title === "string") return v.title;
    if (typeof v.name === "string") return v.name;
  }
  try { return String(v); } catch { return ""; }
};

const TreeNode = ({ title, status, progress, children }) => {
  const iconMap = {
    mastered: <CheckCircle2 size={16} color="green" />,
    weak: <AlertCircle size={16} color="red" />,
    locked: <Lock size={16} color="gray" />,
  };

  return (
    <div className="tree-node-wrapper">
      <div className={`tree-node ${status}`}>
        <div className="node-content">
          {iconMap[status] || <div className="status-dot in-progress" />}
          <span className="node-title">{toText(title)}</span>
          {progress && <span className="node-progress">{toText(progress)}</span>}
        </div>
      </div>
      {children && <div className="tree-children">{children}</div>}
    </div>
  );
};

/* ---------- MAIN ---------- */
const KnowledgeGraphSection = () => {
  const location = useLocation();
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [loadingVisual, setLoadingVisual] = useState(false);

  const {
    topic,
    setTopic,
    mindMapData,
    setMindMapData,
    learningMapData,
    setLearningMapData,
    loading,
    setLoading,
  } = useStudyMap();

  const normalizeLearningMap = (lm, fallbackMindMap) => {
    if (!lm) return null;

    const toTopicObj = (t) => {
      if (typeof t === "string") {
        return { title: t, status: "inprogress", progress: "40%" };
      }
      if (t && typeof t === "object") {
        if (Array.isArray(t.children)) {
          // If AI mistakenly returned a mind-map branch
          return t.children.map((c) => toTopicObj(c)).flat();
        }
        return {
          title: toText(t.title ?? t),
          status: t.status ?? "inprogress",
          progress: typeof t.progress === "string" ? t.progress : "40%",
        };
      }
      return { title: toText(t), status: "inprogress", progress: "40%" };
    };

    const unitsSrc = Array.isArray(lm.units)
      ? lm.units
      : Array.isArray(fallbackMindMap?.branches)
      ? fallbackMindMap.branches
      : [];

    const units = unitsSrc.map((u, idx) => {
      // If the unit looks like a mindmap branch, convert
      if (u && typeof u === "object" && Array.isArray(u.children) && !u.topics) {
        return {
          title: toText(u.title ?? `Unit ${idx + 1}`),
          status: idx === 0 ? "mastered" : "inprogress",
          progress: idx === 0 ? "90%" : "In Progress",
          topics: u.children.map((c) => toTopicObj(c)).flat(),
        };
      }
      const topics = Array.isArray(u?.topics)
        ? u.topics
        : Array.isArray(u?.children)
        ? u.children
        : [];
      const normalizedTopics = topics
        .map((t) => toTopicObj(t))
        .flat()
        .filter(Boolean);
      return {
        title: toText(u?.title ?? `Unit ${idx + 1}`),
        status: u?.status ?? (idx === 0 ? "mastered" : "inprogress"),
        progress: typeof u?.progress === "string" ? u.progress : (idx === 0 ? "90%" : "In Progress"),
        topics: normalizedTopics,
      };
    });

    return {
      subject: toText(lm.subject ?? fallbackMindMap?.center ?? ""),
      units,
    };
  };

  const generateMindMapFromAI = async () => {
    if (!topic.trim()) return alert("Enter a topic");

    setLoading(true);
      let timeoutId;
    try {
      // Setup timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      // Get API URL from env or use default
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      console.log("📤 Sending request to:", API_URL);

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
      const normalized = normalizeLearningMap(data.learningMap, data.mindMap);
      console.log("🧹 Normalized LearningMap:", normalized);
      setLearningMapData(normalized);
     } catch (error) {
       clearTimeout(timeoutId);
       if (error.name === 'AbortError') {
         console.error("❌ Request timeout:", error);
         alert("Request timed out after 30 seconds. Is the backend running?");
       } else {
       console.error("❌ Error:", error);
       alert(`Failed to generate mind map: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // If navigated here with todaysTasks and autoGenerate flag, prefill and generate
  useEffect(() => {
    try {
      const state = location?.state;
      if (!state) return;
      const { todaysTasks, autoGenerate } = state;
      if (!todaysTasks || !autoGenerate) return;

      // Build a topic string from today's tasks (concise)
      const titleLines = todaysTasks.map((t, i) => {
        const subj = t.subject || t.unitName || 'Unknown Subject';
        const tt = t.title || t.originalTitle || t.name || '';
        return `${i + 1}. ${subj}: ${tt}`;
      });
      const combined = `Today's Study Plan:\n${titleLines.join('\n')}\n\nGenerate a learning map and a visual mind map.`;

      // Prefill topic and auto-generate
      setTopic(combined);
      // small delay to let state settle
      setTimeout(() => {
        generateMindMapFromAI();
      }, 120);
    } catch (err) {
      console.error('Auto-generate mindmap failed', err);
    }
  }, [location]);

  const checkBackendHealth = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/health`);
      const data = await res.json();
      console.log("✅ Backend health check passed:", data);
      alert(`✅ Backend is healthy!\n\nStatus: ${data.status}\nTime: ${data.timestamp}`);
    } catch (error) {
      console.error("❌ Backend health check failed:", error);
      alert(`❌ Cannot connect to backend!\n\nError: ${error.message}\n\nMake sure the backend is running on http://localhost:5000`);
    }
  };

  return (
    <section className="knowledge-graph-section">
      {/* AI INPUT */}
      <div className="ai-generate-bar">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic"
        />
        <button onClick={generateMindMapFromAI}>
          {loading ? "Generating..." : "Generate AI"}
        </button>
        <button onClick={checkBackendHealth} style={{ marginLeft: 8 }}>
          🏥 Health
        </button>
      </div>

      <h2>Your Learning Map</h2>

      {/* LEARNING MAP */}
      {learningMapData && (
        <div className="graph-container">
          <div className="root-node">
            <h3>📚 {learningMapData.subject}</h3>
          </div>

          <div className="tree-structure">
            {learningMapData.units.map((unit, i) => (
              <div className="branch" key={i}>
                <TreeNode
                  title={unit.title}
                  status={unit.status}
                  progress={unit.progress}
                >
                  {unit.topics?.map((t, j) => (
                    <TreeNode
                      key={j}
                      title={t.title}
                      status={t.status}
                      progress={t.progress}
                    />
                  ))}
                </TreeNode>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPEN VISUAL MAP */}
      <VisualMapButton topic={topic} loading={loadingVisual} setLoading={setLoadingVisual} />

      {/* Visual Mind Map opens on its own page */}

      <MindMap isOpen={isMindMapOpen} onClose={() => setIsMindMapOpen(false)} />
    </section>
  );
};

export default KnowledgeGraphSection;

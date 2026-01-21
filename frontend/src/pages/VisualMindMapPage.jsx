import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VisualMindMap from '../components/VisualMindMap';

const VisualMindMapPage = () => {
  const [search] = useSearchParams();
  const topic = search.get('topic') || '';
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!topic) return;
    let mounted = true;
    const fetchVisual = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/visual-mindmap/generate-visual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        if (mounted) setData(json.visualMindMap);
      } catch (err) {
        console.error('Visual map fetch error', err);
        if (mounted) setError(err.message || 'Failed to fetch visual map');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchVisual();
    return () => { mounted = false; };
  }, [topic]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
        <button onClick={() => navigate(-1)} className="control-btn">← Back</button>
        <h2 style={{ margin: 0 }}>🧠 Visual Mind Map: {topic}</h2>
      </div>

      {loading && <div style={{ padding: 24 }}>Generating visual mind map...</div>}
      {error && <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>}
      {!loading && data && (
        <div style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
          <VisualMindMap data={data} />
        </div>
      )}
    </div>
  );
};

export default VisualMindMapPage;

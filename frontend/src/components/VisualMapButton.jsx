import React from 'react';
import { useNavigate } from 'react-router-dom';

const VisualMapButton = ({ topic, loading, setLoading }) => {
  const navigate = useNavigate();

  const openPage = async () => {
    if (!topic || !topic.trim()) return alert('Enter a topic first');
    // navigate to visual map page with topic as query param
    navigate(`/visual-map?topic=${encodeURIComponent(topic.trim())}`);
  };

  return (
    <button className="action-link visual-map-btn" onClick={openPage} disabled={loading}>
      🧭 {loading ? 'Generating...' : 'Open Visual Mind Map'}
    </button>
  );
};

export default VisualMapButton;

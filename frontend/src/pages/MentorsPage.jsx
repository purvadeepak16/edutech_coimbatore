import React, { useEffect, useState } from 'react';
import { listMentors, createMentorRequest } from '../services/mentorApi';
import './MentorsPage.css';

const MentorsPage = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await listMentors();
        setMentors(res.mentors || res || []);
      } catch (err) {
        console.error('Failed to load mentors', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConnect = async (mentorId) => {
    try {
      setSending(prev => ({ ...prev, [mentorId]: true }));
      await createMentorRequest(mentorId);
      // optimistically mark as requested
      setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, requested: true } : m));
    } catch (err) {
      console.error('Create request failed', err);
      alert(err.message || 'Failed to send request');
    } finally {
      setSending(prev => ({ ...prev, [mentorId]: false }));
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading mentors...</div>;

  const formatSpecs = (specs) => {
    if (!specs) return '';
    return specs.map(s => {
      if (!s) return '';
      if (typeof s === 'string') return s;
      const subj = s.subject || s.name || '';
      const levels = Array.isArray(s.levels) ? s.levels.join('/') : (s.level || '');
      return levels ? `${subj} (${levels})` : subj;
    }).filter(Boolean).join(', ');
  };

  return (
    <div className="mentors-page">
      <h2>Find a Mentor</h2>
      <p>Browse mentors and send a connection request.</p>
      <div className="mentors-grid">
        {mentors.length === 0 && <div>No mentors found.</div>}
        {mentors.map(m => (
          <div key={m.id} className="mentor-card">
            <div className="mentor-info">
              <div className="mentor-name">{m.displayName || m.name || m.email || 'Mentor'}</div>
              <div className="mentor-specs">{formatSpecs(m.mentorSpecializations)}</div>
            </div>
            <div>
              <button className="btn-connect" disabled={m.requested || sending[m.id]} onClick={() => handleConnect(m.id)}>
                {m.requested ? 'Pending' : (sending[m.id] ? 'Sending...' : 'Connect')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorsPage;

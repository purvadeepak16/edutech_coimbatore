import React, { useEffect, useState } from 'react';
import { getUpcomingMeets, getJoinRequests, acceptJoinRequest, rejectJoinRequest, createMeet, startMeet, endMeet, listMeets, getMeet } from '../services/mentorApi';
import { useNavigate } from 'react-router-dom';
import './MeetsManagement.css';

const TABS = ['Upcoming Meets', 'Join Requests', 'Past Meets'];

export default function MeetsManagement() {
  const [tab, setTab] = useState(TABS[0]);
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', topics: '', date: '', time: '', duration: 60, capacity: 10, approval: 'manual' });
  const navigate = useNavigate();

  useEffect(() => { loadMeets(); }, []);

  const loadMeets = async () => {
    setLoading(true);
    try {
      const res = await getUpcomingMeets();
      setMeets(res.meets || []);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const openMeet = async (meet) => {
    setSelectedMeet(meet);
    if (tab === 'Join Requests') {
      try {
        const res = await getJoinRequests(meet.id);
        setJoinRequests(res.requests || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAccept = async (meetId, studentId) => {
    try {
      await acceptJoinRequest(meetId, studentId);
      setJoinRequests(prev => prev.filter(j => j.studentId !== studentId));
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to accept request');
    }
  };

  const handleReject = async (meetId, studentId) => {
    try {
      await rejectJoinRequest(meetId, studentId);
      setJoinRequests(prev => prev.filter(j => j.studentId !== studentId));
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to reject request');
    }
  };

  const handleCreate = async () => {
    const scheduledAt = new Date(form.date + ' ' + form.time).toISOString();
    const payload = {
      title: form.title,
      subject: form.subject,
      scheduledAt,
      duration: Number(form.duration),
      maxParticipants: Number(form.capacity),
    };
    try {
      await createMeet(payload);
      setShowCreate(false);
      loadMeets();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to create meet');
    }
  };

  const handleStart = async (meetId) => {
    try {
      await startMeet(meetId);
      // fetch meeting to obtain meetingUrl then navigate to unified route
      const meetData = await getMeet(meetId);
      const meetingUrl = meetData?.meeting?.meetingUrl || meetData?.meetingUrl || meetData?.url;
      if (meetingUrl) {
        const q = `?url=${encodeURIComponent(meetingUrl)}`;
        navigate(`/active-session/${meetId}${q}`);
      } else {
        loadMeets();
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to start meet');
    }
  };

  const handleEnd = async (meetId) => {
    try {
      await endMeet(meetId);
      loadMeets();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to end meet');
    }
  };

  return (
    <div className="meets-page">
      <div className="meets-header">
        <h2>Meets Management</h2>
        <div className="meets-actions">
          <button className="btn" onClick={() => setShowCreate(true)}>Create Meet</button>
        </div>
      </div>

      <div className="meets-tabs">
        {TABS.map(t => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="meets-body">
        <div className="meets-list">
          {loading && <div className="muted">Loading...</div>}
          {!loading && meets.length === 0 && <div className="muted">No upcoming meets.</div>}
          {meets.map(m => (
            <div key={m.id} className={"meet-card" + (selectedMeet?.id === m.id ? ' selected': '')} onClick={() => openMeet(m)}>
              <div className="meet-title">{m.title}</div>
              <div className="meet-meta">{new Date(m.scheduledAt).toLocaleString()} · {m.duration}m</div>
              <div className="meet-cap">Capacity: {m.participants?.length || 0}/{m.maxParticipants}</div>
              <div className="meet-approval">Status: {m.status || 'scheduled'}</div>
            </div>
          ))}
        </div>

        <div className="meets-detail">
          {!selectedMeet && <div className="muted">Select a meet to view details</div>}
          {selectedMeet && (
            <>
              <h3>{selectedMeet.title}</h3>
              <div className="detail-row">Subject: {selectedMeet.subject || 'General'}</div>
              <div className="detail-row">When: {new Date(selectedMeet.scheduledAt).toLocaleString()}</div>
              <div className="detail-row">Capacity: {selectedMeet.participants?.length || 0}/{selectedMeet.maxParticipants}</div>
              <div className="detail-row">Status: {selectedMeet.status}</div>

              {tab === 'Join Requests' && (
                <div className="join-requests">
                  <h4>Pending Join Requests</h4>
                  {joinRequests.length === 0 && <div className="muted">No join requests.</div>}
                  {joinRequests.map(j => (
                    <div className="jr" key={j.studentId}>
                      <div>{j.studentId} • {new Date(j.requestedAt).toLocaleString()}</div>
                      <div className="jr-actions">
                        <button className="btn small" onClick={() => handleAccept(selectedMeet.id, j.studentId)}>Accept</button>
                        <button className="btn ghost small" onClick={() => handleReject(selectedMeet.id, j.studentId)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="meet-controls">
                <button className="btn" onClick={() => handleStart(selectedMeet.id)}>Start Meet</button>
                <button className="btn ghost" onClick={() => handleEnd(selectedMeet.id)}>End Meet</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal">
          <div className="modal-inner">
            <h3>Create Meet</h3>
            <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
            <input placeholder="Topics (comma separated)" value={form.topics} onChange={e=>setForm({...form,topics:e.target.value})} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
            <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} />
            <input placeholder="Duration (minutes)" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} />
            <input placeholder="Capacity" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} />
            <select value={form.approval} onChange={e=>setForm({...form,approval:e.target.value})}>
              <option value="manual">Manual Approval</option>
              <option value="auto">Auto Approve</option>
            </select>
            <div className="modal-actions">
              <button className="btn" onClick={handleCreate}>Create</button>
              <button className="btn ghost" onClick={()=>setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

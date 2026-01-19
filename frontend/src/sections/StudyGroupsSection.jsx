import React, { useEffect, useState } from 'react';
import { Users, Plus, Compass, Video, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudyGroupsSection.css';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/study-groups';

/* ------------------ GROUP CARD ------------------ */
const GroupCard = ({ name, members, status, latestMsg, initials, color, accentColor, consistency, onView, onDelete }) => (
    <div className="group-card" style={{ backgroundColor: color }}>
        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }} title="Delete group">
            <Trash size={14} />
        </button>
        <div className="group-header">
            <div className="group-avatar" style={{ backgroundColor: accentColor }}>
                {initials}
            </div>
            <div className="group-info">
                <h4>{name}</h4>
                <div className="group-meta">
                    <span className="member-count"><Users size={12} /> {members} members</span>
                    <span className="consistency-score" title="Group Consistency Score">🔥 {consistency}%</span>
                </div>
            </div>
        </div>

        <div className="group-status">
            <span className="dot-pulse"></span> {status}
        </div>

        <div className="latest-msg">
            "{latestMsg}"
        </div>

        <div className="group-actions">
            <button className="view-btn" onClick={onView}>View Group</button>
            <button className="meet-btn"><Video size={14} /> Start Meet</button>
        </div>
    </div>
);

/* ------------------ MAIN SECTION ------------------ */
const StudyGroupsSection = () => {
    const [groups, setGroups] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    /* ---------- FETCH GROUPS ---------- */
    useEffect(() => {
        let mounted = true;
        async function fetchGroups() {
            setLoading(true);
            setError(null);
            try {
                const token = currentUser ? await currentUser.getIdToken() : null;
                const res = await fetch(API_BASE, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Failed to fetch groups');
                if (mounted) setGroups(data.groups || []);
            } catch (err) {
                console.error('Fetch groups error:', err);
                if (mounted) setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchGroups();

        return () => { mounted = false; };
    }, [currentUser]);

    // Palette of base + accent colors to cycle through for cards
    const palette = [
        { color: 'var(--color-soft-teal)', accent: '#7AC5DA' },
        { color: 'var(--color-soft-purple)', accent: '#D8B4FE' },
        { color: 'var(--color-soft-pink)', accent: '#F9C9D4' },
        { color: 'var(--color-soft-blue)', accent: '#D8E0EA' },
        { color: 'var(--color-soft-orange)', accent: '#FED7AA' },
        { color: 'var(--color-soft-yellow)', accent: '#FFF4C7' }
    ];

    /* ---------- CREATE GROUP ---------- */
    const handleCreateGroup = async () => {
        setError(null);
        try {
            if (!currentUser) throw new Error('You must be signed in to create groups');
            const token = await currentUser.getIdToken();
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Failed to create group');
            if (data.success) {
                setGroups(prev => [data.group, ...prev]);
                setShowCreate(false);
                setForm({ name: '', description: '' });
            }
        } catch (err) {
            console.error('Create group error:', err);
            setError(err.message || String(err));
        }
    };

    /* ---------- VIEW GROUP ---------- */
    const handleViewGroup = (groupId) => {
        navigate(`/study-groups/${groupId}`);
    };

    /* ---------- DELETE GROUP ---------- */
    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Delete this study group? This action cannot be undone.')) return;
        setError(null);
        try {
            if (!currentUser) throw new Error('You must be signed in to delete groups');
            const token = await currentUser.getIdToken();
            const res = await fetch(`${API_BASE}/${groupId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Failed to delete group');
            // remove from local state
            setGroups(prev => prev.filter(g => g.id !== groupId));
        } catch (err) {
            console.error('Delete group error:', err);
            setError(err.message || String(err));
        }
    };

    return (
        <section className="study-groups-section">
            <div className="groups-section-header">
                <h2>👥 Your Study Groups</h2>
                <div className="header-actions">
                    <button className="btn-create" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Create
                    </button>
                    <button className="btn-discover">
                        <Compass size={16} /> Discover
                    </button>
                </div>
            </div>

            {/* -------- GROUP LIST -------- */}
            <div className="groups-grid">
                {loading && <div className="loading">Loading groups...</div>}
                {error && <div className="error">{error}</div>}
                {!loading && !error && groups.map((group, idx) => {
                    const p = palette[idx % palette.length] || { color: 'var(--color-soft-teal)', accent: '#7AC5DA' };
                    return (
                        <GroupCard
                            key={group.id}
                            name={group.name}
                            members={group.members ? group.members.length : (group.members?.length || 1)}
                            status={group.visibility === 'private' ? 'Private' : 'Active'}
                            latestMsg={group.description || 'No messages yet'}
                            initials={group.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                            color={group.color || p.color}
                            accentColor={group.accentColor || p.accent}
                            consistency={group.consistency || 90}
                            onView={() => handleViewGroup(group.id)}
                            onDelete={() => handleDeleteGroup(group.id)}
                        />
                    );
                })}
            </div>

            {/* -------- CREATE MODAL -------- */}
            {showCreate && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Create Study Group</h3>
                        <input
                            placeholder="Group Name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Description"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                        <div className="modal-actions">
                            <button onClick={handleCreateGroup}>Create</button>
                            <button onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default StudyGroupsSection;

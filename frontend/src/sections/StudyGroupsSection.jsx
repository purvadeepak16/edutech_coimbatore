import React, { useEffect, useState } from 'react';
import { Users, Plus, Compass, Video, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudyGroupsSection.css';
import { useAuth } from '../context/AuthContext';
import GroupChatPanel from '../components/GroupChatPanel';
import GroupMeetPreview from '../components/GroupMeetPreview';
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';

// Note: using Firestore directly for studyGroups CRUD and membership operations

/* ------------------ GROUP CARD ------------------ */
const GroupCard = ({ id, name, organizerId, members, status, latestMsg, initials, color, accentColor, consistency, onView, onDelete, onMeet, onJoin, isMember, isOrganizer, joinLoading }) => (
    <div className="group-card" style={{ backgroundColor: color }}>
        {isOrganizer && (
            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }} title="Delete group">
                <Trash size={14} />
            </button>
        )}
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
            {isOrganizer || isMember ? (
                <button className="view-btn" onClick={onView}>View Group</button>
            ) : (
                <button className="join-btn" disabled={joinLoading} onClick={onJoin}>{joinLoading ? 'Joining...' : 'Join Group'}</button>
            )}

            <button className="meet-btn" onClick={onMeet}><Video size={14} /> Start Meet</button>
        </div>
    </div>
);

/* ------------------ MAIN SECTION ------------------ */
const StudyGroupsSection = () => {
    const [groups, setGroups] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', groupType: 'public' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMeetOpen, setIsMeetOpen] = useState(false);
    const [activeMeeting, setActiveMeeting] = useState(null);
    const [meetError, setMeetError] = useState(null);
    const [joinLoading, setJoinLoading] = useState({});
    const [joinError, setJoinError] = useState(null);
    const [blockedModal, setBlockedModal] = useState({ show: false, message: '' });

    /* ---------- FETCH GROUPS ---------- */
    useEffect(() => {
        let mounted = true;
        async function fetchGroups() {
            setLoading(true);
            setError(null);
            try {
                const q = query(collection(db, 'studyGroups'), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (mounted) setGroups(items);
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
            // Create group in Firestore with organizer as initial member
            const payload = {
                name: form.name,
                description: form.description || '',
                organizerId: currentUser.uid,
                members: [{ userId: currentUser.uid, role: 'organizer' }],
                groupType: form.groupType || 'public',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'studyGroups'), payload);
            const newGroup = { id: docRef.id, ...payload };
            setGroups(prev => [newGroup, ...prev]);
            setShowCreate(false);
            setForm({ name: '', description: '', groupType: 'public' });
        } catch (err) {
            console.error('Create group error:', err);
            setError(err.message || String(err));
        }
    };

    /* ---------- VIEW GROUP (open chat panel) ---------- */
    const handleViewGroup = (groupId) => {
        // open right-side chat panel instead of navigating away
        setSelectedGroupId(groupId);
        setIsChatOpen(true);
    };

    /* ---------- JOIN GROUP ---------- */
    const handleJoinGroup = async (group) => {
        if (!currentUser || !userData) {
            setJoinError('Sign in to join groups');
            return;
        }
        setJoinError(null);
        setJoinLoading(prev => ({ ...prev, [group.id]: true }));

        try {
            const groupRef = doc(db, 'studyGroups', group.id);
            const snap = await getDoc(groupRef);
            if (!snap.exists()) throw new Error('Group not found');
            const data = snap.data();

            // Restrict female-only groups
            if (data.groupType === 'female-only' && (userData.gender || '').toLowerCase() !== 'female') {
                console.warn('Blocked join: group is female-only, user gender=', userData?.gender);
                setBlockedModal({ show: true, message: "You can’t join this group. It is for female students only." });
                setJoinLoading(prev => ({ ...prev, [group.id]: false }));
                return;
            }

            // Prevent duplicate joins by checking existing members
            const isAlready = Array.isArray(data.members) && data.members.some(m => m.userId === currentUser.uid);
            if (isAlready) {
                // Update local state to reflect membership
                setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: data.members } : g));
                return;
            }

            // Atomic update using arrayUnion
            await updateDoc(groupRef, { members: arrayUnion({ userId: currentUser.uid, role: 'member' }) });

            // Optimistically update UI
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: Array.isArray(g.members) ? [...g.members, { userId: currentUser.uid, role: 'member' }] : [{ userId: currentUser.uid, role: 'member' }] } : g));
        } catch (err) {
            console.error('Join group error:', err);
            setJoinError(err.message || String(err));
        } finally {
            setJoinLoading(prev => ({ ...prev, [group.id]: false }));
        }
    }

    /* ---------- START / OPEN MEET ---------- */
    const handleMeet = async (group) => {
        setMeetError(null);
        try {
            if (!currentUser) throw new Error('Sign in to access meetings');
            const token = await currentUser.getIdToken();
            // If organizer, POST to create (idempotent)
            let res;
            if (currentUser.uid === group.organizerId) {
                res = await fetch('http://localhost:5000/api/group-meet/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ groupId: group.id }),
                });
            } else {
                // member: fetch existing meeting
                res = await fetch(`http://localhost:5000/api/group-meet/${group.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || data?.error || 'Meeting not available');
            const meeting = data.meeting || data;
            if (!meeting) throw new Error('No meeting returned');
            setActiveMeeting({ ...meeting, group });
            setIsMeetOpen(true);
        } catch (err) {
            console.error('Meet error:', err);
            setMeetError(err.message || String(err));
            // If member and not started, show friendly message
            if (err.message && err.message.toLowerCase().includes('no active')) {
                alert('Meeting not started by organizer yet');
            }
        }
    };

    /* ---------- DELETE GROUP ---------- */
    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Delete this study group? This action cannot be undone.')) return;
        setError(null);
        try {
            if (!currentUser) throw new Error('You must be signed in to delete groups');
            const ref = doc(db, 'studyGroups', groupId);
            await deleteDoc(ref);
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
                    const isOrganizer = currentUser && (currentUser.uid === group.organizerId);
                    const isMember = currentUser && Array.isArray(group.members) && group.members.some(m => m.userId === currentUser.uid);
                    return (
                        <GroupCard
                            key={group.id}
                            id={group.id}
                            organizerId={group.organizerId}
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
                            onMeet={() => handleMeet(group)}
                            onJoin={() => handleJoinGroup(group)}
                            isMember={isMember}
                            isOrganizer={isOrganizer}
                            joinLoading={joinLoading[group.id]}
                        />
                    );
                })}
            </div>

            {/* -------- CREATE MODAL -------- */}
            {showCreate && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Create Study Group</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <label className="modal-label">Group Name</label>
                            <input
                                className="modal-input"
                                placeholder="e.g., Exam Prep — Chemistry"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />

                            <label className="modal-label">Description</label>
                            <textarea
                                className="modal-textarea"
                                placeholder="Short description (optional)"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />

                            {/* Group Type: show female-only option only for female users */}
                            {userData && (userData.gender || '').toLowerCase() === 'female' ? (
                                <div className="modal-group-type">
                                    <label className="modal-label">Group Type</label>
                                    <div className="radio-row">
                                        <label style={{ marginRight: 12 }}><input type="radio" name="groupType" value="public" checked={form.groupType === 'public'} onChange={() => setForm(f => ({ ...f, groupType: 'public' }))} /> Public Group</label>
                                        <label><input type="radio" name="groupType" value="female-only" checked={form.groupType === 'female-only'} onChange={() => setForm(f => ({ ...f, groupType: 'female-only' }))} /> Female Only Group</label>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="modal-actions">
                            <div />
                            <div className="modal-actions-right">
                                <button className="btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn-create-primary" onClick={handleCreateGroup}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat panel (slides in from right) */}
            <GroupChatPanel
                groupId={isChatOpen ? selectedGroupId : null}
                onClose={() => { setIsChatOpen(false); setSelectedGroupId(null); }}
                authUser={currentUser}
            />
            {/* Group Meet Preview */}
            {isMeetOpen && activeMeeting && (
                <React.Suspense fallback={null}>
                    <div>
                        <GroupMeetPreview meeting={activeMeeting} group={activeMeeting.group} onClose={() => { setIsMeetOpen(false); setActiveMeeting(null); }} currentUser={currentUser} />
                    </div>
                </React.Suspense>
            )}

            {/* Blocked-join modal: shown when a non-female user attempts to join a female-only group */}
            {blockedModal.show && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Cannot Join Group</h3>
                            <button className="modal-close" onClick={() => setBlockedModal({ show: false, message: '' })}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>{blockedModal.message}</p>
                        </div>
                        <div className="modal-actions">
                            <div />
                            <div className="modal-actions-right">
                                <button className="btn-cancel" onClick={() => setBlockedModal({ show: false, message: '' })}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default StudyGroupsSection;

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './GroupChatPanel.css';
import ChatMessage from './ChatMessage';
import { X, Send } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/study-groups';

const GroupChatPanel = ({ groupId, onClose, authUser }) => {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = authUser ? await authUser.getIdToken() : null;
        const [gRes, mRes] = await Promise.all([
          fetch(`${API_BASE}/${groupId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch(`${API_BASE}/${groupId}/messages`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        ]);
        const gData = await gRes.json();
        const mData = await mRes.json();
        if (mounted) {
          setGroup(gData.group || gData);
          setMessages(mData.messages || mData || []);
        }
      } catch (err) {
        console.error('Chat load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupId, authUser]);

  useEffect(() => {
    // auto-scroll to bottom
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const tempId = `t_${Date.now()}`;
    const msg = {
      id: tempId,
      senderId: authUser?.uid || 'anon',
      senderName: authUser?.displayName || 'You',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    // optimistic UI
    setMessages(prev => [...prev, msg]);
    setText('');
    try {
      const token = authUser ? await authUser.getIdToken() : null;
      const res = await fetch(`${API_BASE}/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: msg.text })
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      // replace temp message id if backend returns message
      if (data.message) {
        setMessages(prev => prev.map(m => (m.id === tempId ? data.message : m)));
      }
    } catch (err) {
      console.error('Send failed', err);
      // mark failed message (optional)
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const panel = (
    <aside className={`group-chat-panel ${groupId ? 'open' : ''}`} aria-hidden={!groupId}>
      <div className="chat-header">
        <div>
          <div className="chat-title">{group?.name || 'Group'}</div>
          <div className="chat-sub">{group?.members?.length || '—'} members</div>
        </div>
        <button className="chat-close" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="chat-list" ref={listRef}>
        {loading && <div className="chat-loading">Loading messages…</div>}
        {!loading && messages.length === 0 && <div className="chat-empty">No messages yet — say hi 👋</div>}
        {messages.map(m => (
          <ChatMessage key={m.id} message={m} currentUid={authUser?.uid} />
        ))}
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="chat-send" onClick={handleSend} aria-label="Send"><Send size={18} /></button>
      </div>
    </aside>
  );

  // Render at document.body to avoid parent stacking contexts/offsets
  if (typeof document !== 'undefined') {
    return createPortal(panel, document.body);
  }

  return panel;
};

export default GroupChatPanel;

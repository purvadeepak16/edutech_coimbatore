import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import ChatMessage from "./ChatMessage";
import "./GroupChatPanel.css";

const API_BASE = "http://localhost:5000/api/study-groups";

export default function GroupChatPanel({ groupId, onClose }) {
  const { currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
      const token = currentUser ? await currentUser.getIdToken() : null;
        const [gRes, mRes] = await Promise.all([
          fetch(`${API_BASE}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/${groupId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!gRes.ok) throw new Error("Failed to fetch group");
        if (!mRes.ok) throw new Error("Failed to fetch messages");

        const groupJson = await gRes.json();
        const messagesJson = await mRes.json();

        if (!mounted) return;
        // API returns { success:true, group: {...}, isMember }
        setGroup(groupJson.group || groupJson);
        setMessages(messagesJson.messages || []);
        // If the user is a member, post a short 'view' system message once
        if (groupJson.isMember) {
          // send a lightweight 'view' notice but avoid spamming: only once per open
          sendViewNotice(groupJson.group || groupJson).catch((e) => console.warn(e));
        }
      } catch (err) {
        console.error("Group chat load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [groupId]);

  useEffect(() => {
    // Auto-scroll to latest message when messages change or loading finishes
    const el = listRef.current;
    if (!el) return;
    // allow UI to settle
    const raf = requestAnimationFrame(() => {
      try {
        // prefer smooth scroll into view of last child for reliability
        const last = el.lastElementChild;
        if (last && typeof last.scrollIntoView === 'function') {
          last.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          el.scrollTop = el.scrollHeight;
        }
      } catch (e) {
        // ignore
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const body = { text: text.trim() };
    // optimistic UI
    const optimistic = {
      id: `temp-${Date.now()}`,
      text: body.text,
      senderUid: currentUser?.uid || "unknown",
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
        try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const res = await fetch(`${API_BASE}/${groupId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("send failed");
      const json = await res.json();
      // backend returns { success:true, message: { ... } }
      const returned = json.message || json;
      setMessages((m) => m.map((it) => (it.id === optimistic.id ? returned : it)));
    } catch (err) {
      console.error("Send failed", err);
      // mark last optimistic as failed
      setMessages((m) => m.map((it) => (it.id === optimistic.id ? { ...it, _failed: true } : it)));
    } finally {
      setSending(false);
    }
  }

  const viewNoticeSentRef = useRef(false);
  async function sendViewNotice(groupObj) {
    if (viewNoticeSentRef.current) return;
    if (!currentUser) return;
    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const text = `${currentUser.displayName || currentUser.email || 'A user'} viewed the group.`;
      const res = await fetch(`${API_BASE}/${groupId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const message = json.message || json;
      // append to messages
      setMessages((m) => [...m, message]);
      viewNoticeSentRef.current = true;
    } catch (e) {
      console.warn('Failed to send view notice', e);
    }
  }

  if (!groupId) return null;

  const memberCount = group?.members?.length ?? group?.memberCount ?? (group?.members ? group.members.length : undefined);

  return createPortal(
    <aside className="gp-panel" role="dialog" aria-label="Group chat">
      <div className="gp-header">
        <div>
          <div className="gp-title"><strong>{group?.name || "Group"}</strong></div>
          <div className="gp-members">{typeof memberCount === 'number' ? `${memberCount} members` : 'Members'}</div>
        </div>
        <button className="gp-close" onClick={onClose} aria-label="Close chat">✕</button>
      </div>
      <div className="gp-body" ref={listRef}>
        {loading && <div className="gp-loading">Loading...</div>}
        {!loading && messages.length === 0 && <div className="gp-empty">No messages yet</div>}
        {!loading && messages.map((msg) => (
          <ChatMessage key={msg.id || msg.createdAt} message={msg} mine={msg.senderUid === currentUser?.uid} />
        ))}
      </div>
      <form className="gp-footer" onSubmit={handleSend}>
        <input
          className="gp-input"
          placeholder="Write a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSend(e);
            }
          }}
        />
        <button className="gp-send" type="submit" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </aside>,
    document.body
  );
}

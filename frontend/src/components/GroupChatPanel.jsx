import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import ChatMessage from "./ChatMessage";
import "./GroupChatPanel.css";

const API_BASE = "http://localhost:5000/api/study-groups";

export default function GroupChatPanel({ groupId, onClose }) {
  const { getIdToken, currentUser } = useAuth();
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
        const token = await getIdToken();
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
        setGroup(groupJson);
        setMessages(messagesJson.messages || []);
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
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
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
      const token = await getIdToken();
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
      setMessages((m) => m.map((it) => (it.id === optimistic.id ? json.message : it)));
    } catch (err) {
      console.error("Send failed", err);
      // mark last optimistic as failed
      setMessages((m) => m.map((it) => (it.id === optimistic.id ? { ...it, _failed: true } : it)));
    } finally {
      setSending(false);
    }
  }

  if (!groupId) return null;

  return createPortal(
    <aside className="gp-panel" role="dialog" aria-label="Group chat">
      <div className="gp-header">
        <div className="gp-title">{group?.name || "Group"}</div>
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

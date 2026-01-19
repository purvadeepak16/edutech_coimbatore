import React from "react";
import "./GroupChatPanel.css";

export default function ChatMessage({ message, mine }) {
  const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const cls = `chat-msg ${mine ? 'chat-msg-mine' : 'chat-msg-other'}`;
  return (
    <div className={cls} title={time}>
      <div className="chat-bubble">
        <div className="chat-text">{message.text}</div>
        <div className="chat-meta">{time}</div>
      </div>
    </div>
  );
}

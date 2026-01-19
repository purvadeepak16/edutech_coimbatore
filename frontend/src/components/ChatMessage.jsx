import React from 'react';
import './GroupChatPanel.css';

const ChatMessage = ({ message, currentUid }) => {
  const isMine = message.senderId === currentUid;
  return (
    <div className={`chat-msg-row ${isMine ? 'mine' : 'other'}`}>
      {!isMine && <div className="chat-sender">{message.senderName}</div>}
      <div className={`chat-bubble ${isMine ? 'bubble-mine' : 'bubble-other'}`}>
        <div className="chat-text">{message.text}</div>
        <div className="chat-meta">{new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    </div>
  );
};

export default ChatMessage;

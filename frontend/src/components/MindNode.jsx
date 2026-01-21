import React from 'react';
import './MindMap.css';

// Minimal presentational node used by the Visual Mind Map.
// Props: text (string), level ('root'|'level1'|'level2'), className (optional)
const MindNode = ({ text, level = 'level2', className = '' }) => {
  const levelClass = `mind-node--${level}`;

  return (
    <div className={["mind-node", levelClass, className].join(' ')}>
      <div className="mind-node-label">{text}</div>
    </div>
  );
};

export default MindNode;

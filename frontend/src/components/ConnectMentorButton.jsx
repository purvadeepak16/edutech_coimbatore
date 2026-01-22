import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import './ConnectMentorButton.css';

/**
 * ConnectMentorButton Component
 * 
 * Displays a prominent "Connect Mentor" button on the student dashboard
 * Opens the MentorListModal when clicked
 * 
 * Props:
 * - onClick: Callback function to open the mentor list modal
 */
const ConnectMentorButton = ({ onClick }) => {
  return (
    <button 
      className="connect-mentor-button"
      onClick={onClick}
      title="Find and connect with mentors"
    >
      <UserPlus size={20} />
      <span>Connect Mentor</span>
    </button>
  );
};

export default ConnectMentorButton;

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { listMentors, getMentorRequestStatuses, createMentorRequest } from '../services/mentorApi';
import './MentorListModal.css';

/**
 * MentorListModal Component
 * 
 * Displays a modal with all available mentors and their connection status
 * Allows students to send connection requests to mentors
 * 
 * Connection states:
 * - none: No request sent - shows "Connect" button
 * - pending: Request sent, awaiting mentor response
 * - accepted: Mentor accepted, connection established
 * - rejected: Mentor rejected, can send request again
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback function to close the modal
 */
const MentorListModal = ({ isOpen, onClose }) => {
  const [mentors, setMentors] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingRequest, setSendingRequest] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadMentors();
    }
  }, [isOpen]);

  const loadMentors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch mentors and request statuses in parallel
      const [mentorsResponse, statusesResponse] = await Promise.all([
        listMentors(),
        getMentorRequestStatuses()
      ]);

      console.log('Mentors:', mentorsResponse);
      console.log('Statuses:', statusesResponse);

      const mentorsList = mentorsResponse.mentors || [];
      const statusData = statusesResponse.requests || {};

      setMentors(mentorsList);
      
      // Convert statusData to map by mentorId
      const statusMap = {};
      Object.keys(statusData).forEach(mentorId => {
        statusMap[mentorId] = statusData[mentorId].status || 'none';
      });
      
      setRequestStatuses(statusMap);
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setError(err.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (mentor) => {
    try {
      setSendingRequest({ ...sendingRequest, [mentor.id]: true });
      
      const mentorName = mentor.displayName || mentor.userName || 'Unknown';
      
      await createMentorRequest(mentor.id);

      // Update local state immediately for responsive UI
      setRequestStatuses({
        ...requestStatuses,
        [mentor.id]: 'pending'
      });

      console.log(`Request sent to mentor: ${mentorName}`);
    } catch (err) {
      console.error('Failed to send request:', err);
      alert(err.message || 'Failed to send connection request');
    } finally {
      setSendingRequest({ ...sendingRequest, [mentor.id]: false });
    }
  };

  const getStatusBadge = (mentorId) => {
    const status = requestStatuses[mentorId] || 'none';

    switch (status) {
      case 'pending':
        return (
          <div className="status-badge pending">
            <Clock size={16} />
            <span>Pending</span>
          </div>
        );
      case 'accepted':
        return (
          <div className="status-badge connected">
            <CheckCircle2 size={16} />
            <span>Connected</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="status-badge rejected">
            <AlertCircle size={16} />
            <span>Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const canSendRequest = (mentorId) => {
    const status = requestStatuses[mentorId] || 'none';
    // Can send if no request or if previously rejected
    return status === 'none' || status === 'rejected';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mentor-list-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Connect with Mentors</h2>
            <p className="modal-subtitle">Find and connect with mentors to guide your learning journey</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading mentors...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <AlertCircle size={48} />
              <p>{error}</p>
              <button onClick={loadMentors} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && mentors.length === 0 && (
            <div className="empty-state">
              <UserCheck size={48} />
              <p>No mentors available at the moment</p>
            </div>
          )}

          {!loading && !error && mentors.length > 0 && (
            <div className="mentors-grid">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="mentor-card">
                  <div className="mentor-info">
                    <div className="mentor-avatar">
                      {(mentor.displayName || mentor.userName || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="mentor-details">
                      <h3>{mentor.displayName || mentor.userName || 'Unknown Mentor'}</h3>
                      {mentor.mentorSpecializations && mentor.mentorSpecializations.length > 0 && (
                        <div className="mentor-specializations">
                          {mentor.mentorSpecializations.map((spec, index) => {
                            // Handle both string and object formats
                            const displayText = typeof spec === 'string' 
                              ? spec 
                              : spec.subject || JSON.stringify(spec);
                            
                            return (
                              <span key={index} className="specialization-tag">
                                {displayText}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mentor-actions">
                    {getStatusBadge(mentor.id)}
                    
                    {canSendRequest(mentor.id) && (
                      <button
                        className="connect-button"
                        onClick={() => handleSendRequest(mentor)}
                        disabled={sendingRequest[mentor.id]}
                      >
                        {sendingRequest[mentor.id] ? 'Sending...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorListModal;

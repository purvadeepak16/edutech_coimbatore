import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Clock, RefreshCw, Users } from 'lucide-react';
import { 
  getIncomingMentorRequests, 
  acceptMentorRequest, 
  rejectMentorRequest,
  getConnectedStudents 
} from '../services/mentorApi';
import './MentorConnectionRequests.css';

/**
 * MentorConnectionRequests Component
 * 
 * Displays incoming connection requests from students and connected students
 * Allows mentors to accept or reject requests
 * 
 * This component can be used:
 * 1. As a standalone section in the Mentor Dashboard
 * 2. As a tab in the Join Requests section
 */
const MentorConnectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'connected'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [requestsRes, connectionsRes] = await Promise.all([
        getIncomingMentorRequests(),
        getConnectedStudents()
      ]);
      
      console.log('Incoming requests:', requestsRes);
      console.log('Connected students:', connectionsRes);
      
      const requestsList = requestsRes.requests || [];
      const connectionsList = connectionsRes.connections || [];
      
      setRequests(requestsList);
      setConnections(connectionsList);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load connection data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setProcessing({ ...processing, [requestId]: 'accepting' });
      
      await acceptMentorRequest(requestId);
      
      // Reload data to update both lists
      await loadData();
      
      console.log(`Request ${requestId} accepted`);
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert(err.message || 'Failed to accept request');
    } finally {
      setProcessing({ ...processing, [requestId]: null });
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing({ ...processing, [requestId]: 'rejecting' });
      
      await rejectMentorRequest(requestId);
      
      // Remove from list after successful reject
      setRequests(requests.filter(r => r.id !== requestId));
      
      console.log(`Request ${requestId} rejected`);
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessing({ ...processing, [requestId]: null });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  if (loading) {
    return (
      <div className="mentor-connection-requests">
        <div className="requests-header">
          <div>
            <h3>Student Connections</h3>
            <p className="subtitle">Manage your student connections</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-connection-requests">
        <div className="requests-header">
          <div>
            <h3>Student Connections</h3>
            <p className="subtitle">Manage your student connections</p>
          </div>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadData} className="retry-btn">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = requests.length;
  const connectedCount = connections.length;

  return (
    <div className="mentor-connection-requests">
      <div className="requests-header">
        <div>
          <h3>Student Connections</h3>
          <p className="subtitle">Manage your student connections</p>
        </div>
        <button onClick={loadData} className="refresh-btn" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="connection-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          Pending Requests
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button 
          className={`tab ${activeTab === 'connected' ? 'active' : ''}`}
          onClick={() => setActiveTab('connected')}
        >
          <Users size={16} />
          Connected Students
          {connectedCount > 0 && <span className="tab-badge">{connectedCount}</span>}
        </button>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <>
          {requests.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} />
              <h4>No Pending Requests</h4>
              <p>You don't have any new connection requests at the moment</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-info">
                    <div className="student-avatar">
                      {request.student?.name 
                        ? request.student.name.charAt(0).toUpperCase()
                        : 'S'}
                    </div>
                    <div className="request-details">
                      <div className="student-name">
                        {request.student?.name || 'Unknown Student'}
                      </div>
                      <div className="request-meta">
                        <Clock size={14} />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAccept(request.id)}
                      disabled={processing[request.id]}
                    >
                      {processing[request.id] === 'accepting' ? (
                        <>
                          <div className="btn-spinner"></div>
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleReject(request.id)}
                      disabled={processing[request.id]}
                    >
                      {processing[request.id] === 'rejecting' ? (
                        <>
                          <div className="btn-spinner"></div>
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <X size={18} />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Connected Students Tab */}
      {activeTab === 'connected' && (
        <>
          {connections.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h4>No Connected Students</h4>
              <p>You haven't accepted any connection requests yet</p>
            </div>
          ) : (
            <div className="requests-list">
              {connections.map((connection) => (
                <div key={connection.id} className="request-card connected">
                  <div className="request-info">
                    <div className="student-avatar connected">
                      {connection.student?.name 
                        ? connection.student.name.charAt(0).toUpperCase()
                        : 'S'}
                    </div>
                    <div className="request-details">
                      <div className="student-name">
                        {connection.student?.name || 'Unknown Student'}
                      </div>
                      <div className="request-meta">
                        <Check size={14} />
                        <span>Connected {formatDate(connection.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="connection-badge">
                    <Check size={16} />
                    Connected
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MentorConnectionRequests;

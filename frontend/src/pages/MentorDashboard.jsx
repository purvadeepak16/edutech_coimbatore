import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Users, Calendar, Zap, Plus } from 'lucide-react';
import { getDashboardStats, getPriorityTickets, getUpcomingMeets } from '../services/mentorApi';
import MentorConnectionRequests from '../components/MentorConnectionRequests';
import './MentorDashboard.css';

const MentorDashboard = () => {
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ticketsRes] = await Promise.all([
                getDashboardStats(),
                getPriorityTickets()
            ]);
            setStats(statsRes.stats);
            setTickets(ticketsRes.tickets || []);
            // Availability would come from user profile (not implemented yet)
            setIsAvailable(false);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async () => {
        try {
            setToggling(true);
            // TODO: Implement availability toggle endpoint
            // const result = await toggleAvailability(!isAvailable);
            setIsAvailable(!isAvailable);
        } catch (error) {
            console.error('Failed to toggle availability:', error);
        } finally {
            setToggling(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'status-new';
            case 'In Progress': return 'status-progress';
            case 'Resolved': return 'status-resolved';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="mentor-dashboard">
                <div className="loading-state">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="mentor-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>Mentor Dashboard</h1>
                    <p className="subtitle">Overview of your mentorship activity</p>
                </div>
                
                {/* Quick Actions */}
                <div className="quick-actions">
                    <button 
                        className={`availability-toggle ${isAvailable ? 'active' : ''}`}
                        onClick={handleToggleAvailability}
                        disabled={toggling}
                    >
                        <Zap size={18} />
                        <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                        <div className={`toggle-indicator ${isAvailable ? 'on' : 'off'}`}></div>
                    </button>
                    
                    <button className="btn-create-meet">
                        <Plus size={18} />
                        Create Meet
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card new">
                    <div className="card-icon">
                        <Clock size={24} />
                    </div>
                    <div className="card-content">
                        <div className="card-value">{stats?.newTickets || 0}</div>
                        <div className="card-label">New Tickets</div>
                    </div>
                </div>

                <div className="summary-card active">
                    <div className="card-icon">
                        <CheckCircle size={24} />
                    </div>
                    <div className="card-content">
                        <div className="card-value">{stats?.activeTickets || 0}</div>
                        <div className="card-label">Active Tickets</div>
                    </div>
                </div>

                <div className="summary-card meets">
                    <div className="card-icon">
                        <Users size={24} />
                    </div>
                    <div className="card-content">
                        <div className="card-value">{stats?.meetsToday || 0}</div>
                        <div className="card-label">Meets Today</div>
                    </div>
                </div>

                <div className="summary-card week">
                    <div className="card-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="card-content">
                        <div className="card-value">{stats?.meetsThisWeek || 0}</div>
                        <div className="card-label">Meets This Week</div>
                    </div>
                </div>
            </div>

            {/* Priority Tickets Section */}
            <div className="priority-section">
                <div className="section-header">
                    <h2>Priority Tickets</h2>
                    <p className="section-subtitle">Requires your attention (max 5 active per student)</p>
                </div>

                {tickets.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} />
                        <p>No pending tickets</p>
                        <span>All caught up! Students will appear here when they need help.</span>
                    </div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="ticket-card">
                                <div className="ticket-header">
                                    <div className="student-info">
                                        <div className="student-avatar">
                                            {ticket.studentName.charAt(0)}
                                        </div>
                                        <div className="student-details">
                                            <div className="student-name">{ticket.studentName}</div>
                                            <div className="ticket-meta">
                                                <span className="subject">{ticket.subject}</span>
                                                <span className="separator">•</span>
                                                <span className="topic">{ticket.topic}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="ticket-status">
                                        <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="ticket-footer">
                                    <div className="time-pending">
                                        <Clock size={14} />
                                        <span>Pending for {ticket.timePending}</span>
                                    </div>
                                    
                                    <button className="btn-view-ticket">
                                        View Ticket →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Student Connection Requests Section */}
            <MentorConnectionRequests />

            {/* Info Banner */}
            <div className="info-banner">
                <div className="banner-icon">💡</div>
                <div className="banner-content">
                    <strong>Note:</strong> Each student can have up to 5 active tickets at a time. 
                    Navigate to tickets to open, reply, or resolve them.
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;

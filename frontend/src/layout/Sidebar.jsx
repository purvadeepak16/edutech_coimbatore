import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    Flame,
    Calendar,
    Brain,
    Network,
    Sparkles,
    Target,
    ClipboardCheck,
    Heart,
    Trophy,
    Clock,
    UserCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const { logout, currentUser, userData } = useAuth();
    const [error, setError] = useState('');

    const isActive = (path) => {
        return location.pathname === path;
    };

    async function handleLogout() {
        setError('');
        try {
            await logout();
        } catch (err) {
            setError('Failed to log out');
            console.error(err);
        }
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <h2>StudySync</h2>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li className={isActive('/dashboard') ? 'active' : ''}>
                        <Link to="/dashboard">
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                    </li>
                    <li className={isActive('/syllabus') ? 'active' : ''}>
                        <Link to="/syllabus">
                            <BookOpen size={20} />
                            <span>Syllabus</span>
                        </Link>
                    </li>
                    <li className={isActive('/study-plan') ? 'active' : ''}>
                        <Link to="/study-plan">
                            <Calendar size={20} />
                            <span>Study Plan</span>
                        </Link>
                    </li>
                    <li className={isActive('/learning-modes') ? 'active' : ''}>
                        <Link to="/learning-modes">
                            <Brain size={20} />
                            <span>Learning Modes</span>
                        </Link>
                    </li>
                    <li className={isActive('/mindmap') ? 'active' : ''}>
                        <Link to="/mindmap">
                            <Network size={20} />
                            <span>Mind Map</span>
                        </Link>
                    </li>
                    <li className={isActive('/active-session') ? 'active' : ''}>
                        <Link to="/active-session">
                            <Target size={20} />
                            <span>Active Session</span>
                        </Link>
                    </li>
                    <li className={isActive('/ask-ai') ? 'active' : ''}>
                        <Link to="/ask-ai">
                            <Sparkles size={20} />
                            <span>Ask AI</span>
                        </Link>
                    </li>
                    <li className={isActive('/mastery-score') ? 'active' : ''}>
                        <Link to="/mastery-score">
                            <Target size={20} />
                            <span>Mastery Score</span>
                        </Link>
                    </li>
                    <li className={isActive('/assessments') ? 'active' : ''}>
                        <Link to="/assessments">
                            <ClipboardCheck size={20} />
                            <span>Assessments</span>
                        </Link>
                    </li>
                    <li className={isActive('/schedule') ? 'active' : ''}>
                        <Link to="/schedule">
                            <Calendar size={20} />
                            <span>Schedule</span>
                        </Link>
                    </li>
                    <li className={isActive('/parent-view') ? 'active' : ''}>
                        <Link to="/parent-view">
                            <UserCheck size={20} />
                            <span>Parent View</span>
                        </Link>
                    </li>
                    <li className={isActive('/wellness') ? 'active' : ''}>
                        <Link to="/wellness">
                            <Heart size={20} />
                            <span>Wellness</span>
                        </Link>
                    </li>
                    <li className={isActive('/achievements') ? 'active' : ''}>
                        <Link to="/achievements">
                            <Trophy size={20} />
                            <span>Achievements</span>
                        </Link>
                    </li>
                    <li className={isActive('/groups') ? 'active' : ''}>
                        <Link to="/groups">
                            <Users size={20} />
                            <span>Study Groups</span>
                        </Link>
                    </li>
                    <li className={isActive('/exam-countdown') ? 'active' : ''}>
                        <Link to="/exam-countdown">
                            <Clock size={20} />
                            <span>Exam Countdown</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/settings">
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="profile-card">
                    <div className="profile-info">
                        <div className="avatar">
                            {userData?.userName ? userData.userName[0].toUpperCase() : (currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U')}
                        </div>
                        <div className="details">
                            <span className="name">{userData?.userName || currentUser?.displayName || 'User'}</span>
                            <span className="mastery">{userData?.userRole || 'Student'}</span>
                        </div>
                    </div>
                    <div className="streak">
                        <Flame size={16} fill="#F59E0B" color="#F59E0B" />
                        <span>17 days</span>
                    </div>
                </div>

                {error && <div className="logout-error">{error}</div>}
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
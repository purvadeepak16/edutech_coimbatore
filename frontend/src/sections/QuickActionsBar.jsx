import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, MessageSquare, Settings } from 'lucide-react';
import './QuickActionsBar.css';

const QuickActionsBar = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsVisible(window.innerWidth <= 768);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="quick-actions-bar">
            <button className="action-item active">
                <BookOpen size={20} />
                <span>Learn</span>
            </button>
            <button className="action-item">
                <Calendar size={20} />
                <span>Plan</span>
            </button>
            <button className="action-item">
                <MessageSquare size={20} />
                <span>Chat</span>
            </button>
            <button className="action-item">
                <Settings size={20} />
                <span>Settings</span>
            </button>
        </div>
    );
};

export default QuickActionsBar;

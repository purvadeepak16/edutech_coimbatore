import React from 'react';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
            <Sidebar />
            <main className="main-content">
                <header className="mobile-header">
                    {/* Placeholder for Mobile Header */}
                    <div className="logo">StudySync</div>
                    <div className="mobile-menu-btn">☰</div>
                </header>
                <div className="content-scrollable">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

import React from 'react';
import StudyGroupsSection from '../sections/StudyGroupsSection';
import studyGroupImg from '../assets/study-group.png';
import './StudyGroupsPage.css';

const StudyGroupsPage = () => {
    return (
        <div className="study-groups-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1>👥 Study Groups</h1>
                        <p>Collaborate with peers, share knowledge, and stay motivated together</p>
                    </div>
                    <img src={studyGroupImg} alt="Study Group" className="header-illustration" />
                </div>
            </div>
            <StudyGroupsSection />
        </div>
    );
};

export default StudyGroupsPage;

import React from 'react';
import { Users, Plus, Compass, Video } from 'lucide-react';
import './StudyGroupsSection.css';

const GroupCard = ({ name, members, status, latestMsg, initials, color, accentColor, consistency }) => (
    <div className="group-card" style={{ backgroundColor: color }}>
        <div className="group-header">
            <div className="group-avatar" style={{ backgroundColor: accentColor }}>
                {initials}
            </div>
            <div className="group-info">
                <h4>{name}</h4>
                <div className="group-meta">
                    <span className="member-count"><Users size={12} /> {members} members</span>
                    <span className="consistency-score" title="Group Consistency Score">🔥 {consistency}%</span>
                </div>
            </div>
        </div>

        <div className="group-status">
            <span className="dot-pulse"></span> {status}
        </div>

        <div className="latest-msg">
            "{latestMsg}"
        </div>

        <div className="group-actions">
            <button className="join-btn">View Group</button>
            <button className="meet-btn"><Video size={14} /> Start Meet</button>
        </div>
    </div>
);

const StudyGroupsSection = () => {
    return (
        <section className="study-groups-section">
            <div className="groups-section-header">
                <h2>👥 Your Study Groups</h2>
                <div className="header-actions">
                    <button className="btn-create"><Plus size={16} /> Create</button>
                    <button className="btn-discover"><Compass size={16} /> Discover</button>
                </div>
            </div>

            <div className="groups-grid">
                <GroupCard
                    name="NEET Biology 2025"
                    members="12"
                    status="2 studying now"
                    latestMsg="Raj asked: Photosynthesis?"
                    initials="NB"
                    color="var(--color-soft-teal)"
                    accentColor="#7AC5DA"
                    consistency="92"
                />
                <GroupCard
                    name="JEE Physics"
                    members="8"
                    status="5 studying now"
                    latestMsg="New mock test link shared"
                    initials="JP"
                    color="var(--color-soft-purple)"
                    accentColor="#D8B4FE"
                    consistency="85"
                />
            </div>
        </section>
    );
};

export default StudyGroupsSection;

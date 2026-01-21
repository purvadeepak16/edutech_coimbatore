import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SchedulePreview.css';

const API_BASE_URL = 'http://localhost:5000/api';

function SchedulePreview() {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchSchedule();
    }
  }, [currentUser]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/schedule/${currentUser.uid}`);
      const data = await response.json();
      if (data.success && data.schedule) {
        setSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!schedule || !schedule.schedule) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="schedule-preview">
      <div className="schedule-preview-header" onClick={() => setCollapsed(!collapsed)}>
        <div>
          <h3>📅 Your Study Schedule</h3>
          <p>
            {schedule.totalDays} days • {schedule.totalTopics} topics • 
            {formatDate(schedule.startDate)} to {formatDate(schedule.endDate)}
          </p>
        </div>
        <button className="collapse-btn">
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="schedule-timeline-preview">
            {schedule.schedule.slice(0, 7).map((day) => {
              const isToday = day.date === today;
              const isPast = day.date < today;
              const isSelected = selectedDay?.date === day.date;

              return (
                <div
                  key={day.date}
                  className={`schedule-day-card ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                >
                  <div className="day-header">
                    <span className="day-number">Day {day.day}</span>
                    <span className="day-date">{formatDate(day.date)}</span>
                  </div>
                  <div className="day-topics">
                    {day.topicDetails && day.topicDetails.length > 0 ? (
                      <>
                        <div className="topic-list">
                          {day.topicDetails.slice(0, 2).map((topic, idx) => (
                            <div key={idx} className="topic-mini">
                              • {topic.title}
                            </div>
                          ))}
                        </div>
                        {day.topicDetails.length > 2 && (
                          <div className="more-topics">
                            +{day.topicDetails.length - 2} more
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="topic-count-badge">
                        {day.topicCount} topics
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {schedule.schedule.length > 7 && (
              <div className="more-days-indicator">
                +{schedule.schedule.length - 7} more days
              </div>
            )}
          </div>

          {selectedDay && (
            <div className="selected-day-details">
              <div className="selected-day-header">
                <div>
                  <div className="selected-day-title">Day {selectedDay.day}</div>
                  <div className="selected-day-date">{formatDate(selectedDay.date)}</div>
                </div>
                <span className="topic-count-badge">{selectedDay.topicCount} topics</span>
              </div>
              <div className="selected-day-topics">
                {selectedDay.topicDetails?.map((topic, idx) => (
                  <div key={topic.id || idx} className="selected-topic-item">
                    <div className="selected-topic-title">{topic.title}</div>
                    <div className="selected-topic-meta">
                      {topic.unitName && <span className="unit-chip">{topic.unitName}</span>}
                      {topic.difficulty && <span className={`difficulty-chip diff-${topic.difficulty}`}>{topic.difficulty}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SchedulePreview;

import { useState } from 'react';
import './ConfirmedScheduleDisplay.css';

function ConfirmedScheduleDisplay({ schedule, syllabus }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} to ${endDate.toLocaleDateString('en-US', options)}`;
  };

  if (!schedule || !schedule.schedule) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const cardsPerRow = 5;
  const rowsToShow = 2;
  const visibleCards = isExpanded ? schedule.schedule.length : cardsPerRow * rowsToShow;
  const displayedDays = schedule.schedule.slice(0, visibleCards);
  const hasMoreCards = schedule.schedule.length > visibleCards;

  return (
    <div className="confirmed-schedule-display">
      <div className="schedule-title-section">
        <div className="schedule-icon">📅</div>
        <div>
          <h2>Your Study Schedule</h2>
          <p className="schedule-meta">
            {schedule.totalDays} days • {schedule.totalTopics} topics • {formatDateRange(schedule.startDate, schedule.endDate)}
          </p>
        </div>
        <button className="notification-bell" title="Get study reminders">
          🔔
        </button>
      </div>

      <div className="schedule-days-container">
        <div className="schedule-days-scroll">
          {displayedDays.map((day) => {
            const isToday = day.date === today;
            const isPast = day.date < today;
            const isSelected = selectedDay?.date === day.date;

            return (
              <div
                key={day.date}
                className={`schedule-day-card ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDay(isSelected ? null : day)}
              >
                <div className="day-number">Day {day.day}</div>
                <div className="day-date">{formatDate(day.date)}</div>
                
                <div className="day-topics-preview">
                  {day.topicDetails && day.topicDetails.length > 0 ? (
                    day.topicDetails.slice(0, 2).map((topic, idx) => (
                      <div key={idx} className="topic-preview">
                        • {topic.title.length > 25 ? topic.title.substring(0, 25) + '...' : topic.title}
                      </div>
                    ))
                  ) : null}
                  {day.topicCount > 2 && (
                    <div className="more-topics-indicator">
                      +{day.topicCount - 2} more
                    </div>
                  )}
                  {day.topicCount <= 2 && day.topicCount > 0 && day.topicDetails.length === 0 && (
                    <div className="topic-count">{day.topicCount} topics</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isExpanded && hasMoreCards && (
          <button className="expand-schedule-btn" onClick={() => setIsExpanded(true)}>
            <span>Show More Days ({schedule.schedule.length - visibleCards} remaining)</span>
            <span className="expand-icon">▼</span>
          </button>
        )}

        {isExpanded && (
          <button className="expand-schedule-btn" onClick={() => setIsExpanded(false)}>
            <span>Show Less</span>
            <span className="expand-icon">▲</span>
          </button>
        )}
      </div>

      {selectedDay && selectedDay.topicDetails && (
        <div className="selected-day-details">
          <h3>Day {selectedDay.day} - {formatDate(selectedDay.date)}</h3>
          <div className="detailed-topics-list">
            {selectedDay.topicDetails.map((topic, idx) => (
              <div key={idx} className="detailed-topic-item">
                <div className="topic-content">
                  <div className="topic-title">{topic.title}</div>
                  {topic.unitName && <div className="topic-unit">{topic.unitName}</div>}
                </div>
                {topic.difficulty && (
                  <span className={`difficulty-badge ${topic.difficulty}`}>
                    {topic.difficulty}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfirmedScheduleDisplay;

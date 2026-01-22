import { useState } from 'react';
import './ScheduleView.css';

function ScheduleView({ schedule, importantTopics, onClose }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
  };

  const handleDateClick = (scheduleDay) => {
    setSelectedDate(selectedDate?.date === scheduleDay.date ? null : scheduleDay);
  };

  if (!schedule || !schedule.schedule) {
    return null;
  }

  return (
    <div className="schedule-view-container">
      <div className="schedule-header">
        <div>
          <h2>📅 Your Study Schedule</h2>
          <p>From {formatDate(schedule.startDate)} to {formatDate(schedule.endDate)}</p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Schedule Stats */}
      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-value">{schedule.totalDays}</div>
          <div className="stat-label">Study Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{schedule.totalTopics}</div>
          <div className="stat-label">Total Topics</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {Math.ceil(schedule.totalTopics / schedule.totalDays)}
          </div>
          <div className="stat-label">Topics/Day</div>
        </div>
      </div>

      {/* Full Schedule Timeline */}
      <div className="schedule-timeline">
        <h3>Complete Schedule</h3>
        <div className="timeline-scroll">
          {schedule.schedule.map((day) => {
            const isToday = day.date === new Date().toISOString().split('T')[0];
            const isPast = day.date < new Date().toISOString().split('T')[0];
            const isSelected = selectedDate?.date === day.date;

            return (
              <div
                key={day.date}
                className={`timeline-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-header">
                  <div className="day-date">
                    <strong>Day {day.day}</strong>
                    <span>{formatDate(day.date)}</span>
                  </div>
                  <div className="day-badge">
                    {day.topicCount} {day.topicCount === 1 ? 'topic' : 'topics'}
                  </div>
                </div>

                {isSelected && day.topicDetails && (
                  <div className="day-details">
                    <div className="topics-list">
                      {day.topicDetails.map((topic, idx) => (
                        <div key={topic.id || idx} className="topic-item">
                          <span className="topic-title">{topic.title}</span>
                          <div className="topic-meta">
                            {topic.unitName && (
                              <span className="unit-tag">{topic.unitName}</span>
                            )}
                            {topic.difficulty && (
                              <span className={`difficulty-tag diff-${topic.difficulty}`}>
                                {topic.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Topics Section */}
      {importantTopics && importantTopics.length > 0 && (
        <div className="important-topics-section">
          <h3>⭐ Important Topics to Focus On</h3>
          <div className="important-topics-grid">
            {importantTopics.map((item, index) => (
              <div key={index} className="important-topic-card">
                <div className="topic-header">
                  <h4>{item.topic}</h4>
                  <span className={`priority-badge priority-${item.priority}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="topic-unit">{item.unit}</p>
                <p className="topic-reason">{item.reason}</p>
                {item.estimatedHours && (
                  <div className="topic-hours">
                    ⏱️ {item.estimatedHours} hours recommended
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {onClose && (
        <div className="schedule-actions">
          <button className="btn-primary" onClick={onClose}>
            Close Schedule
          </button>
        </div>
      )}
    </div>
  );
}

export default ScheduleView;

import { useState, useMemo } from 'react';
import './ConsolidatedScheduleView.css';

function ConsolidatedScheduleView({ schedulesBySubject }) {
  const [selectedDate, setSelectedDate] = useState(null);

  // Merge all schedules by date, grouping topics by subject
  const consolidatedSchedule = useMemo(() => {
    const dateMap = {};

    // Iterate through each subject's schedule
    Object.entries(schedulesBySubject).forEach(([subject, schedule]) => {
      schedule.forEach(day => {
        if (!dateMap[day.date]) {
          dateMap[day.date] = {
            date: day.date,
            day: day.day,
            topicsBySubject: {},
            totalTopics: 0
          };
        }

        // Add topics grouped by subject
        if (!dateMap[day.date].topicsBySubject[subject]) {
          dateMap[day.date].topicsBySubject[subject] = [];
        }

        dateMap[day.date].topicsBySubject[subject].push(...(day.topicDetails || []));
        dateMap[day.date].totalTopics += (day.topicDetails || []).length;
      });
    });

    // Convert to array and sort by date
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [schedulesBySubject]);

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];
  const startDate = consolidatedSchedule[0]?.date;
  const endDate = consolidatedSchedule[consolidatedSchedule.length - 1]?.date;

  if (consolidatedSchedule.length === 0) {
    return <div className="consolidated-schedule">No schedule data available.</div>;
  }

  return (
    <div className="consolidated-schedule-view">
      <div className="consolidated-header">
        <h2>📚 Complete Study Schedule (All Subjects)</h2>
        <p>From {formatDate(startDate)} to {formatDate(endDate)}</p>
      </div>

      {/* Statistics */}
      <div className="consolidated-stats">
        <div className="stat-card">
          <div className="stat-value">{consolidatedSchedule.length}</div>
          <div className="stat-label">Total Study Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{consolidatedSchedule.reduce((sum, d) => sum + d.totalTopics, 0)}</div>
          <div className="stat-label">Total Topics</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Object.keys(schedulesBySubject).length}</div>
          <div className="stat-label">Subjects</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="consolidated-timeline">
        <h3>Daily Schedule Timeline</h3>
        <div className="timeline-scroll">
          {consolidatedSchedule.map((day) => {
            const isToday = day.date === today;
            const isPast = day.date < today;
            const isSelected = selectedDate === day.date;

            return (
              <div
                key={day.date}
                className={`consolidated-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => setSelectedDate(isSelected ? null : day.date)}
              >
                <div className="day-header">
                  <strong>Day {consolidatedSchedule.indexOf(day) + 1}</strong>
                  <span className="day-date">{formatDate(day.date)}</span>
                  <span className="topic-count">{day.totalTopics}</span>
                </div>

                {/* Show topics by subject when selected */}
                {isSelected && (
                  <div className="day-details">
                    {Object.entries(day.topicsBySubject).map(([subject, topics]) => (
                      <div key={subject} className="subject-group">
                        <h4 className="subject-name">{subject}</h4>
                        <div className="topics-list">
                          {topics.map((topic, idx) => (
                            <div key={topic.id || idx} className="topic-item">
                              <div className="topic-title">{topic.title}</div>
                              <div className="topic-meta">
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
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConsolidatedScheduleView;

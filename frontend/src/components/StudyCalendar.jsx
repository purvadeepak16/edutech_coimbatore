import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import './StudyCalendar.css';

const API_BASE_URL = 'http://localhost:5000/api';

function StudyCalendar({ dailySchedule }) {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [scheduleMap, setScheduleMap] = useState(new Map());
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    // Fetch real schedule if user is logged in
    if (currentUser && !dailySchedule) {
      fetchSchedule();
    } else if (dailySchedule && dailySchedule.schedule) {
      updateScheduleMap(dailySchedule);
    }
  }, [currentUser, dailySchedule]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/schedule/${currentUser.uid}`);
      const data = await response.json();
      if (data.success && data.schedule) {
        updateScheduleMap(data.schedule);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    }
  };

  const updateScheduleMap = (schedule) => {
    const map = new Map();
    schedule.schedule.forEach(day => {
      map.set(day.date, day);
    });
    setScheduleMap(map);
    console.log('📅 Schedule loaded:', schedule);
    console.log('🗓️ Schedule map size:', map.size);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (year, month, day) => {
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create calendar grid
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const dayData = scheduleMap.get(dateStr);
    const hasTopics = !!dayData;
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${hasTopics ? 'has-topics' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => {
          if (hasTopics && dayData) {
            setSelectedDateTasks(dayData);
            setShowTaskModal(true);
          }
        }}
        onMouseEnter={() => {
          if (hasTopics) {
            setToastData(dayData);
            setShowToast(true);
          }
        }}
        onMouseLeave={() => {
          setTimeout(() => {
            setShowToast(false);
            setToastData(null);
          }, 300);
        }}
      >
        <span className="day-number">{day}</span>
        {hasTopics && <span className="topic-indicator">•</span>}
      </div>
    );
  }

  const hoveredDayData = hoveredDate ? scheduleMap.get(hoveredDate) : null;

  return (
    <div className="study-calendar">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">←</button>
        <h3>{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="nav-btn">→</button>
      </div>

      <div className="calendar-weekdays">
        {dayAbbreviations.map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays}
      </div>

      {showToast && toastData && (
        <Toast
          type="schedule"
          persist={true}
          onClose={() => {
            setShowToast(false);
            setToastData(null);
          }}
          message={
            <div>
              <div className="schedule-header">
                <div>
                  <div className="day-info">Day {toastData.day}</div>
                  <div className="date-info">
                    {new Date(toastData.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric',
                      weekday: 'long'
                    })}
                  </div>
                </div>
                <span className="topic-count-badge">
                  {toastData.topicCount} topic{toastData.topicCount !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="topics-list">
                {toastData.topics.map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          }
        />
      )}

      {/* Task Modal */}
      {showTaskModal && selectedDateTasks && (
        <div className="task-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📚 Study Tasks</h3>
                <p>
                  {new Date(selectedDateTasks.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button className="close-modal" onClick={() => setShowTaskModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              {selectedDateTasks.topicDetails && selectedDateTasks.topicDetails.length > 0 ? (
                <div className="tasks-detail-list">
                  {selectedDateTasks.topicDetails.map((topic, idx) => (
                    <div key={topic.id || idx} className="task-detail-item">
                      <div className="task-checkbox">
                        <input type="checkbox" id={`modal-task-${topic.id}`} />
                      </div>
                      <div className="task-detail-content">
                        <label htmlFor={`modal-task-${topic.id}`} className="task-name">
                          {topic.title}
                        </label>
                        <div className="task-detail-meta">
                          {topic.unitName && (
                            <span className="unit-label">{topic.unitName}</span>
                          )}
                          {topic.difficulty && (
                            <span className={`difficulty-label diff-${topic.difficulty}`}>
                              {topic.difficulty}
                            </span>
                          )}
                          {topic.estimatedHours && (
                            <span className="hours-label">⏱️ {topic.estimatedHours}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-details">No detailed tasks available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyCalendar;

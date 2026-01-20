import { useState, useEffect } from 'react';
import Toast from './Toast';
import './StudyCalendar.css';

function StudyCalendar({ dailySchedule }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [scheduleMap, setScheduleMap] = useState(new Map());
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState(null);

  useEffect(() => {
    // Create a map of dates to topics for quick lookup
    if (dailySchedule && dailySchedule.schedule) {
      const map = new Map();
      dailySchedule.schedule.forEach(day => {
        map.set(day.date, day);
      });
      setScheduleMap(map);
      console.log('📅 Schedule loaded:', dailySchedule);
      console.log('🗓️ Schedule map size:', map.size);
      console.log('📌 Sample dates in map:', Array.from(map.keys()).slice(0, 5));
    }
  }, [dailySchedule]);

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
          console.log('🖱️ Clicked date:', dateStr);
          console.log('📊 Day data:', dayData);
          console.log('✅ Has topics:', hasTopics);
        }}
        onMouseEnter={() => {
          console.log('🎯 Hovering over:', dateStr, 'Has topics:', hasTopics);
          if (hasTopics) {
            console.log('🎉 Showing toast for:', dayData);
            setToastData(dayData);
            setShowToast(true);
          }
        }}
        onMouseLeave={() => {
          // Keep toast visible for a moment after mouse leaves
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
              {toastData.units && toastData.units.length > 0 && (
                <div className="units-info">
                  <strong>Units:</strong> {toastData.units.join(', ')}
                </div>
              )}
            </div>
          }
        />
      )}

      {!dailySchedule && (
        <div className="no-schedule">
          <p>No study schedule yet. Upload a syllabus to get started!</p>
        </div>
      )}
    </div>
  );
}

export default StudyCalendar;

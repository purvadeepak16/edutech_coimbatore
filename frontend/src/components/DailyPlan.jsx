import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './DailyPlan.css';

const API_BASE_URL = 'http://localhost:5000/api';

function DailyPlan() {
  const { currentUser, loading: authLoading } = useAuth();
  const [todaysTasks, setTodaysTasks] = useState(null);
  const [fullSchedule, setFullSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchSchedule();
    } else if (!authLoading && !currentUser) {
      setError('User not logged in');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching schedule for user:', currentUser.uid);
      const response = await fetch(`${API_BASE_URL}/syllabus/schedule/${currentUser.uid}`);
      const data = await response.json();
      
      console.log('Schedule API Response:', data);

      if (data.success && data.schedule) {
        console.log('Schedule received:', data.schedule);
        setFullSchedule(data.schedule);
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        console.log('Today date:', today);
        console.log('Available dates:', data.schedule.schedule?.map(d => d.date));
        const todaySchedule = data.schedule.schedule?.find(day => day.date === today);
        console.log('Today schedule found:', todaySchedule);
        setTodaysTasks(todaySchedule || null);
        setSelectedDate(today);
      } else {
        console.log('No schedule or success flag false:', data);
        setError(data.error || 'No schedule found. Upload a syllabus to generate a study plan.');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const daySchedule = fullSchedule?.schedule?.find(day => day.date === date);
    setTodaysTasks(daySchedule || null);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
  };

  const getDateColor = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today) return '#4f46e5';
    if (dateString < today) return '#9ca3af';
    return '#e5e7eb';
  };

  if (loading) {
    return <div className="daily-plan-container"><p>Loading your study plan...</p></div>;
  }

  if (error) {
    return (
      <div className="daily-plan-container error-message">
        <h3>⚠️ Schedule Not Found</h3>
        <p>{error}</p>
        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
          💡 Please upload a PDF of your syllabus to generate your personalized study plan.
        </p>
      </div>
    );
  }

  if (!fullSchedule) {
    return (
      <div className="daily-plan-container">
        <div className="daily-plan-header">
          <h2>📚 Your Daily Study Plan</h2>
          <p>Stay on track with your personalized schedule</p>
        </div>
        <div className="no-schedule-message">
          <p>No schedule available yet. Upload a syllabus to generate your study plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-plan-container">
      <div className="daily-plan-header">
        <h2>📚 Your Daily Study Plan</h2>
        <p>Stay on track with your personalized schedule</p>
      </div>

      {fullSchedule && (
        <div className="schedule-layout">
          {/* Calendar Timeline */}
          <div className="calendar-timeline">
            <h3>Study Schedule Timeline</h3>
            {fullSchedule.schedule && fullSchedule.schedule.length > 0 ? (
              <div className="dates-scroll">
                {fullSchedule.schedule.map(day => (
                  <button
                    key={day.date}
                    className={`date-button ${selectedDate === day.date ? 'active' : ''}`}
                    onClick={() => handleDateChange(day.date)}
                    style={{
                      borderColor: selectedDate === day.date ? '#4f46e5' : '#e5e7eb',
                      backgroundColor: selectedDate === day.date ? '#f3f4f6' : 'white'
                    }}
                  >
                    <div className="date-number">
                      {new Date(day.date + 'T00:00:00').getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(day.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' })}
                    </div>
                    <div className="date-day">Day {day.day}</div>
                    {day.topicCount > 0 && (
                      <div className="topic-count">{day.topicCount} topics</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-schedule-message">
                <p>No schedule available. Upload a syllabus to generate your study plan.</p>
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div className="todays-tasks">
            {todaysTasks ? (
              <>
                <div className="task-header">
                  <h3>{formatDate(selectedDate)}</h3>
                  <span className="topic-badge">{todaysTasks.topicCount} Topics Scheduled</span>
                </div>

                {todaysTasks.topicDetails && todaysTasks.topicDetails.length > 0 ? (
                  <div className="tasks-list">
                    {todaysTasks.topicDetails.map((topic, index) => (
                      <div key={topic.id || index} className="task-item">
                        <div className="task-checkbox">
                          <input type="checkbox" id={`task-${topic.id}`} />
                        </div>
                        <div className="task-content">
                          <label htmlFor={`task-${topic.id}`} className="task-title">
                            {topic.title}
                          </label>
                          <div className="task-meta">
                            <span className="unit-name">{topic.unitName || 'General'}</span>
                            {topic.difficulty && (
                              <span
                                className={`difficulty-badge difficulty-${topic.difficulty}`}
                              >
                                {topic.difficulty}
                              </span>
                            )}
                            {topic.estimatedHours && (
                              <span className="hours-badge">
                                {topic.estimatedHours}h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-tasks">
                    <p>No topics scheduled for this date</p>
                  </div>
                )}
              </>
            ) : (
              <div className="no-tasks">
                <p>No schedule available for the selected date</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {fullSchedule && (
        <div className="schedule-summary">
          <div className="summary-card">
            <div className="summary-value">{fullSchedule.totalDays}</div>
            <div className="summary-label">Study Days</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{fullSchedule.totalTopics}</div>
            <div className="summary-label">Total Topics</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              {Math.ceil(fullSchedule.totalTopics / fullSchedule.totalDays)}
            </div>
            <div className="summary-label">Topics/Day (Avg)</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyPlan;

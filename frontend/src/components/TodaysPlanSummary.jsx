import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './TodaysPlanSummary.css';

const API_BASE_URL = 'http://localhost:5000/api';

function TodaysPlanSummary() {
  const { currentUser } = useAuth();
  const [todaysTasks, setTodaysTasks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchTodaysTasks();
    }
  }, [currentUser]);

  const fetchTodaysTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/all-schedules/${currentUser.uid}`);
      const data = await response.json();

      if (data.success && data.schedulesBySubject) {
        const today = new Date().toISOString().split('T')[0];
        const tasksBySubject = {};

        // Collect all tasks for today from all subjects
        Object.entries(data.schedulesBySubject).forEach(([subject, schedule]) => {
          const todaySchedule = schedule.find(day => day.date === today);
          if (todaySchedule && todaySchedule.topicDetails && todaySchedule.topicDetails.length > 0) {
            tasksBySubject[subject] = todaySchedule.topicDetails;
          }
        });

        if (Object.keys(tasksBySubject).length > 0) {
          setTodaysTasks(tasksBySubject);
        }
      }
    } catch (err) {
      console.error('Failed to load today\'s tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !todaysTasks || Object.keys(todaysTasks).length === 0) {
    return null;
  }

  const totalTasks = Object.values(todaysTasks).reduce((sum, tasks) => sum + tasks.length, 0);

  return (
    <div className="todays-plan-summary">
      <div className="plan-header">
        <h3>📚 Today's Study Plan</h3>
        <span className="task-count">{totalTasks} topics</span>
      </div>
      <div className="plan-tasks-list">
        {Object.entries(todaysTasks).map(([subject, tasks]) => (
          <div key={subject} className="subject-tasks">
            <div className="subject-label">{subject}</div>
            {tasks.slice(0, 3).map((topic, index) => (
              <div key={topic.id || index} className="plan-task-item">
                <div className="task-check">
                  <input type="checkbox" id={`dashboard-task-${topic.id}`} />
                </div>
                <div className="task-info">
                  <label htmlFor={`dashboard-task-${topic.id}`}>{topic.title}</label>
                  {topic.difficulty && (
                    <span className={`diff-badge diff-${topic.difficulty}`}>
                      {topic.difficulty}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {tasks.length > 3 && (
              <div className="more-tasks">
                +{tasks.length - 3} more tasks
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodaysPlanSummary;

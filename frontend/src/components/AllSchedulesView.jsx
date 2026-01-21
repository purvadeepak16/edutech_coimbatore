import { useEffect, useState } from 'react';
import ScheduleView from './ScheduleView';
import ConsolidatedScheduleView from './ConsolidatedScheduleView';

const API_BASE_URL = 'http://localhost:5000/api';

function AllSchedulesView({ userId }) {
  const [schedulesBySubject, setSchedulesBySubject] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/syllabus/all-schedules/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setSchedulesBySubject(data.schedulesBySubject || {});
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading all schedules...</div>;

  return (
    <div className="all-schedules-view">
      {/* Show consolidated schedule first if multiple subjects */}
      {Object.keys(schedulesBySubject).length > 0 && (
        <ConsolidatedScheduleView schedulesBySubject={schedulesBySubject} />
      )}

      {/* Show individual subject schedules */}
      {Object.keys(schedulesBySubject).length === 0 && <div>No schedules found.</div>}
      {Object.entries(schedulesBySubject).map(([subject, schedule]) => (
        <div key={subject} style={{ marginTop: '3rem', marginBottom: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
          <h2 style={{ marginBottom: '1rem' }}>Subject: <strong>{subject}</strong></h2>
          <ScheduleView schedule={{ schedule, totalDays: schedule.length, startDate: schedule[0]?.date, endDate: schedule[schedule.length-1]?.date, totalTopics: schedule.reduce((sum, day) => sum + (day.topicCount || 0), 0) }} />
        </div>
      ))}
    </div>
  );
}

export default AllSchedulesView;

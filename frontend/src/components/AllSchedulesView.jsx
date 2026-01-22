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

      {/* Show message if no schedules */}
      {Object.keys(schedulesBySubject).length === 0 && <div>No schedules found.</div>}
    </div>
  );
}

export default AllSchedulesView;

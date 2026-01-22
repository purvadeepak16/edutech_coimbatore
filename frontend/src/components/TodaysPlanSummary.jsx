import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Headphones, BookOpen, FileText } from 'lucide-react';
import './TodaysPlanSummary.css';

const API_BASE_URL = 'http://localhost:5000/api';

function TodaysPlanSummary() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [todaysTasks, setTodaysTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState({});
  const [playingAudioKey, setPlayingAudioKey] = useState(null);
  const [audioInstance, setAudioInstance] = useState(null);

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

  const handleAudioLearning = async (subject, topic) => {
    const topicKey = `${subject}-${topic.id}`;
    
    // If audio is already playing for this topic, pause it
    if (playingAudioKey === topicKey && audioInstance && !audioInstance.paused) {
      audioInstance.pause();
      setPlayingAudioKey(null); // Keep audioInstance for resume
      return;
    }

    // If audio is paused for this topic, resume it
    if (playingAudioKey === topicKey && audioInstance && audioInstance.paused) {
      audioInstance.play();
      setPlayingAudioKey(topicKey);
      return;
    }

    // Stop any other currently playing audio
    if (audioInstance) {
      audioInstance.pause();
      setAudioInstance(null);
    }

    setGeneratingAudio(prev => ({ ...prev, [topicKey]: true }));
    
    try {
      const token = await currentUser.getIdToken();
      const taskText = `${subject}: ${topic.title}`;
      const today = new Date().toISOString().split('T')[0];
      
      const ttsRes = await fetch(`${API_BASE_URL}/tts/structured-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: taskText,
          userId: currentUser.uid,
          date: today,
          useCache: true
        })
      });

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        // Play audio
        if (ttsData.audioUrl) {
          const audio = new Audio(ttsData.audioUrl);
          audio.play();
          setAudioInstance(audio);
          setPlayingAudioKey(topicKey);

          // Reset when audio ends
          audio.onended = () => {
            setPlayingAudioKey(null);
            setAudioInstance(null);
          };
        }
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('Failed to generate audio');
    } finally {
      setGeneratingAudio(prev => ({ ...prev, [topicKey]: false }));
    }
  };

  const handleReadingNotes = (subject, topic) => {
    const tasks = [{ subject, title: topic.title, difficulty: topic.difficulty, id: topic.id }];
    navigate('/study-reader', { state: { todaysTasks: tasks } });
  };

  const handleMindMap = (subject, topic) => {
    const combinedTopic = `${subject}: ${topic.title}`;
    navigate(`/visual-map?topic=${encodeURIComponent(combinedTopic)}`);
  };

  const handleAssessment = (subject, topic) => {
    const tasks = [{ subject, title: topic.title, difficulty: topic.difficulty, id: topic.id }];
    navigate('/assessments', { state: { todaysTasks: tasks } });
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
            {tasks.slice(0, 3).map((topic, index) => {
              const topicKey = `${subject}-${topic.id}`;
              return (
                <div key={topic.id || index} className="plan-task-item-wrapper">
                  <div className="plan-task-item">
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
                  <div className="topic-action-buttons">
                    <button 
                      className={`topic-action-btn audio-btn-small ${playingAudioKey === topicKey ? 'playing' : ''}`}
                      onClick={() => handleAudioLearning(subject, topic)}
                      disabled={generatingAudio[topicKey]}
                      title={playingAudioKey === topicKey && audioInstance && !audioInstance.paused ? "Click to pause audio" : "Audio Learning"}
                    >
                      <Headphones size={16} />
                      <span>
                        {generatingAudio[topicKey] ? 'Generating...' : (playingAudioKey === topicKey && audioInstance && !audioInstance.paused ? 'Pause' : (playingAudioKey === topicKey && audioInstance && audioInstance.paused ? 'Resume' : 'Audio'))}
                      </span>
                    </button>
                    <button 
                      className="topic-action-btn reading-btn-small"
                      onClick={() => handleReadingNotes(subject, topic)}
                      title="Reading Notes"
                    >
                      <BookOpen size={16} />
                      <span>Notes</span>
                    </button>
                    <button 
                      className="topic-action-btn mindmap-btn-small"
                      onClick={() => handleMindMap(subject, topic)}
                      title="Mind Map"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m-6-6h6m6 0h6"/>
                      </svg>
                      <span>Map</span>
                    </button>
                    <button 
                      className="topic-action-btn assessment-btn-small"
                      onClick={() => handleAssessment(subject, topic)}
                      title="Assessment"
                    >
                      <FileText size={16} />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
              );
            })}
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

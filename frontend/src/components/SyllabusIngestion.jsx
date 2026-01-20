import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SyllabusIngestion.css';
import SyllabusEditor from './SyllabusEditor';

const API_BASE_URL = 'http://localhost:5000/api';

function SyllabusIngestion() {
  const { currentUser } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [importantPoints, setImportantPoints] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // PDF Mode State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSubject, setPdfSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Manual Mode State
  const [manualSubject, setManualSubject] = useState('');
  const [manualLevel, setManualLevel] = useState('');

  // Exam Mode State
  const [examType, setExamType] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [availableExams, setAvailableExams] = useState([]);

  const handleModeSelect = async (mode) => {
    setSelectedMode(mode);
    setError(null);
    setSyllabus(null);
    setWarnings(null);
    setStudyPlan(null);
    setImportantPoints(null);
    setRecommendations(null);

    // Load available exams for exam mode
    if (mode === 'exam') {
      try {
        const response = await fetch(`${API_BASE_URL}/syllabus/exam/list`);
        const data = await response.json();
        if (data.success) {
          setAvailableExams(data.exams);
        }
      } catch (err) {
        setError('Failed to load available exams');
      }
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please provide both start and end dates');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    if (!currentUser) {
      setError('Please log in to upload syllabus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('subject', pdfSubject);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('userId', currentUser.uid);

      const response = await fetch(`${API_BASE_URL}/syllabus/pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process PDF');
      }

      setSyllabus(data.syllabus);
      setWarnings(data.warnings);
      setStudyPlan(data.dailySchedule || data.studyPlan);
      setImportantPoints(data.importantPoints);
      setRecommendations(data.recommendations);
      
      // Save to localStorage as backup for immediate calendar display
      if (data.dailySchedule) {
        localStorage.setItem('dailySchedule', JSON.stringify(data.dailySchedule));
        console.log('💾 Saved schedule to localStorage:', data.dailySchedule);
      }
      
      // Show success message with study plan info
      if (data.importantPoints && data.importantPoints.length > 0) {
        console.log(`✅ Study plan generated with ${data.importantPoints.length} important points highlighted`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGenerate = async () => {
    if (!manualSubject || !manualLevel) {
      setError('Please provide both subject and level');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: manualSubject,
          level: manualLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate syllabus');
      }

      setSyllabus(data.syllabus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExamLoad = async () => {
    if (!examType || !examSubject) {
      setError('Please select both exam type and subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examType,
          subject: examSubject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load exam syllabus');
      }

      setSyllabus(data.syllabus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (editedSyllabus) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/syllabus/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syllabus: editedSyllabus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm syllabus');
      }

      alert('Syllabus confirmed and saved successfully!');
      // Reset state
      setSelectedMode(null);
      setSyllabus(null);
      setPdfFile(null);
      setPdfSubject('');
      setStartDate('');
      setEndDate('');
      setManualSubject('');
      setManualLevel('');
      setExamType('');
      setExamSubject('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSyllabus(null);
    setWarnings(null);
    setStudyPlan(null);
    setImportantPoints(null);
    setRecommendations(null);
  };

  if (syllabus) {
    return (
      <div className="syllabus-ingestion">
        {/* Display Study Plan and Important Points */}
        {(studyPlan || importantPoints) && (
          <div className="study-plan-section">
            <h2>📋 Daily Study Schedule</h2>
            
            {studyPlan && studyPlan.schedule && (
              <div className="daily-schedule">
                <h3>Day-by-Day Plan ({studyPlan.totalDays} days • {studyPlan.totalTopics} topics)</h3>
                <p className="schedule-dates">From {studyPlan.startDate} to {studyPlan.endDate}</p>
                <div className="schedule-grid">
                  {studyPlan.schedule.slice(0, 6).map((day) => (
                    <div key={day.day} className="day-card">
                      <div className="day-header">Day {day.day}</div>
                      <div className="day-date">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="day-topics-count">{day.topicCount} topic{day.topicCount !== 1 ? 's' : ''}</div>
                      <div className="day-topics">
                        {day.topics.slice(0, 2).map((topic, idx) => (
                          <div key={idx} className="topic-item">• {topic}</div>
                        ))}
                        {day.topics.length > 2 && (
                          <div className="more-topics">+{day.topics.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {studyPlan.schedule.length > 6 && (
                  <p className="more-days">+ {studyPlan.schedule.length - 6} more days in your plan</p>
                )}
              </div>
            )}

            {importantPoints && importantPoints.length > 0 && (
              <div className="important-points">
                <h3>⭐ Important Points Highlighted</h3>
                <div className="points-list">
                  {importantPoints.map((point, idx) => (
                    <div 
                      key={idx} 
                      className={`point-card priority-${point.priority}`}
                    >
                      <div className="point-header">
                        <span className="point-topic">{point.topic}</span>
                        <span className={`priority-badge ${point.priority}`}>
                          {point.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="point-unit">Unit: {point.unit}</div>
                      <div className="point-reason">{point.reason}</div>
                      <div className="point-meta">
                        {point.estimatedHours && (
                          <span className="meta-item">⏱️ {point.estimatedHours}h</span>
                        )}
                        {point.isPrerequisite && (
                          <span className="meta-item prerequisite">📚 Prerequisite</span>
                        )}
                        {point.requiresExtraPractice && (
                          <span className="meta-item practice">💪 Extra Practice Needed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations && recommendations.length > 0 && (
              <div className="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                  {recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <SyllabusEditor
          syllabus={syllabus}
          warnings={warnings}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="syllabus-ingestion">
      <h1>Syllabus Ingestion</h1>
      <p className="subtitle">Select a mode to create your syllabus (you can switch anytime)</p>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="mode-selector">
        <button
          className={`mode-card ${selectedMode === 'pdf' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('pdf')}
        >
          <div className="mode-icon">📄</div>
          <h3>PDF Upload</h3>
          <p>Upload your syllabus PDF for automatic extraction</p>
        </button>

        <button
          className={`mode-card ${selectedMode === 'manual' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('manual')}
        >
          <div className="mode-icon">✏️</div>
          <h3>Manual Input</h3>
          <p>Let AI propose topics based on subject and level</p>
        </button>

        <button
          className={`mode-card ${selectedMode === 'exam' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('exam')}
        >
          <div className="mode-icon">🎓</div>
          <h3>Exam-Based</h3>
          <p>Load official syllabus for JEE, GATE, Olympiad</p>
        </button>
      </div>

      {selectedMode === 'pdf' && (
        <div className="mode-form">
          <h2>PDF Syllabus Upload</h2>
          <div className="form-group">
            <label>Subject Name (Optional)</label>
            <input
              type="text"
              value={pdfSubject}
              onChange={(e) => setPdfSubject(e.target.value)}
              placeholder="e.g., Physics, Mathematics"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Upload PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            {pdfFile && <p className="file-name">Selected: {pdfFile.name}</p>}
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handlePdfUpload}
              disabled={loading || !pdfFile}
            >
              {loading ? 'Processing...' : 'Upload & Extract'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setSelectedMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedMode === 'manual' && (
        <div className="mode-form">
          <h2>Manual Syllabus Input</h2>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={manualSubject}
              onChange={(e) => setManualSubject(e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>
          <div className="form-group">
            <label>Level</label>
            <select
              value={manualLevel}
              onChange={(e) => setManualLevel(e.target.value)}
            >
              <option value="">Select level</option>
              <option value="high-school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleManualGenerate}
              disabled={loading || !manualSubject || !manualLevel}
            >
              {loading ? 'Generating...' : 'Generate Proposal'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setSelectedMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedMode === 'exam' && (
        <div className="mode-form">
          <h2>Exam-Based Syllabus</h2>
          <div className="form-group">
            <label>Select Exam</label>
            <select
              value={`${examType}_${examSubject}`}
              onChange={(e) => {
                const [type, subj] = e.target.value.split('_');
                setExamType(type);
                setExamSubject(subj);
              }}
            >
              <option value="">Choose an exam</option>
              {availableExams.map((exam) => (
                <option
                  key={`${exam.examType}_${exam.subject}`}
                  value={`${exam.examType}_${exam.subject}`}
                >
                  {exam.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleExamLoad}
              disabled={loading || !examType || !examSubject}
            >
              {loading ? 'Loading...' : 'Load Syllabus'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setSelectedMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyllabusIngestion;

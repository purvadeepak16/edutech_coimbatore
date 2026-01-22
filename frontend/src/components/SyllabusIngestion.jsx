import { useState, useEffect } from 'react';
import './SyllabusIngestion.css';
import SyllabusEditor from './SyllabusEditor';
import ScheduleView from './ScheduleView';
import ConfirmedScheduleDisplay from './ConfirmedScheduleDisplay';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

function SyllabusIngestion() {
  const { currentUser, userData } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [importantTopics, setImportantTopics] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  // PDF Mode State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSubject, setPdfSubject] = useState('');
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  // Manual Mode State
  const [manualSubject, setManualSubject] = useState('');
  const [manualLevel, setManualLevel] = useState('');

  // Exam Mode State
  const [examType, setExamType] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [availableExams, setAvailableExams] = useState([]);

  // Load stored syllabus + schedule when the page opens
  useEffect(() => {
    const loadExisting = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/syllabus/data/${currentUser.uid}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok && !data.success) return; // Nothing saved yet
        if (data.syllabus) {
          setSyllabus(data.syllabus);
          setImportantTopics(data.syllabus.importantTopics || []);
        }
        if (data.schedule) {
          setGeneratedSchedule(data.schedule);
          setShowSchedule(true);
        }
      } catch (err) {
        console.error('Failed to load saved syllabus:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExisting();
  }, [currentUser]);

  const handleModeSelect = async (mode) => {
    setSelectedMode(mode);
    setError(null);
    setSyllabus(null);
    setWarnings(null);

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

    if (!currentUser) {
      setError('You must be logged in to upload a syllabus');
      return;
    }

    if (!pdfStartDate || !pdfEndDate) {
      setError('Please provide both start and end dates for your study plan');
      return;
    }

    if (new Date(pdfEndDate) <= new Date(pdfStartDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('subject', pdfSubject);
      formData.append('userId', currentUser.uid);
      formData.append('startDate', pdfStartDate);
      formData.append('endDate', pdfEndDate);

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

    if (!currentUser) {
      setError('You must be logged in to generate a syllabus');
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
          userId: currentUser.uid,
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

    if (!currentUser) {
      setError('You must be logged in to load a syllabus');
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
          userId: currentUser.uid,
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
    if (!currentUser) {
      setError('You must be logged in to save a syllabus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get dates from state or from syllabus metadata
      const startDate = pdfStartDate || editedSyllabus.metadata?.startDate;
      const endDate = pdfEndDate || editedSyllabus.metadata?.endDate;

      const response = await fetch(`${API_BASE_URL}/syllabus/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syllabus: editedSyllabus,
          userId: currentUser.uid,
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm syllabus');
      }

      // Fetch the generated schedule and important topics
      if (data.scheduleGenerated) {
        try {
          const scheduleResponse = await fetch(`${API_BASE_URL}/syllabus/schedule/${currentUser.uid}`);
          const scheduleData = await scheduleResponse.json();
          if (scheduleData.success) {
            setGeneratedSchedule(scheduleData.schedule);
          }
        } catch (err) {
          console.error('Failed to fetch schedule:', err);
        }
      }

      // Extract important topics from the data if available
      if (data.importantPoints) {
        setImportantTopics(data.importantPoints);
      }

      // Store the confirmed syllabus
      setSyllabus(editedSyllabus);

      // Show the schedule below the upload options
      console.log('✅ Syllabus confirmed and saved with schedule');
      setShowSchedule(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSyllabus(null);
    setWarnings(null);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
    setGeneratedSchedule(null);
    setImportantTopics(null);
    // Reset all state
    setSelectedMode(null);
    setPdfFile(null);
    setPdfSubject('');
    setPdfStartDate('');
    setPdfEndDate('');
    setManualSubject('');
    setManualLevel('');
    setExamType('');
    setExamSubject('');
  };

  // If we have a confirmed syllabus + schedule, show ingestion form + confirmed summary + schedule
  if (generatedSchedule && showSchedule) {
    return (
      <div className="syllabus-ingestion">
        {/* Show ingestion options at top */}
        <h1>Syllabus Ingestion</h1>
        <p className="subtitle">Select a mode to upload a new syllabus (you can switch anytime)</p>

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

        {/* Show confirmed syllabus summary */}
        <div className="confirmed-schedule-section">
          <ConfirmedScheduleDisplay
            schedule={generatedSchedule}
            syllabus={syllabus}
          />
        </div>
      </div>
    );
  }

  // If syllabus loaded but not confirmed yet (editing mode), show editor
  if (syllabus && !showSchedule) {
    return (
      <div className="syllabus-ingestion">
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
              <label>Study Start Date</label>
              <input
                type="date"
                value={pdfStartDate}
                onChange={(e) => setPdfStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Study End Date</label>
              <input
                type="date"
                value={pdfEndDate}
                onChange={(e) => setPdfEndDate(e.target.value)}
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
              disabled={loading || !pdfFile || !pdfStartDate || !pdfEndDate}
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

import { useState } from 'react';
import './SyllabusIngestion.css';
import SyllabusEditor from './SyllabusEditor';

const API_BASE_URL = 'http://localhost:5000/api';

function SyllabusIngestion() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [warnings, setWarnings] = useState(null);

  // PDF Mode State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSubject, setPdfSubject] = useState('');

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

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('subject', pdfSubject);

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
  };

  if (syllabus) {
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

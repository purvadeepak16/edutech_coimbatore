import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AssessmentTestPage.css';

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

const generateQuestionsForSubject = (level, subjects, count) => {
  const subject = subjects && subjects.length > 0 ? subjects[0] : 'General Knowledge';

  const templates = [
    ({s}) => ({
      question: `What is ${s}?`,
      correct: `${s} is the study of its core concepts and principles.`,
      distractors: [`A software tool`, `A biological term`, `A mathematical constant`] 
    }),
    ({s}) => ({
      question: `Which of these is a common category or type in ${s}?`,
      correct: `Supervised ${s}`,
      distractors: [`Photosynthesis`, `Quadratic equations`, `Cell organelle`]
    }),
    ({s}) => ({
      question: `What would you expect to learn first when studying ${s}?`,
      correct: `Fundamental definitions and simple examples of ${s}`,
      distractors: [`Advanced research papers`, `Unrelated history`, `Cooking techniques`]
    }),
    ({s}) => ({
      question: `A primary application of ${s} is:`,
      correct: `Solving practical problems using ${s} techniques`,
      distractors: [`Painting`, `Carpentry`, `Sewing`]
    }),
    ({s}) => ({
      question: `Which phrase best describes the goal of ${s}?`,
      correct: `To model, understand, or solve problems using ${s} methods`,
      distractors: [`To create artworks`, `To write laws`, `To bake`]
    })
  ];

  const out = [];
  for (let i = 0; i < count; i++) {
    if (level === 'scenario') {
      const q = `Scenario: Given a real-world situation involving ${subject}, what would be an appropriate approach?`;
      const options = shuffle([
        `Apply ${subject} principles to analyze and decide`,
        `Ignore ${subject} and guess`,
        `Use an unrelated procedure`,
        `Answer based on opinion only`
      ]).slice(0,4);
      const correctIndex = options.findIndex(o => o.startsWith('Apply'));
      out.push({ question: q, options, correctIndex, marks: 5 });
      continue;
    }

    const tpl = templates[i % templates.length];
    const built = tpl({ s: subject });
    const options = shuffle([built.correct, ...built.distractors]).slice(0,4);
    const correctIndex = options.indexOf(built.correct);
    const marks = level === 'basic' ? 1 : level === 'advanced' ? 2 : 5;
    out.push({ question: built.question, options, correctIndex, marks });
  }
  return out;
};

const AssessmentTestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location && location.state ? location.state : {};
  const { level = 'basic', todaysTasks = [] } = state;

  const subjects = useMemo(() => Array.from(new Set(todaysTasks.map(t => t.subject).filter(Boolean))), [todaysTasks]);
  const topicDisplay = subjects.length > 0 ? subjects.join(', ') : 'General Knowledge';

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let mounted = true;
    const cnt = level === 'scenario' ? Math.min(2, Math.max(1, Math.floor(Math.random() * 2) + 1)) : 10;

    const fetchAIQuiz = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/assessments/generate-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, todaysTasks, userId: window.firebase?.auth()?.currentUser?.uid })
        });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.warn('Failed to parse JSON response from /generate-quiz:', e, 'raw:', text);
          json = null;
        }
        console.debug('AI endpoint response:', res.status, text);
        if (!res.ok) throw new Error(`AI quiz generation failed ${res.status}`);
        if (mounted && json && Array.isArray(json.questions) && json.questions.length > 0) {
          setQuestions(json.questions);
          setCurrent(0);
          setAnswers(Array(json.questions.length).fill(null));
          return;
        }
      } catch (err) {
        console.warn('AI quiz generation failed, falling back to local generator', err);
      }

      // fallback
      if (mounted) {
        const q = generateQuestionsForSubject(level, subjects, cnt);
        setQuestions(q);
        setCurrent(0);
        setAnswers(Array(q.length).fill(null));
      }
    };

    fetchAIQuiz();
    return () => { mounted = false; };
  }, [level, subjects.length]);

  const submit = (idx) => {
    setAnswers(prev => {
      const copy = [...prev]; copy[current] = idx; return copy;
    });
    if (current < questions.length - 1) setCurrent(current + 1);
    else finish();
  };

  const finish = () => {
    let total = 0, scored = 0;
    questions.forEach((q, i) => { total += q.marks; if (answers[i] === q.correctIndex) scored += q.marks; });
    const percent = total === 0 ? 0 : Math.round((scored/total) * 100);

    // Unlock flow
    if (level === 'basic' && percent >= 70) {
      // auto-start advanced
      setTimeout(() => navigate('/assessment-test', { state: { level: 'advanced', todaysTasks } }), 400);
      alert(`Basic passed ${percent}%. Starting Advanced test...`);
      return;
    }
    if (level === 'advanced' && percent >= 50) {
      setTimeout(() => navigate('/assessment-test', { state: { level: 'scenario', todaysTasks } }), 400);
      alert(`Advanced passed ${percent}%. Starting Scenario test...`);
      return;
    }

    alert(`Test complete. Score: ${percent}%`);
    navigate('/assessments', { replace: true });
  };

  if (!questions || questions.length === 0) return (<div style={{padding:20}}>Preparing test...</div>);

  const q = questions[current];

  return (
    <div className="assessment-test-page">
      <div className="header">
        <button onClick={() => navigate(-1)} className="control-btn">← Back</button>
        <h2>{level.toUpperCase()} TEST — {topicDisplay}</h2>
      </div>

      <div className="question-area">
        <div className="q-count">Question {current+1} / {questions.length}</div>
        <div className="q-text">{q.question}</div>
        <div className="options">
          {q.options.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => submit(i)}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentTestPage;

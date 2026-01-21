import React from 'react';
import { useLocation } from 'react-router-dom';
import AIDoubtSolverSection from '../sections/AIDoubtSolverSection';

function buildQueryFromTasks(tasks) {
  if (!tasks || tasks.length === 0) return '';
  // Expect tasks to have subject, title, difficulty, id
  const lines = ['Today\'s Study Plan:'];
  tasks.forEach((t, i) => {
    const subject = t.subject || t.unitName || 'Unknown Subject';
    const title = t.title || t.originalTitle || t.name || '';
    const diff = t.difficulty ? ` (${t.difficulty})` : '';
    lines.push(`${i + 1}. ${subject}: ${title}${diff}`);
  });
  lines.push('\nPlease summarize these into structured study notes: for each item give a short summary, 3 bullet points and 1 key definition.');
  return lines.join('\n');
}

export default function StudyReaderPage() {
  const { state } = useLocation();
  const tasks = state?.todaysTasks || state?.subtopics || [];
  const initialQuery = buildQueryFromTasks(tasks);

  return (
    <div className="study-reader-page">
      <div className="page-header">
        <h1>📖 Read & Master</h1>
        <p>AI-guided structured notes for today's study plan</p>
      </div>
      <AIDoubtSolverSection initialQuery={initialQuery} studyMode={true} tasks={tasks} />
    </div>
  );
}

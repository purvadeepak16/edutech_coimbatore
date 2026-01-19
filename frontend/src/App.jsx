import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page imports
import DashboardPage from './pages/DashboardPage';
import SyllabusPage from './pages/SyllabusPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
import MindMapPage from './pages/MindMapPage';
import AskAIPage from './pages/AskAIPage';
import AssessmentsPage from './pages/AssessmentsPage';
import MasteryScorePage from './pages/MasteryScorePage';
import SchedulePage from './pages/SchedulePage';
import ParentViewPage from './pages/ParentViewPage';
import WellnessPage from './pages/WellnessPage';
import AchievementsPage from './pages/AchievementsPage';
import ExamCountdownPage from './pages/ExamCountdownPage';
import PeaceModePage from './pages/PeaceModePage';
import GamificationPage from './pages/GamificationPage';

import './App.css';
import './pages/PageStyles.css';

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
          <Route path="/study-plan" element={<DashboardPage />} />
          <Route path="/learning-modes" element={<DashboardPage />} />
          <Route path="/mindmap" element={<MindMapPage />} />
          <Route path="/active-session" element={<DashboardPage />} />
          <Route path="/ask-ai" element={<AskAIPage />} />
          <Route path="/mastery-score" element={<MasteryScorePage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/parent-view" element={<ParentViewPage />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/groups" element={<StudyGroupsPage />} />
          <Route path="/exam-countdown" element={<ExamCountdownPage />} />
          <Route path="/peacemode" element={<PeaceModePage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
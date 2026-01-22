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
import StudyReaderPage from './pages/StudyReaderPage';
import AssessmentsPage from './pages/AssessmentsPage';
import AssessmentTestPage from './pages/AssessmentTestPage';
import MasteryScorePage from './pages/MasteryScorePage';
import SchedulePage from './pages/SchedulePage';
import ParentViewPage from './pages/ParentViewPage';
import TextToSpeechPage from './pages/TextToSpeechPage';
import TextToPodcastPage from './pages/TextToPodcastPage';
import WellnessPage from './pages/WellnessPage';
import AchievementsPage from './pages/AchievementsPage';
import ExamCountdownPage from './pages/ExamCountdownPage';
import PeaceModePage from './pages/PeaceModePage';
import GamificationPage from './pages/GamificationPage';
import ZombieGame from './pages/games/ZombieGame';
import MemoryCardGame from './pages/games/MemoryCardGame';
import WhackAMoleGame from './pages/games/WhackAMoleGame';
import VisualMindMapPage from './pages/VisualMindMapPage';
import MentorDashboard from './pages/MentorDashboard';
import MentorsPage from './pages/MentorsPage';
import DoubtTickets from './pages/DoubtTickets';
import MeetsManagement from './pages/MeetsManagement';
import './App.css';
import './pages/PageStyles.css';

function AppContent() {
  const { currentUser ,userData } = useAuth();

  if (!currentUser) {
    return <LandingPage />;
  }
// Role-based routing: Mentors see different dashboard
  const isMentor = userData?.userRole === 'Mentor';
  const defaultRoute = isMentor ? '/mentor/dashboard' : '/dashboard';
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        
        {/* Mentor-only routes (protected by role guard) */}
        {isMentor && (
          <>
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/mentor/tickets" element={<DoubtTickets />} />
            <Route path="/mentor/meets" element={<MeetsManagement />} />
          </>
        )}

        {/* Student-only routes (protected by role guard) */}
        {!isMentor && (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/study-plan" element={<DashboardPage />} />
            <Route path="/learning-modes" element={<DashboardPage />} />
            <Route path="/mindmap" element={<MindMapPage />} />
            <Route path="/visual-map" element={<VisualMindMapPage />} />
            <Route path="/active-session" element={<DashboardPage />} />
            <Route path="/ask-ai" element={<AskAIPage />} />
            <Route path="/study-reader" element={<StudyReaderPage />} />
            <Route path="/mastery-score" element={<MasteryScorePage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessment-test" element={<AssessmentTestPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/text-to-speech" element={<TextToSpeechPage />} />
            <Route path="/text-to-podcast" element={<TextToPodcastPage />} />
            <Route path="/parent-view" element={<ParentViewPage />} />
            <Route path="/gamification" element={<GamificationPage />} />
            <Route path="/zombie-survival" element={<ZombieGame />} />
            <Route path="/memory-game" element={<MemoryCardGame />} />
            <Route path="/whack-a-mole" element={<WhackAMoleGame />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/groups" element={<StudyGroupsPage />} />
            <Route path="/exam-countdown" element={<ExamCountdownPage />} />
            <Route path="/peacemode" element={<PeaceModePage />} />
          </>
        )}

        {/* Catch-all: redirect unauthorized access back to default route */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
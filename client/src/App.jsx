import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import MeetingsPage from './pages/dashboard/MeetingsPage';
import MeetingDetailPage from './pages/dashboard/MeetingDetailPage';
import LeadsPage from './pages/dashboard/LeadsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import PipelinePage from './pages/dashboard/PipelinePage';
import EmailPage from './pages/dashboard/EmailPage';
import BillingPage from './pages/dashboard/BillingPage';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ZoomPanelLayout from './components/layout/ZoomPanelLayout';
import TranscriptionView from './pages/zoom-panel/TranscriptionView';
import SuggestionsView from './pages/zoom-panel/SuggestionsView';
import NotesView from './pages/zoom-panel/NotesView';
import { ErrorBoundary } from './components/common';
import { initAuthListener } from './services/firebase/auth';
import './index.css';

function App() {
  useEffect(() => {
    initAuthListener();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="emails" element={<EmailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>
          
          {/* Zoom In-Meeting Panel Routes */}
          <Route path="/zoom-panel" element={<ZoomPanelLayout />}>
            <Route index element={<TranscriptionView />} />
            <Route path="transcription" element={<TranscriptionView />} />
            <Route path="suggestions" element={<SuggestionsView />} />
            <Route path="notes" element={<NotesView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

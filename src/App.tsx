import Hero from './pages/Hero';
import LoginPage from './features/Login/component/LoginPage';
import RegisterPage from './features/register/component/RegisterPage';
import ProfilePage from './features/profile/component/ProfilePage';
import EditProfilePage from './features/profile/component/EditProfilePage';
import ChangePasswordPage from './features/profile/component/ChangePasswordPage';
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GlassToastProvider } from './context/GlassToastContext';
import { NotificationRealtimeProvider } from './context/NotificationRealtimeContext';
import { NavBadgesProvider } from './context/NavBadgesContext';
import GlassToastStack from './components/shared/GlassToastStack';
import NotificationGlassToasts from './features/notifications/components/NotificationGlassToasts';
import SettingsPage from './features/Settings/component/SettingsPage';
import OAuthSuccess from './pages/OAuthSuccess';
import CityPage from './pages/CityPage';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Webchat from './features/chat/components/Webchat.tsx';
import FriendsPage from './features/friends/components/FriendsPage';
import NotificationPage from './features/notifications/NotificationPage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import InterestsPage from './features/Interests/InterestsPage';
import HealthcheckPage from './pages/HealthcheckPage';
import PrivacyPage from './pages/PrivacyPage';

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/healthcheck" element={<HealthcheckPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/webchat" element={<ProtectedRoute><Webchat /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
        <Route path="/city" element={<ProtectedRoute><CityPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPlacesPage /></ProtectedRoute>} />
        <Route path="/interests" element={<ProtectedRoute><InterestsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlassToastProvider>
          <AuthProvider>
            <NotificationRealtimeProvider>
              <NavBadgesProvider>
                <AppContent />
                <NotificationGlassToasts />
                <GlassToastStack />
              </NavBadgesProvider>
            </NotificationRealtimeProvider>
          </AuthProvider>
        </GlassToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App

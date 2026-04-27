import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import MainLayout from './components/layout/MainLayout';
import LoginPage from './components/auth/LoginPage';
import OnboardingModal from './components/auth/OnboardingModal';

import HomePage from './pages/HomePage';
import CATListPage from './pages/CATListPage';
import CATDetailPage from './pages/CATDetailPage';
import MedicationsPage from './pages/MedicationsPage';
import CasesPage from './pages/CasesPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import PWABanner from './components/ui/PWABanner';

const LoadingScreen: React.FC = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '1rem',
  }}>
    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #1a6bb5, #16a085)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
      🩺
    </div>
    <div className="spinner" style={{ width: 28, height: 28 }} />
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chargement...</div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading, needsOnboarding } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <OnboardingModal />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { currentUser, loading, needsOnboarding } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <LoginPage />;
  if (needsOnboarding) return <OnboardingModal />;
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/cats" element={<PrivateRoute><CATListPage /></PrivateRoute>} />
        <Route path="/cats/:id" element={<PrivateRoute><CATDetailPage /></PrivateRoute>} />
        <Route path="/medicaments" element={<PrivateRoute><MedicationsPage /></PrivateRoute>} />
        <Route path="/cas-cliniques" element={<PrivateRoute><CasesPage /></PrivateRoute>} />
        <Route path="/evenements" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/a-propos" element={<PrivateRoute><AboutPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <PWABanner />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-lg)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

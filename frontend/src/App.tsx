import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrototypeBanner } from './components/PrototypeBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ApplicantDashboard } from './pages/ApplicantDashboard';
import { RegistrationWizard } from './pages/RegistrationWizard';
import { ApplicationView } from './pages/ApplicationView';
import { CertificatePage } from './pages/CertificatePage';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { TrackStatusPage } from './pages/TrackStatusPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { OfficerReviewPage } from './pages/OfficerReviewPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

// Protected Route Guards
const ProtectedApplicantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-12 text-center text-xs text-slate-500">Authenticating session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedOfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-12 text-center text-xs text-slate-500">Authenticating session...</div>;
  if (!user || (user.role !== 'OFFICER' && user.role !== 'ADMIN')) {
    return <Navigate to="/officer/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-12 text-center text-xs text-slate-500">Authenticating session...</div>;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/officer/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100">
          <PrototypeBanner />
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage isOfficerPortal={false} />} />
              <Route path="/officer/login" element={<LoginPage isOfficerPortal={true} />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/track" element={<TrackStatusPage />} />
              <Route path="/verify-search" element={<PublicVerifyPage />} />
              <Route path="/verify/:udyamNumber" element={<PublicVerifyPage />} />
              <Route path="/certificate/:udyamNumber" element={<CertificatePage />} />

              {/* Applicant Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedApplicantRoute>
                    <ApplicantDashboard />
                  </ProtectedApplicantRoute>
                }
              />
              <Route
                path="/wizard"
                element={
                  <ProtectedApplicantRoute>
                    <RegistrationWizard />
                  </ProtectedApplicantRoute>
                }
              />
              <Route
                path="/wizard/:applicationId"
                element={
                  <ProtectedApplicantRoute>
                    <RegistrationWizard />
                  </ProtectedApplicantRoute>
                }
              />
              <Route
                path="/application/:id"
                element={
                  <ProtectedApplicantRoute>
                    <ApplicationView />
                  </ProtectedApplicantRoute>
                }
              />

              {/* Officer / Admin Protected Routes */}
              <Route
                path="/officer/dashboard"
                element={
                  <ProtectedOfficerRoute>
                    <OfficerDashboard />
                  </ProtectedOfficerRoute>
                }
              />
              <Route
                path="/officer/review/:id"
                element={
                  <ProtectedOfficerRoute>
                    <OfficerReviewPage />
                  </ProtectedOfficerRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/settings"
                element={
                  <ProtectedAdminRoute>
                    <AdminSettingsPage />
                  </ProtectedAdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

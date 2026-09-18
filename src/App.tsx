import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { muiTheme } from './styles/muiTheme.js';
import { PublicLandingRoute } from './components/PublicLandingRoute.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { StudentDashboard } from './components/StudentDashboard.js';
import { QuestionCatalog } from './components/QuestionCatalog.js';
import { CbtExamRoom } from './components/CbtExamRoom.js';
import { CbtResultView } from './components/CbtResultView.js';
import { StudentAnalytics } from './components/StudentAnalytics.js';
import { AdminPortal } from './components/AdminPortal.js';
import { StudyMaterialsView } from './components/StudyMaterialsView.js';
import { SubscriptionPlans } from './components/SubscriptionPlans.js';
import { EmailVerificationModal } from './components/EmailVerificationModal.js';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.js';
import { NotificationCenter } from './components/NotificationCenter.js';
import { ConfirmationDialog } from './components/ConfirmationDialog.js';
import { useAuthStore } from './store/useAuthStore.js';

export const App: React.FC = () => {
  const rehydrate = useAuthStore((state) => state.rehydrate);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  return (
    <ThemeProvider theme={muiTheme}>
      <NotificationCenter />
      <ConfirmationDialog />
      <BrowserRouter>
        <EmailVerificationModal />
        <ForgotPasswordModal />
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<PublicLandingRoute />} />

          {/* Authenticated Student Portal */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <QuestionCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <StudyMaterialsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <SubscriptionPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <StudentAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cbt/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <CbtExamRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cbt/:attemptId/result"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <CbtResultView />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

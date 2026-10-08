import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { getMuiTheme } from './styles/muiTheme.js';
import { PublicLandingRoute } from './components/PublicLandingRoute.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { PublicLayout } from './layouts/PublicLayout.js';
import { StudentPortalLayout } from './layouts/StudentPortalLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';
import { StudentDashboard } from './components/StudentDashboard.js';
import { QuestionCatalog } from './components/QuestionCatalog.js';
import { CbtPracticePortal } from './components/CbtPracticePortal.js';
import { CbtExamRoom } from './components/CbtExamRoom.js';
import { CbtResultView } from './components/CbtResultView.js';
import { StudentAnalytics } from './components/StudentAnalytics.js';
import { AdminPortal } from './components/AdminPortal.js';
import { StudyMaterialsView } from './components/StudyMaterialsView.js';
import { SubscriptionPlans } from './components/SubscriptionPlans.js';
import { PostUtmePortal } from './components/PostUtmePortal.js';
import { SchoolFinder } from './components/SchoolFinder.js';
import { EducationalGames } from './components/EducationalGames.js';
import { WeeklyChallenge } from './components/WeeklyChallenge.js';
import { VideoLessonsView } from './components/VideoLessonsView.js';
import { BlogPortal } from './components/BlogPortal.js';
import { UserProfileView } from './components/UserProfileView.js';
import { UserSettingsView } from './components/UserSettingsView.js';
import { LiteratureNovelsView } from './components/LiteratureNovelsView.js';
import { ContactPortal } from './components/ContactPortal.js';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.js';
import { AuthModal } from './components/AuthModal.js';
import { EmailVerificationModal } from './components/EmailVerificationModal.js';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.js';
import { NotificationCenter } from './components/NotificationCenter.js';
import { ConfirmationDialog } from './components/ConfirmationDialog.js';
import { useAuthStore } from './store/useAuthStore.js';
import { useAppStore } from './store/useAppStore.js';

export const App: React.FC = () => {
  const rehydrate = useAuthStore((state) => state.rehydrate);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  // Dynamically recalculate MUI theme whenever the user toggles dark/light mode
  const activeMuiTheme = useMemo(() => getMuiTheme(theme), [theme]);

  return (
    <ThemeProvider theme={activeMuiTheme}>
      <NotificationCenter />
      <ConfirmationDialog />
      <BrowserRouter>
        <AuthModal />
        <EmailVerificationModal />
        <ForgotPasswordModal />
        <FloatingWhatsApp />
        <Routes>
          {/* ======================================================== */}
          {/* 1. PUBLIC PLATFORM WEBSITE — Owned by PublicLayout        */}
          {/*    Exclusively renders Public Navbar & Footer            */}
          {/* ======================================================== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicLandingRoute />} />

            {/* Clean Application-Level Redirects for Removed Landing-Page Destinations */}
            <Route path="/pricing" element={<Navigate to="/" replace />} />
            <Route path="/blog" element={<Navigate to="/" replace />} />
            <Route path="/contact" element={<Navigate to="/" replace />} />
            <Route path="/cbt" element={<Navigate to="/" replace />} />
            <Route path="/cbt-practice" element={<Navigate to="/" replace />} />
            <Route path="/novels" element={<Navigate to="/" replace />} />
            <Route path="/novel-jamb" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/" state={{ openLogin: true }} replace />} />
            <Route path="/signin" element={<Navigate to="/" state={{ openLogin: true }} replace />} />
            <Route path="/signup" element={<Navigate to="/" state={{ openSignup: true }} replace />} />
            <Route path="/register" element={<Navigate to="/" state={{ openSignup: true }} replace />} />

            {/* Public Academic Discovery & Practice Tools */}
            <Route path="/questions" element={<QuestionCatalog />} />
            <Route path="/materials" element={<StudyMaterialsView />} />
            <Route path="/post-utme" element={<PostUtmePortal />} />
            <Route path="/schools" element={<SchoolFinder />} />
          </Route>

          {/* ======================================================== */}
          {/* 2. STUDENT PORTAL — Owned by StudentPortalLayout          */}
          {/*    Exclusively renders PortalHeader (No Navbar / Footer)  */}
          {/* ======================================================== */}
          <Route element={<StudentPortalLayout />}>
            {/* Authenticated Student Workspaces */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <UserProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <UserSettingsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <UserSettingsView defaultTab="bookmarks" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <UserSettingsView defaultTab="history" />
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
              path="/games"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <EducationalGames />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenge"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <WeeklyChallenge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <VideoLessonsView />
                </ProtectedRoute>
              }
            />

            {/* Portal-owned aliases for academic tools and account pages.
                These keep logged-in navigation inside PortalHeader instead of PublicLayout. */}
            <Route
              path="/portal/cbt"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <CbtPracticePortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/questions"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <QuestionCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/materials"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudyMaterialsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/post-utme"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <PostUtmePortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/novels"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <LiteratureNovelsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/schools"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <SchoolFinder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/pricing"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <SubscriptionPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/blog"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <BlogPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/contact"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <ContactPortal />
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
          </Route>

          {/* ======================================================== */}
          {/* 3. CBT EXAMINATION ROOM — Distraction-Free Simulation     */}
          {/*    Standalone interface with dedicated exam timer & desk  */}
          {/* ======================================================== */}
          <Route
            path="/cbt/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <CbtExamRoom />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 4. ADMIN PLATFORM — Owned by AdminLayout                  */}
          {/*    Exclusively renders Admin Navigation shell            */}
          {/* ======================================================== */}
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;


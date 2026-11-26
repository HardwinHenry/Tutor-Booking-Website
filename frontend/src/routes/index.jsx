import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import LoadingState from '../components/feedback/LoadingState';
import { ROLES } from '../constants';

// Eager core pages
import HomePage from '../features/home/HomePage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import NotFoundPage from '../features/common/NotFoundPage';
import UnauthorizedPage from '../features/common/UnauthorizedPage';

// Lazy-loaded feature pages
// Public Tutor Discovery
const TutorSearchPage = lazy(() => import('../features/tutor/TutorSearchPage'));
const TutorDetailPage = lazy(() => import('../features/tutor/TutorDetailPage'));

// Learner Pages
const LearnerDashboardPage = lazy(() => import('../features/learner/LearnerDashboardPage'));
const LearnerQuestionnairePage = lazy(() =>
  import('../features/questionnaire/LearnerQuestionnairePage')
);
const LearnerRecommendationsPage = lazy(() =>
  import('../features/recommendation/LearnerRecommendationsPage')
);
const LearnerBookingsPage = lazy(() => import('../features/booking/LearnerBookingsPage'));
const LearnerCalendarPage = lazy(() => import('../features/calendar/LearnerCalendarPage'));

// Tutor Pages
const TutorDashboardPage = lazy(() => import('../features/tutor/TutorDashboardPage'));
const TutorProfilePage = lazy(() => import('../features/tutor/TutorProfilePage'));
const TutorQuestionnairePage = lazy(() =>
  import('../features/questionnaire/TutorQuestionnairePage')
);
const TutorAvailabilityPage = lazy(() =>
  import('../features/availability/TutorAvailabilityPage')
);
const TutorBookingsPage = lazy(() => import('../features/booking/TutorBookingsPage'));
const TutorCalendarPage = lazy(() => import('../features/calendar/TutorCalendarPage'));
const TutorReviewsPage = lazy(() => import('../features/review/TutorReviewsPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('../features/admin/AdminDashboardPage'));
const AdminTutorApprovalsPage = lazy(() =>
  import('../features/admin/AdminTutorApprovalsPage')
);
const AdminTaxonomiesPage = lazy(() => import('../features/admin/AdminTaxonomiesPage'));
const AdminUsersPage = lazy(() => import('../features/admin/AdminUsersPage'));
const AdminBookingsPage = lazy(() => import('../features/admin/AdminBookingsPage'));
const AdminReviewsPage = lazy(() => import('../features/admin/AdminReviewsPage'));
const AdminCalendarSyncPage = lazy(() => import('../features/admin/AdminCalendarSyncPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState fullPage message="Đang tải trang..." />}>
      <Routes>
        {/* Public Pages with Header & Footer */}
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tutors" element={<TutorSearchPage />} />
          <Route path="tutors/:id" element={<TutorDetailPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="404" element={<NotFoundPage />} />
        </Route>

        {/* Auth Pages */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Learner Protected Area */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.LEARNER]} />}>
          <Route path="learner" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/learner/dashboard" replace />} />
            <Route path="dashboard" element={<LearnerDashboardPage />} />
            <Route path="questionnaire" element={<LearnerQuestionnairePage />} />
            <Route path="recommendations" element={<LearnerRecommendationsPage />} />
            <Route path="bookings" element={<LearnerBookingsPage />} />
            <Route path="calendar" element={<LearnerCalendarPage />} />
          </Route>
        </Route>

        {/* Tutor Protected Area */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.TUTOR]} />}>
          <Route path="tutor" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/tutor/dashboard" replace />} />
            <Route path="dashboard" element={<TutorDashboardPage />} />
            <Route path="profile" element={<TutorProfilePage />} />
            <Route path="questionnaire" element={<TutorQuestionnairePage />} />
            <Route path="availability" element={<TutorAvailabilityPage />} />
            <Route path="bookings" element={<TutorBookingsPage />} />
            <Route path="calendar" element={<TutorCalendarPage />} />
            <Route path="reviews" element={<TutorReviewsPage />} />
          </Route>
        </Route>

        {/* Admin Protected Area */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="tutor-approvals" element={<AdminTutorApprovalsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="taxonomies" element={<AdminTaxonomiesPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="calendar-sync" element={<AdminCalendarSyncPage />} />
          </Route>
        </Route>

        {/* Fallback 404 Catch-All */}
        <Route path="*" element={<RootLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;

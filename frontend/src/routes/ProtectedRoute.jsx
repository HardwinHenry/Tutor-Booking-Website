import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import LoadingState from '../components/feedback/LoadingState';

/**
 * Route guard component for authenticated and role-restricted routes
 * Enforces mandatory 28-question survey completion for Learners before accessing system features
 * @param {string[]} allowedRoles - List of permitted roles
 */
export function ProtectedRoute({ allowedRoles = [] }) {
  const {
    isAuthenticated,
    user,
    isLoading,
    surveyStatus,
    isSurveyChecking,
    checkSurveyStatus,
    isLearner,
  } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && isLearner() && surveyStatus === null && !isSurveyChecking) {
      checkSurveyStatus();
    }
  }, [isAuthenticated, isLearner, surveyStatus, isSurveyChecking, checkSurveyStatus]);

  if (isLoading || (isAuthenticated && isLearner() && surveyStatus === null)) {
    return <LoadingState fullPage message="Đang kiểm tra quyền truy cập và tiến trình khảo sát..." />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Mandatory Learner Survey Guard: Must complete 28 questions before accessing other learner features
  if (isLearner()) {
    const isQuestionnaireRoute = location.pathname === '/learner/questionnaire';
    const isCompleted = surveyStatus === 'completed';

    if (!isCompleted && !isQuestionnaireRoute) {
      return (
        <Navigate
          to="/learner/questionnaire"
          state={{ from: location, reason: 'survey_mandatory' }}
          replace
        />
      );
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;

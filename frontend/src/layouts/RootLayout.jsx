import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ToastProvider from '../components/feedback/ToastProvider';
import { useAuthStore } from '../store/useAuthStore';
import LoadingState from '../components/feedback/LoadingState';

export function RootLayout() {
  const { isAuthenticated, isLearner, surveyStatus, isSurveyChecking, checkSurveyStatus } =
    useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && isLearner() && surveyStatus === null && !isSurveyChecking) {
      checkSurveyStatus();
    }
  }, [isAuthenticated, isLearner, surveyStatus, isSurveyChecking, checkSurveyStatus]);

  // Loading while checking survey status for authenticated learner on reload
  if (isAuthenticated && isLearner() && (surveyStatus === null || isSurveyChecking)) {
    return <LoadingState fullPage message="Đang kiểm tra trạng thái tài khoản..." />;
  }

  // Mandatory Onboarding Guard: Learner who has NOT completed survey cannot access public home or explore pages
  if (isAuthenticated && isLearner() && surveyStatus !== 'completed') {
    return (
      <Navigate
        to="/learner/questionnaire"
        state={{ from: location, reason: 'survey_mandatory' }}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <ToastProvider />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../constants';

// Pages
import HomePage from '../features/home/HomePage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import LearnerDashboardPage from '../features/learner/LearnerDashboardPage';
import TutorDashboardPage from '../features/tutor/TutorDashboardPage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';
import DesignSystemShowcasePage from '../features/common/DesignSystemShowcasePage';
import NotFoundPage from '../features/common/NotFoundPage';
import UnauthorizedPage from '../features/common/UnauthorizedPage';
import FeaturePlaceholderPage from '../features/common/FeaturePlaceholderPage';
import { LearnerQuestionnairePage, TutorQuestionnairePage } from '../features/questionnaire';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages with Header & Footer */}
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="design-system" element={<DesignSystemShowcasePage />} />
        <Route
          path="tutors"
          element={
            <FeaturePlaceholderPage
              title="Tìm kiếm & Khám phá Gia sư"
              stage="Giai đoạn 3"
              description="Chức năng tìm kiếm, phân trang, bộ lọc chuyên môn, trình độ và khoảng giá theo API Backend."
            />
          }
        />
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
          <Route
            path="recommendations"
            element={
              <FeaturePlaceholderPage
                title="Gợi ý gia sư Content-based Filtering"
                stage="Giai đoạn 4"
                description="Kết quả xếp hạng gia sư phù hợp với MatchScore, matchedReasons và scoreBreakdown do Backend tính toán."
              />
            }
          />
          <Route
            path="bookings"
            element={
              <FeaturePlaceholderPage
                title="Quản lý buổi học đã đặt"
                stage="Giai đoạn 6"
                description="Theo dõi trạng thái booking (pending, confirmed, rejected, cancelled, completed) và hủy lịch theo chính sách."
              />
            }
          />
          <Route
            path="calendar"
            element={
              <FeaturePlaceholderPage
                title="Kết nối Google Calendar"
                stage="Giai đoạn 7"
                description="Khởi tạo OAuth qua Backend, hiển thị trạng thái đồng bộ lịch học cá nhân."
              />
            }
          />
        </Route>
      </Route>

      {/* Tutor Protected Area */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.TUTOR]} />}>
        <Route path="tutor" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/tutor/dashboard" replace />} />
          <Route path="dashboard" element={<TutorDashboardPage />} />
          <Route path="questionnaire" element={<TutorQuestionnairePage />} />
          <Route
            path="availability"
            element={
              <FeaturePlaceholderPage
                title="Quản lý khung giờ rảnh (AvailabilitySlot)"
                stage="Giai đoạn 5"
                description="Tạo, cập nhật và quản lý khung giờ rảnh theo tuần hoặc ngày cụ thể."
              />
            }
          />
          <Route
            path="bookings"
            element={
              <FeaturePlaceholderPage
                title="Quản lý yêu cầu Booking"
                stage="Giai đoạn 6"
                description="Xác nhận hoặc từ chối các yêu cầu đặt lịch học từ học viên."
              />
            }
          />
          <Route
            path="calendar"
            element={
              <FeaturePlaceholderPage
                title="Đồng bộ Google Calendar"
                stage="Giai đoạn 7"
                description="Quản lý kết nối lịch Google phục vụ nhắc nhở buổi dạy."
              />
            }
          />
          <Route
            path="reviews"
            element={
              <FeaturePlaceholderPage
                title="Đánh giá nhận được"
                stage="Giai đoạn 7"
                description="Xem thống kê đánh giá, số sao và phản hồi từ các học viên đã hoàn thành buổi học."
              />
            }
          />
        </Route>
      </Route>

      {/* Admin Protected Area */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route
            path="tutor-approvals"
            element={
              <FeaturePlaceholderPage
                title="Duyệt hồ sơ Gia sư (Admin Approval)"
                stage="Giai đoạn 3"
                description="Xem chi tiết hồ sơ năng lực 28 câu, kiểm tra bằng cấp và duyệt hoặc từ chối kèm lý do."
              />
            }
          />
          <Route
            path="users"
            element={
              <FeaturePlaceholderPage
                title="Quản lý tài khoản người dùng"
                stage="Giai đoạn 8"
                description="Tra cứu tài khoản, thay đổi trạng thái kích hoạt/khóa tài khoản."
              />
            }
          />
          <Route
            path="taxonomies"
            element={
              <FeaturePlaceholderPage
                title="Quản lý Taxonomy & Tags"
                stage="Giai đoạn 3"
                description="Quản lý danh mục lĩnh vực, môn học, chuyên môn và tags dùng chung cho toàn bộ hệ thống."
              />
            }
          />
          <Route
            path="bookings"
            element={
              <FeaturePlaceholderPage
                title="Tra cứu & Giám sát Booking"
                stage="Giai đoạn 8"
                description="Tra cứu danh sách booking, lịch sử thay đổi trạng thái và trạng thái đồng bộ."
              />
            }
          />
        </Route>
      </Route>

      {/* Fallback 404 Catch-All */}
      <Route path="*" element={<RootLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;

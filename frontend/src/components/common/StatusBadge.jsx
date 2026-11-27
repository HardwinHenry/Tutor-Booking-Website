import React from 'react';
import Badge from './Badge';
import {
  AVAILABILITY_STATUS,
  BOOKING_STATUS,
  TUTOR_PROFILE_STATUS,
  CALENDAR_SYNC_STATUS,
  USER_STATUS,
} from '../../constants';

/**
 * Rules from Roadmap:
 * "Không dùng chung một badge/status mapping cho AvailabilitySlot, Booking, TutorProfile và CalendarSync
 * vì đây là các đối tượng có vòng đời khác nhau."
 */

// Mapping riêng cho AvailabilitySlot
const AVAILABILITY_CONFIG = {
  [AVAILABILITY_STATUS.AVAILABLE]: { label: 'Còn trống', color: 'emerald', dot: true },
  [AVAILABILITY_STATUS.BOOKED]: { label: 'Đã đặt', color: 'brand', dot: true },
  [AVAILABILITY_STATUS.CLOSED]: { label: 'Đã đóng', color: 'slate', dot: false },
};

// Mapping riêng cho Booking
const BOOKING_CONFIG = {
  [BOOKING_STATUS.PENDING]: { label: 'Chờ gia sư xử lý', color: 'amber', dot: true },
  [BOOKING_STATUS.CONFIRMED]: { label: 'Đã xác nhận', color: 'emerald', dot: true },
  [BOOKING_STATUS.REJECTED]: { label: 'Gia sư từ chối', color: 'rose', dot: false },
  [BOOKING_STATUS.CANCELLED]: { label: 'Đã hủy', color: 'slate', dot: false },
  [BOOKING_STATUS.COMPLETED]: { label: 'Hoàn thành', color: 'brand', dot: false },
};

// Mapping riêng cho TutorProfile Approval
const TUTOR_PROFILE_CONFIG = {
  [TUTOR_PROFILE_STATUS.DRAFT]: { label: 'Bản nháp', color: 'slate', dot: false },
  [TUTOR_PROFILE_STATUS.PENDING]: { label: 'Chờ Admin duyệt', color: 'amber', dot: true },
  [TUTOR_PROFILE_STATUS.APPROVED]: { label: 'Đã được duyệt', color: 'emerald', dot: true },
  [TUTOR_PROFILE_STATUS.REJECTED]: { label: 'Bị từ chối', color: 'rose', dot: false },
};

// Mapping riêng cho CalendarSync
const CALENDAR_SYNC_CONFIG = {
  [CALENDAR_SYNC_STATUS.NOT_CONNECTED]: { label: 'Chưa kết nối', color: 'slate', dot: false },
  [CALENDAR_SYNC_STATUS.PENDING]: { label: 'Đang chờ đồng bộ', color: 'amber', dot: true },
  [CALENDAR_SYNC_STATUS.SYNCED]: { label: 'Đã đồng bộ Calendar', color: 'emerald', dot: true },
  [CALENDAR_SYNC_STATUS.FAILED]: { label: 'Đồng bộ thất bại', color: 'rose', dot: true },
  [CALENDAR_SYNC_STATUS.CANCELLED]: { label: 'Event đã hủy', color: 'slate', dot: false },
};

// Mapping riêng cho User Status
const USER_STATUS_CONFIG = {
  [USER_STATUS.ACTIVE]: { label: 'Hoạt động', color: 'emerald', dot: true },
  [USER_STATUS.LOCKED]: { label: 'Tạm khóa', color: 'amber', dot: true },
  [USER_STATUS.DISABLED]: { label: 'Vô hiệu hóa', color: 'rose', dot: false },
};

export function StatusBadge({ type, status, className }) {
  let config = null;

  switch (type) {
    case 'availability':
      config = AVAILABILITY_CONFIG[status];
      break;
    case 'booking':
      config = BOOKING_CONFIG[status];
      break;
    case 'tutorProfile':
      config = TUTOR_PROFILE_CONFIG[status];
      break;
    case 'calendarSync':
      config = CALENDAR_SYNC_CONFIG[status];
      break;
    case 'user':
      config = USER_STATUS_CONFIG[status];
      break;
    default:
      config = { label: status, color: 'slate', dot: false };
  }

  if (!config) {
    config = { label: status || 'Không rõ', color: 'slate', dot: false };
  }

  return (
    <Badge color={config.color} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
}

export default StatusBadge;

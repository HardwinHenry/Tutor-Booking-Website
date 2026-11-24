import React from 'react';
import Badge from './Badge';
import {
  AVAILABILITY_STATUS,
  BOOKING_STATUS,
  TUTOR_PROFILE_STATUS,
  CALENDAR_SYNC_STATUS,
} from '../../constants';

/**
 * Rules from Roadmap:
 * "Không dùng chung một badge/status mapping cho AvailabilitySlot, Booking, TutorProfile và CalendarSync
 * vì đây là các đối tượng có vòng đời khác nhau."
 */

// Mapping riêng cho AvailabilitySlot
const AVAILABILITY_CONFIG = {
  [AVAILABILITY_STATUS.AVAILABLE]: { label: 'Còn trống', color: 'emerald', dot: true },
  [AVAILABILITY_STATUS.RESERVED]: { label: 'Đã giữ chỗ', color: 'amber', dot: true },
  [AVAILABILITY_STATUS.CANCELLED]: { label: 'Đã hủy', color: 'slate', dot: false },
};

// Mapping riêng cho Booking
const BOOKING_CONFIG = {
  [BOOKING_STATUS.PENDING]: { label: 'Chờ xác nhận', color: 'amber', dot: true },
  [BOOKING_STATUS.CONFIRMED]: { label: 'Đã xác nhận', color: 'emerald', dot: true },
  [BOOKING_STATUS.REJECTED]: { label: 'Đã từ chối', color: 'rose', dot: false },
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
  [CALENDAR_SYNC_STATUS.SYNCED]: { label: 'Đã đồng bộ Calendar', color: 'emerald', dot: true },
  [CALENDAR_SYNC_STATUS.FAILED]: { label: 'Lỗi đồng bộ', color: 'rose', dot: true },
  [CALENDAR_SYNC_STATUS.SKIPPED]: { label: 'Chưa đồng bộ', color: 'slate', dot: false },
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

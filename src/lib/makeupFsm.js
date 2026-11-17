/**
 * Máy trạng thái hữu hạn 8 trạng thái cho tiến trình học bù (Lớp 2)
 * Đặc tả theo Bảng 2 và Hình 2 trong bài báo JSLHU-SysAir.
 */

export const MAKEUP_STATUSES = Object.freeze([
  'NOT_REQUIRED',
  'MAKEUP_REQUIRED',
  'MAKEUP_PENDING',
  'MAKEUP_SCHEDULED',
  'MAKEUP_COMPLETED',
  'MAKEUP_ABSENT',
  'MAKEUP_EXPIRED',
  'MAKEUP_CANCELLED'
]);

export const TERMINAL_STATUSES = Object.freeze([
  'NOT_REQUIRED',
  'MAKEUP_COMPLETED',
  'MAKEUP_EXPIRED',
  'MAKEUP_CANCELLED'
]);

export const INITIAL_STATUSES = Object.freeze([
  'MAKEUP_REQUIRED',
  'MAKEUP_PENDING'
]);

export const ALLOWED_TRANSITIONS = Object.freeze({
  NOT_REQUIRED: [],
  MAKEUP_REQUIRED: ['MAKEUP_SCHEDULED', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
  MAKEUP_PENDING: ['MAKEUP_SCHEDULED', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
  MAKEUP_SCHEDULED: ['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
  MAKEUP_ABSENT: ['MAKEUP_SCHEDULED', 'MAKEUP_EXPIRED'],
  MAKEUP_COMPLETED: [],
  MAKEUP_EXPIRED: [],
  MAKEUP_CANCELLED: []
});

export function isValidStatus(status) {
  return typeof status === 'string' && MAKEUP_STATUSES.includes(status);
}

export function isTerminalStatus(status) {
  return typeof status === 'string' && TERMINAL_STATUSES.includes(status);
}

export function isValidInitialStatus(status) {
  return typeof status === 'string' && INITIAL_STATUSES.includes(status);
}

export function isValidTransition(currentStatus, nextStatus) {
  if (!isValidStatus(nextStatus)) return false;
  if (!currentStatus) return isValidInitialStatus(nextStatus);

  // Giữ nguyên trạng thái (chỉ sửa thông tin phụ): chỉ cho phép nếu phiên chưa kết thúc
  if (currentStatus === nextStatus) {
    return !isTerminalStatus(currentStatus);
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

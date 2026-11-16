import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/utils/env';

export const PARENT_COOKIE_NAME = 'parent_session_token';

export function signParentToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyParentToken(token) {
    try {
        if (!token) return null;
        return jwt.verify(token, getJwtSecret());
    } catch {
        return null;
    }
}

export function normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length >= 11) {
        digits = '0' + digits.slice(2);
    }
    return digits;
}

/**
 * Trích xuất thời điểm bắt đầu buổi học (Date object) từ Day và Time (VD: Day: 2026-09-12, Time: '08:00 - 10:00' hoặc '08:00-13:15')
 */
export function getLessonStartDateTime(day, timeStr) {
    if (!day) return null;
    const d = new Date(day);
    if (isNaN(d.getTime())) return null;
    let hours = 8;
    let minutes = 0;
    if (typeof timeStr === 'string') {
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
        }
    }
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();
    return new Date(year, month, date, hours, minutes, 0, 0);
}

/**
 * Kiểm tra xem buổi học còn trong thời hạn xin nghỉ phép không:
 * Quy định: Tối đa sau 1 tiếng kể từ khi buổi học bắt đầu (StartTime + 1h)
 */
export function isLeaveRequestAllowed(day, timeStr, now = new Date()) {
    const start = getLessonStartDateTime(day, timeStr);
    if (!start) return { allowed: false, reason: 'Thời gian buổi học không hợp lệ', isPast: false };
    
    // Mốc chót = Giờ bắt đầu + 1 tiếng
    const deadline = new Date(start.getTime() + 60 * 60 * 1000);
    const isPast = now.getTime() > deadline.getTime();
    
    return {
        allowed: !isPast,
        startTime: start,
        deadline,
        isPast,
        reason: isPast ? 'Đã quá thời hạn báo nghỉ phép (chỉ hỗ trợ tối đa 1 tiếng sau khi giờ học bắt đầu).' : ''
    };
}

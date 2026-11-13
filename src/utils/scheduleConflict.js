import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import TrialCourse from '@/models/coursetry';
import MakeupSession from '@/models/makeupSession';
import mongoose from 'mongoose';

/**
 * Phân tích chuỗi thời gian thành số phút trong ngày (0 - 1440)
 * Hỗ trợ các định dạng: "18:00 - 19:30", "18:00-19:30", "18h00 - 19h30", "18:00"
 */
export function parseTimeRange(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split('-').map(s => s.trim());

    function toMinutes(t) {
        if (!t || typeof t !== 'string') return null;
        const clean = t.trim().toLowerCase().replace(/\s+/g, '').replace(/p$/, '');
        // Hỗ trợ các định dạng: "8h30", "08:30", "8h00", "8h", "8"
        const match = clean.match(/^(\d{1,2})(?:[:h](\d{1,2}))?h?$/);
        if (!match) return null;
        const h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        if (isNaN(h) || isNaN(m) || h < 0 || h > 24 || m < 0 || m > 59) return null;
        return h * 60 + m;
    }

    const startMins = toMinutes(parts[0]);
    if (startMins === null) return null;

    let endMins = parts[1] ? toMinutes(parts[1]) : null;
    // Nếu không nhập giờ kết thúc hoặc giờ kết thúc không hợp lệ, mặc định ca học kéo dài 90 phút
    if (endMins === null || endMins <= startMins) {
        endMins = Math.min(1440, startMins + 90);
    }

    return { start: startMins, end: endMins };
}

/**
 * Kiểm tra 2 khoảng thời gian có giao nhau không
 */
export function isTimeOverlapping(rangeA, rangeB) {
    if (!rangeA || !rangeB) return true; // Thận trọng: nếu không parse được thời gian thì coi như có nguy cơ trùng
    return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

/**
 * Lấy mốc bắt đầu và kết thúc của một ngày Dương lịch (00:00:00 - 23:59:59.999) theo múi giờ Việt Nam (UTC+7)
 */
export function getDayBounds(dateInput) {
    if (!dateInput) return null;
    let d;
    if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const [day, month, year] = dateInput.split('/').map(Number);
        d = new Date(Date.UTC(year, month - 1, day));
    } else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
        const [year, month, day] = dateInput.trim().split('-').map(Number);
        d = new Date(Date.UTC(year, month - 1, day));
    } else {
        d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return null;

    // Chuẩn hóa theo múi giờ Việt Nam (UTC+7)
    // Để quét trọn vẹn cả trường hợp lưu dạng UTC 00:00:00 và lưu theo giờ địa phương GMT+7
    const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
    const vnTime = new Date(d.getTime() + VN_OFFSET_MS);
    const y = vnTime.getUTCFullYear();
    const m = vnTime.getUTCMonth();
    const day = vnTime.getUTCDate();

    // Bắt đầu ngày VN (00:00:00 GMT+7 = 17:00:00 UTC hôm trước)
    const vnStart = new Date(Date.UTC(y, m, day, 0, 0, 0, 0) - VN_OFFSET_MS);
    // Kết thúc ngày VN (23:59:59.999 GMT+7 = 16:59:59.999 UTC hôm nay)
    const vnEnd = new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - VN_OFFSET_MS);

    // Mốc UTC nguyên ngày (nếu dữ liệu lưu mốc UTC midnight 00:00:00)
    const utcStart = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
    const utcEnd = new Date(Date.UTC(y, m, day, 23, 59, 59, 999));

    const start = new Date(Math.min(vnStart.getTime(), utcStart.getTime()));
    const end = new Date(Math.max(vnEnd.getTime(), utcEnd.getTime()));
    const formatted = `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;

    return { start, end, formatted };
}

/**
 * Engine kiểm tra xung đột lịch phòng học và giáo viên
 * @param {Object} params
 * @param {Date|string} params.date - Ngày cần kiểm tra
 * @param {string} params.timeStr - Khung giờ (ví dụ: "18:00 - 19:30")
 * @param {string|ObjectId} [params.roomId] - ID phòng học (ObjectId trong Area.rooms)
 * @param {string|ObjectId} [params.teacherId] - ID giáo viên
 * @param {string|ObjectId} [params.excludeCourseId] - ID khóa học cần loại trừ (khi sửa)
 * @param {string|ObjectId} [params.excludeLessonId] - ID buổi học cần loại trừ (khi sửa)
 * @param {string|ObjectId} [params.excludeMakeupId] - ID buổi học bù cần loại trừ (khi sửa)
 * @returns {Promise<{ hasConflict: boolean, type?: 'room'|'teacher', message?: string }>}
 */
export async function checkScheduleConflict({
    date,
    timeStr,
    roomId = null,
    teacherId = null,
    excludeCourseId = null,
    excludeLessonId = null,
    excludeMakeupId = null,
}) {
    if (!date || !timeStr || (!roomId && !teacherId)) {
        return { hasConflict: false };
    }

    const bounds = getDayBounds(date);
    if (!bounds) return { hasConflict: false };

    const reqRange = parseTimeRange(timeStr);
    if (!reqRange) return { hasConflict: false };

    await connectDB();

    const roomOid = (roomId && mongoose.Types.ObjectId.isValid(roomId)) ? new mongoose.Types.ObjectId(roomId) : null;
    const teacherOid = (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) ? new mongoose.Types.ObjectId(teacherId) : null;

    const dateFormatted = bounds.formatted || bounds.start.toLocaleDateString('vi-VN');

    // 1. Kiểm tra trong Khóa học chính quy (Course.Detail)
    const courseSessions = await PostCourse.aggregate([
        {
            $match: {
                'Detail.Day': { $gte: bounds.start, $lte: bounds.end }
            }
        },
        { $unwind: '$Detail' },
        {
            $match: {
                'Detail.Day': { $gte: bounds.start, $lte: bounds.end },
                'Detail.Type': { $ne: 'Báo nghỉ' },
                ...(excludeLessonId && mongoose.Types.ObjectId.isValid(excludeLessonId)
                    ? { 'Detail._id': { $ne: new mongoose.Types.ObjectId(excludeLessonId) } }
                    : {})
            }
        },
        {
            $project: {
                _id: '$Detail._id',
                courseId: '$ID',
                courseName: '$Name',
                day: '$Detail.Day',
                time: '$Detail.Time',
                room: '$Detail.Room',
                teacher: '$Detail.Teacher',
                teachingAs: '$Detail.TeachingAs'
            }
        }
    ]);

    for (const sess of courseSessions) {
        const sessRange = parseTimeRange(sess.time);
        if (isTimeOverlapping(reqRange, sessRange)) {
            if (roomOid && sess.room && String(sess.room) === String(roomOid)) {
                return {
                    hasConflict: true,
                    type: 'room',
                    message: `Phòng học đã được xếp cho lớp chính quy "${sess.courseId || sess.courseName}" vào khung giờ ${sess.time} ngày ${dateFormatted}. Vui lòng chọn phòng khác.`
                };
            }
            if (teacherOid && ((sess.teacher && String(sess.teacher) === String(teacherOid)) || (sess.teachingAs && String(sess.teachingAs) === String(teacherOid)))) {
                return {
                    hasConflict: true,
                    type: 'teacher',
                    message: `Giáo viên đã có lịch giảng dạy lớp "${sess.courseId || sess.courseName}" vào khung giờ ${sess.time} ngày ${dateFormatted}. Vui lòng chọn giáo viên hoặc giờ khác.`
                };
            }
        }
    }

    // 2. Kiểm tra trong Lớp học thử (TrialCourse.sessions)
    const trialSessions = await TrialCourse.aggregate([
        { $unwind: '$sessions' },
        {
            $match: {
                'sessions.day': { $gte: bounds.start, $lte: bounds.end },
                ...(excludeLessonId && mongoose.Types.ObjectId.isValid(excludeLessonId)
                    ? { 'sessions._id': { $ne: new mongoose.Types.ObjectId(excludeLessonId) } }
                    : {})
            }
        },
        {
            $project: {
                _id: '$sessions._id',
                name: '$name',
                day: '$sessions.day',
                time: '$sessions.time',
                room: '$sessions.room',
                teacher: '$sessions.teacher',
                teachingAs: '$sessions.teachingAs'
            }
        }
    ]);

    for (const sess of trialSessions) {
        const sessRange = parseTimeRange(sess.time);
        if (isTimeOverlapping(reqRange, sessRange)) {
            if (roomOid && sess.room && String(sess.room) === String(roomOid)) {
                return {
                    hasConflict: true,
                    type: 'room',
                    message: `Phòng học đã được xếp cho lớp trải nghiệm "${sess.name}" vào khung giờ ${sess.time} ngày ${dateFormatted}. Vui lòng chọn phòng khác.`
                };
            }
            if (teacherOid && ((sess.teacher && String(sess.teacher) === String(teacherOid)) || (sess.teachingAs && String(sess.teachingAs) === String(teacherOid)))) {
                return {
                    hasConflict: true,
                    type: 'teacher',
                    message: `Giáo viên đã có lịch dạy lớp trải nghiệm "${sess.name}" vào khung giờ ${sess.time} ngày ${dateFormatted}. Vui lòng chọn giáo viên hoặc giờ khác.`
                };
            }
        }
    }

    // 3. Kiểm tra trong Lớp học bù (MakeupSession)
    const makeupFilter = {
        makeupDate: { $gte: bounds.start, $lte: bounds.end },
        makeupStatus: { $nin: ['MAKEUP_CANCELLED', 'NOT_REQUIRED'] },
        ...(excludeMakeupId && mongoose.Types.ObjectId.isValid(excludeMakeupId)
            ? { _id: { $ne: new mongoose.Types.ObjectId(excludeMakeupId) } }
            : {})
    };

    const makeupSessions = await MakeupSession.find(makeupFilter).populate('course', 'ID Name').lean();

    for (const sess of makeupSessions) {
        const sessRange = parseTimeRange(sess.makeupTime);
        if (isTimeOverlapping(reqRange, sessRange)) {
            if (roomOid && sess.makeupRoom && String(sess.makeupRoom) === String(roomOid)) {
                return {
                    hasConflict: true,
                    type: 'room',
                    message: `Phòng học đã được xếp cho buổi học bù lớp "${sess.course?.ID || 'Học bù'}" vào khung giờ ${sess.makeupTime} ngày ${dateFormatted}. Vui lòng chọn phòng khác.`
                };
            }
            if (teacherOid && sess.makeupTeacher && String(sess.makeupTeacher) === String(teacherOid)) {
                return {
                    hasConflict: true,
                    type: 'teacher',
                    message: `Giáo viên đã có lịch dạy học bù cho lớp "${sess.course?.ID || 'Học bù'}" vào khung giờ ${sess.makeupTime} ngày ${dateFormatted}. Vui lòng chọn giáo viên hoặc giờ khác.`
                };
            }
        }
    }

    return { hasConflict: false };
}

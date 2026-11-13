import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import User from '@/models/users'
import Notification from '@/models/notification'
import NotificationSetting from '@/models/notificationSetting'
import { createNotification } from '@/data/database/notification'
import { renderNotificationTemplate } from '@/services/notification.service'
import dayjs from 'dayjs'

let settingsCache = null;
let lastSettingsCacheTime = 0;

async function getAllSettings() {
  const now = Date.now();
  if (settingsCache && (now - lastSettingsCacheTime < 60000)) {
    return settingsCache;
  }
  const settings = await NotificationSetting.find({}).lean();
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });
  settingsCache = map;
  lastSettingsCacheTime = now;
  return settingsCache;
}

async function getSetting(key) {
  const map = await getAllSettings();
  return map[key] ?? null;
}

/**
 * Trích xuất thời điểm kết thúc buổi học (T₀) từ Day và Time
 * Quy định: T₀ là giờ kết thúc ca học. Nếu có chuỗi thời gian '08:00 - 09:30', lấy 09:30.
 * Nếu không có giờ kết thúc cụ thể, mặc định ca học kéo dài 90 phút kể từ giờ bắt đầu.
 */
export function getLessonEndTime(day, timeStr) {
  if (!day) return null;
  const d = new Date(day);
  if (isNaN(d.getTime())) return null;

  let endHours = null;
  let endMinutes = null;

  if (typeof timeStr === 'string') {
    const match = timeStr.match(/(?:\d{1,2}:\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (match) {
      endHours = parseInt(match[1], 10);
      endMinutes = parseInt(match[2], 10);
    } else {
      const singleMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (singleMatch) {
        const startHours = parseInt(singleMatch[1], 10);
        const startMinutes = parseInt(singleMatch[2], 10);
        return dayjs(d).hour(startHours).minute(startMinutes).second(0).add(90, 'minute').toDate();
      }
    }
  }

  if (endHours !== null && endMinutes !== null) {
    return dayjs(d).hour(endHours).minute(endMinutes).second(0).toDate();
  }

  return dayjs(d).add(90, 'minute').toDate();
}

export async function checkLessonAfterEnd(courseId, lessonId) {
  await connectDB()
  const course = await PostCourse.findById(courseId).lean()
  if (!course) return

  const lesson = course.Detail?.find(d => d._id?.toString() === lessonId)
  if (!lesson) return

  // T₀ tính từ thời điểm kết thúc buổi học
  const lessonEndTime = getLessonEndTime(lesson.Day, lesson.Time)
  if (!lessonEndTime) return

  const minutesSinceEnd = dayjs().diff(dayjs(lessonEndTime), 'minute')
  if (minutesSinceEnd < 0 || minutesSinceEnd > 7 * 24 * 60) return

  const teacher = lesson.Teacher ? await User.findById(lesson.Teacher).lean() : null
  const teacherName = teacher?.name || 'N/A'

  const reminderMin = await getSetting('sla_reminder_minutes') || 30
  const warningMin = await getSetting('sla_warning_minutes') || 60
  const resourceMin = await getSetting('sla_resource_warning_minutes') || 90
  const slaMin = await getSetting('sla_incident_minutes') || 120

  // 1. Kiểm tra mức độ hoàn thành báo cáo:
  // - Điểm danh: có thông tin Type hoặc có học sinh đã được chấm điểm danh (Checkin !== 0)
  const hasAttendance = Boolean(lesson.Type) || (course.Student || []).some(s => {
    const l = (s.Learn || []).find(item => String(item.Lesson) === String(lesson._id));
    return l && l.Checkin !== 0;
  });
  // - Nhật ký buổi học & nhận xét
  const hasLessonNote = Boolean(lesson.Note && lesson.Note.trim());
  // - Minh chứng tài nguyên (ảnh hoạt động, ảnh chi tiết, hoặc video)
  const hasResources = Boolean(
    (lesson.Image && lesson.Image.length > 0) ||
    (lesson.DetailImage && lesson.DetailImage.length > 0) ||
    (lesson.Videos && lesson.Videos.length > 0)
  );

  const isReportComplete = hasAttendance && hasLessonNote && hasResources;

  // 2. Bước đóng cảnh báo: Nếu báo cáo đã hoàn tất đầy đủ, tự động đóng mọi cảnh báo SLA
  if (isReportComplete) {
    await Notification.updateMany(
      {
        ref_course: course._id,
        ref_lesson: lesson._id,
        type: { $in: ['MISSING_ATTENDANCE', 'MISSING_LESSON_LOG', 'MISSING_RESOURCE', 'SLA_VIOLATION'] },
        status: { $in: ['UNREAD', 'READ', 'IN_PROGRESS'] }
      },
      {
        $set: {
          status: 'RESOLVED',
          resolved_at: new Date()
        }
      }
    );
    return; // Đã hoàn tất báo cáo -> không leo thang sự cố
  }

  // Helper kiểm tra cảnh báo đang mở để chống tạo trùng lặp
  const hasActiveNotification = async (type) => {
    return await Notification.findOne({
      ref_course: course._id,
      ref_lesson: lesson._id,
      type: type,
      status: { $in: ['UNREAD', 'READ', 'IN_PROGRESS'] }
    }).lean();
  };

  // Mốc 1: T₀ + 30' (REMINDER: Điểm danh) - Gửi Giáo viên
  if (hasAttendance) {
    await Notification.updateMany(
      { ref_course: course._id, ref_lesson: lesson._id, type: 'MISSING_ATTENDANCE', status: { $in: ['UNREAD', 'READ', 'IN_PROGRESS'] } },
      { $set: { status: 'RESOLVED', resolved_at: new Date() } }
    );
  } else if (minutesSinceEnd >= reminderMin) {
    if (!await hasActiveNotification('MISSING_ATTENDANCE')) {
      const rendered = await renderNotificationTemplate('MISSING_ATTENDANCE', {
        courseName: course.ID,
        minutes: minutesSinceEnd,
        teacherName: teacherName
      });

      await createNotification({
        title: rendered.title,
        content: rendered.content,
        type: 'MISSING_ATTENDANCE',
        level: rendered.level || 'REMINDER',
        ref_course: course._id,
        ref_lesson: lesson._id,
        ref_teacher: lesson.Teacher,
        targetRoles: ['teacher'],
      });
    }
  }

  // Mốc 2: T₀ + 60' (WARNING-1: Nhật ký giảng dạy) - Gửi Giáo viên và Học vụ
  if (hasLessonNote) {
    await Notification.updateMany(
      { ref_course: course._id, ref_lesson: lesson._id, type: 'MISSING_LESSON_LOG', status: { $in: ['UNREAD', 'READ', 'IN_PROGRESS'] } },
      { $set: { status: 'RESOLVED', resolved_at: new Date() } }
    );
  } else if (minutesSinceEnd >= warningMin) {
    if (!await hasActiveNotification('MISSING_LESSON_LOG')) {
      await createNotification({
        title: `Thiếu nhật ký buổi học - ${course.ID}`,
        content: `Lớp ${course.ID} đã kết thúc ${minutesSinceEnd} phút nhưng giáo viên ${teacherName} chưa cập nhật nhật ký.`,
        type: 'MISSING_LESSON_LOG',
        level: 'WARNING',
        ref_course: course._id,
        ref_lesson: lesson._id,
        ref_teacher: lesson.Teacher,
        targetRoles: ['teacher', 'hocvu', 'Academic'],
      });
    }
  }

  // Mốc 3: T₀ + 90' (WARNING-2: Minh chứng tài nguyên) - Gửi Học vụ cơ sở (không gửi GV per Bảng 4)
  if (hasResources) {
    await Notification.updateMany(
      { ref_course: course._id, ref_lesson: lesson._id, type: 'MISSING_RESOURCE', status: { $in: ['UNREAD', 'READ', 'IN_PROGRESS'] } },
      { $set: { status: 'RESOLVED', resolved_at: new Date() } }
    );
  } else if (minutesSinceEnd >= resourceMin) {
    if (!await hasActiveNotification('MISSING_RESOURCE')) {
      await createNotification({
        title: `Thiếu tài nguyên buổi học - ${course.ID}`,
        content: `Lớp ${course.ID} thiếu video/tài liệu/link tài nguyên cho buổi học.`,
        type: 'MISSING_RESOURCE',
        level: 'WARNING',
        ref_course: course._id,
        ref_lesson: lesson._id,
        ref_teacher: lesson.Teacher,
        targetRoles: ['hocvu', 'Academic'],
      });
    }
  }

  // Mốc 4: T₀ + 120' (INCIDENT: Sự cố học vụ) - Gửi Admin + Học vụ (không gửi GV per Bảng 4)
  // Chỉ kích hoạt khi đã qua 120 phút VÀ báo cáo chưa hoàn tất
  if (minutesSinceEnd >= slaMin && !isReportComplete) {
    if (!await hasActiveNotification('SLA_VIOLATION')) {
      await createNotification({
        title: `Vi phạm SLA - ${course.ID}`,
        content: `Lớp ${course.ID} đã kết thúc ${minutesSinceEnd} phút, giáo viên ${teacherName} chưa hoàn tất báo cáo. Vi phạm SLA.`,
        type: 'SLA_VIOLATION',
        level: 'INCIDENT',
        priority: 1,
        ref_course: course._id,
        ref_lesson: lesson._id,
        ref_teacher: lesson.Teacher,
        sla_deadline: dayjs(lessonEndTime).add(slaMin, 'minute').toDate(),
        targetRoles: ['admin', 'Admin', 'hocvu', 'Academic'],
      });
    }
  }
}

export async function checkStudentAbsent(courseId, studentId) {
  await connectDB()
  const course = await PostCourse.findById(courseId).lean()
  if (!course) return

  const student = course.Student?.find(s => s.ID === studentId || s._id?.toString() === studentId)
  if (!student) return

  const absentCount = student.Learn?.filter(l => l.Checkin === 1).length || 0
  const threshold = await getSetting('student_absent_threshold') || 3

  if (absentCount >= threshold) {
    await createNotification({
      title: `Học viên vắng ${absentCount} buổi liên tiếp`,
      content: `Học viên (lớp ${course.ID}) đã vắng ${absentCount} buổi liên tiếp.`,
      type: 'STUDENT_ABSENT_MANY',
      level: 'WARNING',
      ref_course: course._id,
      ref_student: student._id,
      targetRoles: ['teacher', 'hocvu', 'Academic'],
    })
  }
}

/**
 * Quét toàn bộ buổi học trong 7 ngày gần nhất để phát hiện vi phạm SLA,
 * đồng thời kiểm tra và chuyển quá hạn các yêu cầu học bù quá 30 ngày.
 */
export async function scanAllSlaLessons() {
  try {
    await connectDB()

    // 1. Quét quá hạn học bù quá 30 ngày
    try {
      const { expireOverdueMakeupSessions } = await import('@/app/api/academic/makeup-sessions/route')
      if (typeof expireOverdueMakeupSessions === 'function') {
        await expireOverdueMakeupSessions()
      }
    } catch (e) {
      console.warn('[Auto-SLA] Kiểm tra quá hạn học bù thất bại:', e.message)
    }

    // 2. Quét kiểm tra SLA các ca học trong 7 ngày qua
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const courses = await PostCourse.find({
      'Detail.Day': { $gte: sevenDaysAgo, $lte: new Date() }
    }).lean()

    for (const course of courses) {
      for (const lesson of (course.Detail || [])) {
        if (lesson._id) {
          await checkLessonAfterEnd(course._id.toString(), lesson._id.toString())
        }
      }
    }
  } catch (err) {
    console.warn('[Auto-SLA] Quét SLA tự động thất bại:', err.message)
  }
}

let slaWorkerTimer = null;
export function startSlaWorker(intervalMs = 60000) {
  if (slaWorkerTimer) return slaWorkerTimer;
  slaWorkerTimer = setInterval(() => {
    scanAllSlaLessons().catch(err => console.warn('[SLA Worker] Error:', err.message));
  }, intervalMs);
  return slaWorkerTimer;
}

export function stopSlaWorker() {
  if (slaWorkerTimer) {
    clearInterval(slaWorkerTimer);
    slaWorkerTimer = null;
  }
}

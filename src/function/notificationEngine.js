import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import User from '@/models/users'
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

export async function checkLessonAfterEnd(courseId, lessonId) {
  await connectDB()
  const course = await PostCourse.findById(courseId).lean()
  if (!course) return

  const lesson = course.Detail?.find(d => d._id?.toString() === lessonId)
  if (!lesson) return

  const minutesSinceEnd = dayjs().diff(dayjs(lesson.Day), 'minute')
  if (minutesSinceEnd < 0 || minutesSinceEnd > 7 * 24 * 60) return

  const teacher = lesson.Teacher ? await User.findById(lesson.Teacher).lean() : null
  const teacherName = teacher?.name || 'N/A'

  const reminderMin = await getSetting('sla_reminder_minutes') || 30
  const warningMin = await getSetting('sla_warning_minutes') || 60
  const resourceMin = await getSetting('sla_resource_warning_minutes') || 90
  const slaMin = await getSetting('sla_incident_minutes') || 120

  const hasCheckin = lesson.Type || lesson.Note

  if (minutesSinceEnd >= reminderMin && !hasCheckin) {
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
    })
  }

  if (minutesSinceEnd >= warningMin && !lesson.Note) {
    await createNotification({
      title: `Thiếu nhật ký buổi học - ${course.ID}`,
      content: `Lớp ${course.ID} đã kết thúc ${minutesSinceEnd} phút nhưng giáo viên ${teacherName} chưa cập nhật nhật ký.`,
      type: 'MISSING_LESSON_LOG',
      level: 'WARNING',
      ref_course: course._id,
      ref_lesson: lesson._id,
      ref_teacher: lesson.Teacher,
      targetRoles: ['teacher', 'hocvu', 'Academic'],
    })
  }

  if (minutesSinceEnd >= resourceMin && !lesson.Image?.length && !lesson.DetailImage?.length) {
    await createNotification({
      title: `Thiếu tài nguyên buổi học - ${course.ID}`,
      content: `Lớp ${course.ID} thiếu video/tài liệu/link tài nguyên cho buổi học.`,
      type: 'MISSING_RESOURCE',
      level: 'WARNING',
      ref_course: course._id,
      ref_lesson: lesson._id,
      ref_teacher: lesson.Teacher,
      targetRoles: ['teacher', 'hocvu', 'Academic'],
    })
  }

  if (minutesSinceEnd >= slaMin) {
    await createNotification({
      title: `Vi phạm SLA - ${course.ID}`,
      content: `Lớp ${course.ID} đã kết thúc ${minutesSinceEnd} phút, giáo viên ${teacherName} chưa hoàn tất báo cáo. Vi phạm SLA.`,
      type: 'SLA_VIOLATION',
      level: 'INCIDENT',
      priority: 1,
      ref_course: course._id,
      ref_lesson: lesson._id,
      ref_teacher: lesson.Teacher,
      sla_deadline: dayjs(lesson.Day).add(slaMin, 'minute').toDate(),
      targetRoles: ['hocvu', 'Academic'],
    })
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
 * Quét toàn bộ buổi học trong 7 ngày gần nhất để phát hiện vi phạm SLA
 */
export async function scanAllSlaLessons() {
  try {
    await connectDB()
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

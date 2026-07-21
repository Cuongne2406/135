import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import User from '@/models/users'
import NotificationSetting from '@/models/notificationSetting'
import { createNotification } from '@/data/database/notification'
import dayjs from 'dayjs'

async function getSetting(key) {
  const setting = await NotificationSetting.findOne({ key }).lean()
  return setting ? setting.value : null
}

export async function checkLessonAfterEnd(courseId, lessonId) {
  await connectDB()
  const course = await PostCourse.findById(courseId).lean()
  if (!course) return

  const lesson = course.Detail?.find(d => d._id?.toString() === lessonId)
  if (!lesson) return

  const minutesSinceEnd = dayjs().diff(dayjs(lesson.Day), 'minute')
  const teacher = lesson.Teacher ? await User.findById(lesson.Teacher).lean() : null
  const teacherName = teacher?.name || 'N/A'

  const reminderMin = await getSetting('sla_reminder_minutes') || 30
  const warningMin = await getSetting('sla_warning_minutes') || 60
  const resourceMin = await getSetting('sla_resource_warning_minutes') || 90
  const slaMin = await getSetting('sla_incident_minutes') || 120

  const hasCheckin = lesson.Type || lesson.Note

  if (minutesSinceEnd >= reminderMin && !hasCheckin) {
    await createNotification({
      title: `Thiếu điểm danh - ${course.ID}`,
      content: `Lớp ${course.ID} đã kết thúc ${minutesSinceEnd} phút nhưng giáo viên ${teacherName} chưa điểm danh.`,
      type: 'MISSING_ATTENDANCE',
      level: 'REMINDER',
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

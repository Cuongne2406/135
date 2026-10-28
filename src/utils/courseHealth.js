/**
 * Course Health Bar Calculation Engine
 * Đo lường tỷ lệ hoàn thiện dữ liệu học vụ: Điểm danh, Nhận xét, Minh chứng ảnh, ePortfolio
 */

import { formatDate } from '@/function';
import { normalizeSessionDate } from './exifReader';

/**
 * Tính toán chỉ số sức khỏe của một khóa học (0 - 100%)
 * @param {Object} course - Dữ liệu khóa học từ MongoDB
 * @returns {Object} Kết quả đánh giá sức khỏe và checklist chi tiết
 */
export function calculateCourseHealth(course) {
    if (!course || !Array.isArray(course.Detail) || course.Detail.length === 0) {
        return {
            overallScore: 0,
            status: 'critical',
            label: 'Chưa có dữ liệu',
            color: '#ef4444',
            bgLight: '#fef2f2',
            metrics: {
                attendance: { score: 0, label: 'Điểm danh', done: 0, total: 0 },
                journal: { score: 0, label: 'Nhận xét', done: 0, total: 0 },
                media: { score: 0, label: 'Minh chứng', done: 0, total: 0 },
                portfolio: { score: 0, label: 'ePortfolio', done: 0, total: 1 }
            },
            checklist: [],
            isReadyToComplete: false
        };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const details = course.Detail;
    const students = Array.isArray(course.Student) ? course.Student : [];
    const totalSessions = details.length;

    // 1. Phân loại các buổi học trong quá khứ / đã diễn ra
    const pastSessions = details.filter((sess) => {
        const sessDate = normalizeSessionDate(sess);
        // Nếu ngày học <= hôm nay hoặc buổi học đã được đánh dấu hoàn thành/có ảnh
        return (sessDate && sessDate <= today) || (sess.DetailImage && sess.DetailImage.length > 0) || sess.Status === 2;
    });

    const pastCount = pastSessions.length > 0 ? pastSessions.length : 1; // Tránh chia cho 0

    // 2. Đánh giá Điểm danh (Attendance)
    let sessionsWithAttendance = 0;
    const missingAttendance = [];

    details.forEach((sess, idx) => {
        const sessDate = normalizeSessionDate(sess);
        const isPast = (sessDate && sessDate <= today) || sess.Status === 2;
        if (!isPast) return;

        const lessonId = sess._id?.toString();
        // Kiểm tra xem có học sinh nào đã được Checkin trong buổi này không
        let hasCheckin = false;

        if (sess.Attendance && sess.Attendance.length > 0) {
            hasCheckin = true;
        } else {
            // Kiểm tra trong students.Learn
            for (const stu of students) {
                const learnList = Array.isArray(stu.Learn) ? stu.Learn : Object.values(stu.Learn || {});
                const match = learnList.find(l => l.Lesson?.toString() === lessonId);
                const checkinVal = Number(match?.Checkin);
                if (match && (checkinVal === 1 || checkinVal === 2 || checkinVal === 3)) {
                    hasCheckin = true;
                    break;
                }
            }
        }

        if (hasCheckin) {
            sessionsWithAttendance++;
        } else {
            missingAttendance.push(`Buổi ${idx + 1} (${sess.Day || formatDate(sessDate)}) chưa điểm danh`);
        }
    });

    const attendanceScore = Math.round((sessionsWithAttendance / pastCount) * 100);

    // 3. Đánh giá Nhận xét / Nhật ký (Journal)
    let sessionsWithJournal = 0;
    const missingJournal = [];

    details.forEach((sess, idx) => {
        const sessDate = normalizeSessionDate(sess);
        const isPast = (sessDate && sessDate <= today) || sess.Status === 2;
        if (!isPast) return;

        const lessonId = sess._id?.toString();
        let hasComment = false;

        if (sess.Cmt && sess.Cmt.length > 0) {
            hasComment = true;
        } else {
            for (const stu of students) {
                const learnList = Array.isArray(stu.Learn) ? stu.Learn : Object.values(stu.Learn || {});
                const match = learnList.find(l => l.Lesson?.toString() === lessonId);
                if (match && ((match.Cmt && match.Cmt.length > 0) || (match.CmtFn && match.CmtFn.trim().length > 0))) {
                    hasComment = true;
                    break;
                }
            }
        }

        if (hasComment) {
            sessionsWithJournal++;
        } else {
            missingJournal.push(`Buổi ${idx + 1} (${sess.Day || formatDate(sessDate)}) thiếu nhận xét`);
        }
    });

    const journalScore = Math.round((sessionsWithJournal / pastCount) * 100);

    // 4. Đánh giá Minh chứng hình ảnh (Media)
    let sessionsWithMedia = 0;
    const missingMedia = [];

    details.forEach((sess, idx) => {
        const sessDate = normalizeSessionDate(sess);
        const isPast = (sessDate && sessDate <= today) || sess.Status === 2;
        if (!isPast) return;

        if (sess.DetailImage && sess.DetailImage.length > 0) {
            sessionsWithMedia++;
        } else {
            missingMedia.push(`Buổi ${idx + 1} (${sess.Day || formatDate(sessDate)}) thiếu ảnh Drive`);
        }
    });

    const mediaScore = Math.round((sessionsWithMedia / pastCount) * 100);

    // 5. Đánh giá ePortfolio (Portfolio)
    let portfolioScore = 0;
    const missingPortfolio = [];

    const isCourseFinished = course.Status === true || pastSessions.length >= totalSessions;
    const hasAiDraft = Boolean(course.aiPortfolioDraft && Object.keys(course.aiPortfolioDraft).length > 0);
    const hasPublishedProfiles = students.some(s => s.StatusProfile === true);

    if (hasPublishedProfiles) {
        portfolioScore = 100;
    } else if (hasAiDraft) {
        portfolioScore = isCourseFinished ? 90 : 100;
    } else if (isCourseFinished) {
        portfolioScore = 20; // Đã học xong mà chưa có cả nháp
        missingPortfolio.push('Khóa học đã kết thúc nhưng chưa duyệt ePortfolio cho học sinh');
    } else {
        // Đang trong tiến trình học
        portfolioScore = Math.min(100, Math.round((pastCount / totalSessions) * 80));
    }

    // 6. Tính điểm tổng hợp (Overall Weighted Score)
    // Trọng số: Attendance 30%, Journal 25%, Media 25%, Portfolio 20%
    const overallScore = Math.min(100, Math.round(
        (attendanceScore * 0.3) +
        (journalScore * 0.25) +
        (mediaScore * 0.25) +
        (portfolioScore * 0.2)
    ));

    // Phân loại sức khỏe
    let status = 'healthy';
    let label = 'Khỏe mạnh';
    let color = '#10b981'; // Xanh ngọc
    let bgLight = '#ecfdf5';

    if (overallScore < 50) {
        status = 'critical';
        label = 'Thiếu dữ liệu';
        color = '#ef4444'; // Đỏ
        bgLight = '#fef2f2';
    } else if (overallScore < 80) {
        status = 'warning';
        label = 'Cần bổ sung';
        color = '#f59e0b'; // Vàng cam
        bgLight = '#fffbeb';
    }

    // 7. Tạo danh sách Checklist
    const checklist = [
        {
            key: 'attendance',
            name: 'Điểm danh học sinh',
            icon: '📋',
            score: attendanceScore,
            status: attendanceScore >= 90 ? 'pass' : (attendanceScore >= 50 ? 'warn' : 'fail'),
            detail: `Đã điểm danh ${sessionsWithAttendance}/${pastCount} buổi đã diễn ra`,
            issues: missingAttendance
        },
        {
            key: 'media',
            name: 'Ảnh minh chứng Drive',
            icon: '📸',
            score: mediaScore,
            status: mediaScore >= 90 ? 'pass' : (mediaScore >= 50 ? 'warn' : 'fail'),
            detail: `Đã tải ảnh ${sessionsWithMedia}/${pastCount} buổi học`,
            issues: missingMedia
        },
        {
            key: 'journal',
            name: 'Nhận xét sư phạm',
            icon: '✍️',
            score: journalScore,
            status: journalScore >= 90 ? 'pass' : (journalScore >= 50 ? 'warn' : 'fail'),
            detail: `Đã có nhận xét ${sessionsWithJournal}/${pastCount} buổi học`,
            issues: missingJournal
        },
        {
            key: 'portfolio',
            name: 'Hồ sơ ePortfolio số',
            icon: '🎓',
            score: portfolioScore,
            status: portfolioScore >= 80 ? 'pass' : (portfolioScore >= 40 ? 'warn' : 'fail'),
            detail: hasPublishedProfiles ? 'Đã xuất bản Portfolio' : (hasAiDraft ? 'Đã có bản nháp AI' : 'Chưa tạo Portfolio'),
            issues: missingPortfolio
        }
    ];

    const isReadyToComplete = attendanceScore >= 90 && mediaScore >= 90 && journalScore >= 90;

    return {
        overallScore,
        status,
        label,
        color,
        bgLight,
        metrics: {
            attendance: { score: attendanceScore, label: 'Điểm danh', done: sessionsWithAttendance, total: pastCount },
            journal: { score: journalScore, label: 'Nhận xét', done: sessionsWithJournal, total: pastCount },
            media: { score: mediaScore, label: 'Minh chứng', done: sessionsWithMedia, total: pastCount },
            portfolio: { score: portfolioScore, label: 'ePortfolio', done: hasPublishedProfiles ? 1 : (hasAiDraft ? 0.9 : 0), total: 1 }
        },
        checklist,
        isReadyToComplete,
        totalIssuesCount: missingAttendance.length + missingMedia.length + missingJournal.length + missingPortfolio.length
    };
}

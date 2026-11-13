import connectDB from '@/config/connectDB';
import NotificationTemplate from '@/models/notificationTemplate';
import NotificationSetting from '@/models/notificationSetting';

// Danh sách các mẫu thông báo mặc định của hệ thống
const DEFAULT_TEMPLATES = [
    {
        type: 'MISSING_ATTENDANCE',
        title_template: 'Thiếu điểm danh - {{courseName}}',
        content_template: 'Lớp {{courseName}} đã kết thúc {{minutes}} phút nhưng giáo viên {{teacherName}} chưa hoàn thành điểm danh.',
        default_level: 'REMINDER',
        default_priority: 2,
        variables: ['courseName', 'minutes', 'teacherName'],
        is_active: true
    },
    {
        type: 'TUITION_RECEIPT',
        title_template: 'Xác nhận thu học phí - {{studentName}}',
        content_template: 'Kính gửi Quý phụ huynh học viên {{studentName}}, SYS-AIR xin xác nhận đã thu thành công số tiền {{amount}} VNĐ cho khóa học {{courseName}} vào ngày {{date}}. Trân trọng cảm ơn Quý phụ huynh!',
        default_level: 'REMINDER',
        default_priority: 3,
        variables: ['studentName', 'amount', 'courseName', 'date'],
        is_active: true
    },
    {
        type: 'TEST_SCORE_ALERT',
        title_template: 'Báo cáo điểm kiểm tra - {{studentName}}',
        content_template: 'Kính gửi phụ huynh, học viên {{studentName}} lớp {{courseName}} đã hoàn thành bài kiểm tra {{testName}} với kết quả: {{score}}/{{maxScore}} điểm (Xếp loại: {{rank}}).',
        default_level: 'REMINDER',
        default_priority: 3,
        variables: ['studentName', 'courseName', 'testName', 'score', 'maxScore', 'rank'],
        is_active: true
    },
    {
        type: 'MAKEUP_SESSION_SCHEDULED',
        title_template: 'Lịch học bù - {{studentName}}',
        content_template: 'Học viên {{studentName}} đã được sắp xếp lịch học bù cho lớp {{courseName}} vào lúc {{time}}, ngày {{date}} tại phòng {{room}}.',
        default_level: 'REMINDER',
        default_priority: 3,
        variables: ['studentName', 'courseName', 'time', 'date', 'room'],
        is_active: true
    }
];

// Khởi tạo các mẫu tin mặc định nếu database chưa có
export async function seedNotificationTemplatesIfEmpty() {
    await connectDB();
    const count = await NotificationTemplate.countDocuments();
    if (count === 0) {
        await NotificationTemplate.insertMany(DEFAULT_TEMPLATES);
    }
}

// Render nội dung thông báo từ Template và thay thế các biến động
export async function renderNotificationTemplate(type, variables = {}) {
    await connectDB();
    await seedNotificationTemplatesIfEmpty();

    let template = await NotificationTemplate.findOne({ type, is_active: true }).lean();
    if (!template) {
        template = DEFAULT_TEMPLATES.find(t => t.type === type) || {
            title_template: 'Thông báo từ hệ thống',
            content_template: 'Bạn có một thông báo mới.',
            default_level: 'REMINDER',
            default_priority: 3
        };
    }

    let title = template.title_template;
    let content = template.content_template;

    // Thay thế toàn bộ các biến dạng {{variableName}}
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        const val = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
        title = title.replace(regex, val);
        content = content.replace(regex, val);
    });

    return {
        title,
        content,
        level: template.default_level,
        priority: template.default_priority
    };
}

// Lấy toàn bộ cấu hình thông báo
export async function getNotificationSettings() {
    await connectDB();
    const settings = await NotificationSetting.find({}).lean();
    const map = {
        channel_zalo_enabled: true,
        channel_email_enabled: true,
        channel_inapp_enabled: true,
        auto_tuition_receipt: true,
        auto_test_score_notify: true,
        sla_reminder_minutes: 30,
        sla_warning_minutes: 60,
    };

    settings.forEach(s => {
        map[s.key] = s.value;
    });

    return map;
}

// Cập nhật cấu hình thông báo
export async function updateNotificationSetting(key, value, userId = null) {
    await connectDB();
    return NotificationSetting.findOneAndUpdate(
        { key },
        { value, updated_by: userId },
        { upsert: true, new: true }
    );
}

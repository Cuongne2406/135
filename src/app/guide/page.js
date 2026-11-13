import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const CONTENT = `# Kiến trúc & Luồng hoạt động

## 1. Upload ảnh / Minh chứng buổi học

### Sơ đồ luồng

\`\`\`
User chọn file (UI)
  → POST /api/updateimage (FormData: folderId + file + fileType)
    → Google Drive API: drive.files.create({ parents: [folderId], media: file })
    → Lưu file ID vào MongoDB
      → PostCourse.Detail[].DetailImage[] (hoặc TrialCourse.sessions[].images[])
  → Response: { data: [{ id, type }] }
\`\`\`

### Tạo thư mục Drive cho từng buổi học

Backend gọi **Google Apps Script** (Web App deployment) để tạo folder con:

\`\`\`
GET https://script.google.com/macros/s/AKfycbxhq2HUS3Jhhh0XF9PPr_ldJ1redmb1JAN5hZjaeYzvb_AyJiVifEXsW-MdKqpBfEeZww/exec
  ?Day=Buổi+1&Image=<parent-folder-id>
\`\`\`

Apps Script (\`doGet\`):

\`\`\`js
function doGet(data) {
  let { Day, Image } = data.parameter;
  var parentFolder = DriveApp.getFolderById(Image);
  var newFolder = parentFolder.createFolder(Day);
  return ContentService.createTextOutput(JSON.stringify({
    urls: \`\${newFolder.getId()}\`,
    status: "success"
  })).setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

Kết quả: tạo folder \`"<tên buổi>"\` bên trong folder cha → trả về ID folder mới → lưu vào \`Detail[].Image\`.

### API endpoints

| Endpoint | Method | Chức năng | File |
|---|---|---|---|
| \`/api/image\` | POST | Upload ảnh mới vào session | \`src/app/api/(image)/image/route.js\` |
| \`/api/image\` | PUT | Thay thế ảnh cũ (upload mới, xóa cũ) | same |
| \`/api/image\` | DELETE | Xóa ảnh khỏi Drive + DB | same |
| \`/api/updateimage\` | POST | Upload ảnh (PostCourse + TrialCourse) | \`src/app/api/(course)/updateimage/route.js\` |
| \`/api/updateimage\` | PUT | Thay thế ảnh (PostCourse + TrialCourse) | same |
| \`/api/updateimage\` | DELETE | Xóa ảnh | same |
| \`/api/updateimagestudent\` | POST | Gán ảnh session vào học sinh | \`src/app/api/(course)/updateimagestudent/route.js\` |
| \`/api/course\` | POST | Tạo course → gọi Apps Script tạo folder | \`src/app/api/(course)/course/route.js\` |
| \`/api/course/ucalendarcourse\` | POST | Tạo buổi bù → gọi Apps Script tạo folder | \`src/app/api/(course)/course/ucalendarcourse/route.js\` |

### Xác thực Google Drive

Dùng **service account** (googleapis):

\`\`\`js
const auth = new google.auth.GoogleAuth({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
\`\`\`

### URL hiển thị ảnh

- Ảnh: \`https://lh3.googleusercontent.com/d/\${fileId}=w800\`
- Ảnh thumb: \`https://lh3.googleusercontent.com/d/\${fileId}=w400\`
- Video embed: \`https://drive.google.com/file/d/\${fileId}/preview\`
- Video thumb: \`https://drive.google.com/thumbnail?id=\${fileId}\`
- Download: \`https://drive.google.com/uc?export=download&id=\${fileId}\`

### Folder ID cố định (không qua Apps Script)

| Mục đích | Folder ID | File code |
|---|---|---|
| Avatar học sinh | \`1h8n0ueMwKumXlYkCDKffgNCyKYRIUJQy\` | \`src/app/api/(student)/student/route.js\` |
| Ảnh bìa sách | \`17O3YymfFPxMfYLXvMxO7aAfJv50alJiI\` | \`src/app/api/(course)/book/route.js\` |
| Folder cha trial course | \`1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf\` | \`src/app/api/(course)/coursetry/route.js\` |

### Client UI

- Upload gallery: \`src/app/calendar/[id]/ui/formimage/index.js\`
- Gán ảnh cho học sinh: \`src/app/calendar/[id]/ui/formimages/index.js\`
- Component ảnh (replace/delete/download): \`src/components/(ui)/(image)/index.js\`

---

## 2. Lịch (Calendar)

### Cấu trúc trang

**Desktop** (\`hidden lg:flex\`): grid 7 cột, mỗi ô \`minHeight: 180\`, responsive padding/card.

**Mobile** (\`lg:hidden\`): danh sách 7 ngày dạng flex column, mỗi ngày:
- Trái: sidebar xanh dương (tên thứ, ngày) — \`w-[80px]\`
- Phải: \`DayLessons\` component — \`p-2 overflow-y-auto\`

### Highlight hôm nay

- Header ô: \`bg-red-600 text-white\`
- Cell: \`bg-red-50\`

### Nhãn ngày

\`\`\`js
['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
\`\`\`

### Buổi bù (Makeup)

- Nút "Tạo buổi bù" (xanh lá) hiển thị trong component Calendar entry
- \`openMakeupForCancelled\` prop truyền qua \`MoreIcons\` → \`ScheduleTable\`
- API: \`POST /api/course/ucalendarcourse\` → tạo folder Drive + buổi học mới

---

## 3. Quản lý người dùng (Teacher UI)

### File: \`src/app/teacher/ui/main/index.js\`

### Tính năng

| Tính năng | Mô tả |
|---|---|
| **Filter trạng thái** | Dropdown (Tất cả / Hoạt động / Đã vô hiệu) |
| **Menu hành động** | Fixed positioning (tránh overflow clip), tự động đảo chiều lên/xuống dựa trên khoảng cách tới bottom |
| **Nút 3-dot** | \`text-center relative\` + \`inline-flex items-center justify-center w-8 h-8\` |
| **Menu items** | Text only (không icon): "Thông tin tài khoản", "Vô hiệu/Kích hoạt", "Chuyển đổi role" |
| **Kiểm tra disabled** | Khi chuyển role trên tài khoản bị khóa → noti "Tài khoản đã bị khóa, không thể chuyển." trước API call |

### Responsive table

| Cột | Ẩn khi |
|---|---|
| Email | \`sm\` |
| SĐT | \`md\` |
| Ngày tạo | \`lg\` |

Padding: \`px-2 sm:px-4\`

### Menu positioning

\`\`\`js
const spaceBelow = window.innerHeight - rect.bottom;
menuH = 200;
menuPos = spaceBelow >= menuH ? rect.bottom + 4 : rect.top - menuH;
\`\`\`

---

## 4. Trang Cài đặt (Settings)

### File: \`src/app/setting/main.js\`

### Các tab

| Tab | Key | Component |
|---|---|---|
| Zalo Proxy | \`zalo\` | \`ZaloTab\` |
| Cấu hình SLA | \`sla\` | \`SlaTab\` |

### ZaloTab

- Danh sách tài khoản Zalo, search theo name/phone/uid
- Mỗi tài khoản hiển thị: avatar, tên, phone, UID, người dùng được gán
- Inline edit proxy (http://user:pass@host:port)
- Gọi \`PATCH /api/zalo/:id\` để lưu proxy

### SlaTab (Cấu hình SLA)

- Đọc: \`GET /api/notifications/settings\`
- Ghi: \`PUT /api/notifications/settings\`

| Key | Mô tả | Default |
|---|---|---|
| \`sla_reminder_minutes\` | Nhắc nhở điểm danh (phút) | 30 |
| \`sla_warning_minutes\` | Cảnh báo nhật ký (phút) | 60 |
| \`sla_resource_warning_minutes\` | Cảnh báo minh chứng (phút) | 90 |
| \`sla_incident_minutes\` | Vi phạm SLA (phút) | 120 |
| \`student_absent_threshold\` | Ngưỡng vắng học sinh | 3 |

---

## 5. Điểm danh (Attendance)

### File: \`src/app/academic/report/attendance-tab.js\`

- Luôn hiển thị 10 hàng (hàng trống dùng \`<tr>\` trắng)
- Sticky header: \`<thead className="sticky top-0 z-10">\` trong container \`overflow-auto\` với \`height: 560px\`
- Font size tăng
- Pagination: \`ITEMS_PER_PAGE\`
- Tab mặc định: \`useState('attendance')\` (file \`client.js\`)

---

## 6. Chi tiết khóa học (Course Detail)

### File: \`src/app/course/[...id]/ui/detailcourse/index.js\`

Các guard null-safe:

\`\`\`js
element.Cmt?.length || 0
element.Image?.length || 0
stu.Learn?.length || 0
learnDetailsArray?.length || 0
lesson?.LessonDetails?.Slide || data.Detail[0]
program.Image ? program.Image.split('/') : '/placeholder.png'
\`\`\`

---

## 7. Notification Settings (API)

### File: \`src/app/api/notifications/settings/route.js\`

| Method | Chức năng |
|---|---|
| GET | Lấy tất cả settings |
| PUT | Cập nhật một hoặc nhiều settings |

### Schema MongoDB (\`notificationSetting\`)

\`\`\`js
{
  key: String,        // unique
  value: Mixed,
  description: String,
  updated_by: ObjectId,
  timestamps: true
}
\`\`\`

Các key hiện tại: \`sla_reminder_minutes\`, \`sla_warning_minutes\`, \`sla_resource_warning_minutes\`, \`sla_incident_minutes\`, \`student_absent_threshold\`, \`teacher_late_report_threshold\`.
`

export default function GuidePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-color)]">
          📘 Hướng dẫn
        </h1>
        <div className="prose prose-sm max-w-none
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[var(--text-primary)] [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-[var(--border-color)]
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--text-primary)] [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul>li]:text-sm [&_ul>li]:text-[var(--text-primary)]
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol>li]:text-sm [&_ol>li]:text-[var(--text-primary)]
          [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-pink-600
          [&_pre]:bg-[#0d1117] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre>code]:bg-transparent [&_pre>code]:text-gray-100 [&_pre>code]:p-0
          [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4 [&_table]:text-sm
          [&_thead]:bg-gray-50 [&_thead]:border-b [&_thead]:border-gray-200
          [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[var(--text-primary)]
          [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-gray-100 [&_td]:text-[var(--text-primary)]
          [&_tr:last-child_td]:border-b-0
          [&_hr]:my-6 [&_hr]:border-[var(--border-color)]
          [&_strong]:font-semibold
          [&_a]:text-blue-600 [&_a]:hover:underline
          dark:[&_code]:bg-gray-800 dark:[&_pre]:bg-[#161b22] dark:[&_thead]:bg-gray-800 dark:[&_th]:text-gray-200 dark:[&_td]:text-gray-300 dark:[&_code]:text-pink-300"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {CONTENT}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

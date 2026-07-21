# Kiến trúc & Luồng hoạt động

## 1. Upload ảnh / Minh chứng buổi học

### Sơ đồ luồng

```
User chọn file (UI)
  → POST /api/updateimage (FormData: folderId + file + fileType)
    → Google Drive API: drive.files.create({ parents: [folderId], media: file })
    → Lưu file ID vào MongoDB
      → PostCourse.Detail[].DetailImage[] (hoặc TrialCourse.sessions[].images[])
  → Response: { data: [{ id, type }] }
```

### Tạo thư mục Drive cho từng buổi học

Backend gọi **Google Apps Script** (Web App deployment) để tạo folder con:

```
GET https://script.google.com/macros/s/AKfycbxhq2HUS3Jhhh0XF9PPr_ldJ1redmb1JAN5hZjaeYzvb_AyJiVifEXsW-MdKqpBfEeZww/exec
  ?Day=Buổi+1&Image=<parent-folder-id>
```

Apps Script (`doGet`):
```
function doGet(data) {
  let { Day, Image } = data.parameter;
  var parentFolder = DriveApp.getFolderById(Image);
  var newFolder = parentFolder.createFolder(Day);
  return ContentService.createTextOutput(JSON.stringify({
    urls: `${newFolder.getId()}`,
    status: "success"
  })).setMimeType(ContentService.MimeType.JSON);
}
```

Kết quả: tạo folder `"<tên buổi>"` bên trong folder cha → trả về ID folder mới → lưu vào `Detail[].Image`.

### API endpoints

| Endpoint | Method | Chức năng | File |
|---|---|---|---|
| `/api/image` | POST | Upload ảnh mới vào session | `src/app/api/(image)/image/route.js` |
| `/api/image` | PUT | Thay thế ảnh cũ (upload mới, xóa cũ) | same |
| `/api/image` | DELETE | Xóa ảnh khỏi Drive + DB | same |
| `/api/updateimage` | POST | Upload ảnh (PostCourse + TrialCourse) | `src/app/api/(course)/updateimage/route.js` |
| `/api/updateimage` | PUT | Thay thế ảnh (PostCourse + TrialCourse) | same |
| `/api/updateimage` | DELETE | Xóa ảnh | same |
| `/api/updateimagestudent` | POST | Gán ảnh session vào học sinh | `src/app/api/(course)/updateimagestudent/route.js` |
| `/api/course` | POST | Tạo course → gọi Apps Script tạo folder | `src/app/api/(course)/course/route.js` |
| `/api/course/ucalendarcourse` | POST | Tạo buổi bù → gọi Apps Script tạo folder | `src/app/api/(course)/course/ucalendarcourse/route.js` |

### Xác thực Google Drive

Dùng **service account** (googleapis):

```js
const auth = new google.auth.GoogleAuth({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
```

### URL hiển thị ảnh

- Ảnh: `https://lh3.googleusercontent.com/d/${fileId}=w800`
- Ảnh thumb: `https://lh3.googleusercontent.com/d/${fileId}=w400`
- Video embed: `https://drive.google.com/file/d/${fileId}/preview`
- Video thumb: `https://drive.google.com/thumbnail?id=${fileId}`
- Download: `https://drive.google.com/uc?export=download&id=${fileId}`

### Folder ID cố định (không qua Apps Script)

| Mục đích | Folder ID | File code |
|---|---|---|
| Avatar học sinh | `1h8n0ueMwKumXlYkCDKffgNCyKYRIUJQy` | `src/app/api/(student)/student/route.js` |
| Ảnh bìa sách | `17O3YymfFPxMfYLXvMxO7aAfJv50alJiI` | `src/app/api/(course)/book/route.js` |
| Folder cha trial course | `1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf` | `src/app/api/(course)/coursetry/route.js` |

### Client UI

- Upload gallery: `src/app/calendar/[id]/ui/formimage/index.js`
- Gán ảnh cho học sinh: `src/app/calendar/[id]/ui/formimages/index.js`
- Component ảnh (replace/delete/download): `src/components/(ui)/(image)/index.js`

---

## 2. Google Drive Storage & Quota

### Thông tin Shared Drive

| Thông tin | Giá trị |
|---|---|
| Shared Drive ID | `0AK_Z4-cveE6dUk9PVA` |
| Tên Shared Drive | JOB_Lab |
| Service account | `air-900@systemair-441909.iam.gserviceaccount.com` |

### Giới hạn

Google Drive API (`about.get`) chỉ trả về quota của cá nhân service account (15 GB), không trả về quota của Shared Drive hay tổ chức. Do đó không thể hiển thị % dung lượng Shared Drive tự động — đã loại bỏ khỏi UI.

---

## 3. Lịch (Calendar)

### Cấu trúc trang

**Desktop** (`hidden lg:flex`): grid 7 cột, mỗi ô `minHeight: 180`, responsive padding/card.

**Mobile** (`lg:hidden`): danh sách 7 ngày dạng flex column, mỗi ngày:
- Trái: sidebar xanh dương (tên thứ, ngày) — `w-[80px]`
- Phải: `DayLessons` component — `p-2 overflow-y-auto`

### Highlight hôm nay

- Header ô: `bg-red-600 text-white`
- Cell: `bg-red-50`

### Nhãn ngày

```js
['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
```

### Buổi bù (Makeup)

- Nút "Tạo buổi bù" (xanh lá) hiển thị trong component Calendar entry
- `openMakeupForCancelled` prop truyền qua `MoreIcons` → `ScheduleTable`
- API: `POST /api/course/ucalendarcourse` → tạo folder Drive + buổi học mới

---

## 4. Quản lý người dùng (Teacher UI)

### File: `src/app/teacher/ui/main/index.js`

### Tính năng

| Tính năng | Mô tả |
|---|---|
| **Filter trạng thái** | Dropdown (Tất cả / Hoạt động / Đã vô hiệu) |
| **Menu hành động** | Fixed positioning (tránh overflow clip), tự động đảo chiều lên/xuống dựa trên khoảng cách tới bottom |
| **Nút 3-dot** | `text-center relative` + `inline-flex items-center justify-center w-8 h-8` |
| **Menu items** | Text only (không icon): "Thông tin tài khoản", "Vô hiệu/Kích hoạt", "Chuyển đổi role" |
| **Kiểm tra disabled** | Khi chuyển role trên tài khoản bị khóa → noti "Tài khoản đã bị khóa, không thể chuyển." trước API call |

### Responsive table

| Cột | Ẩn khi |
|---|---|
| Email | `sm` |
| SĐT | `md` |
| Ngày tạo | `lg` |

Padding: `px-2 sm:px-4`

### Menu positioning

```js
const spaceBelow = window.innerHeight - rect.bottom;
menuH = 200; // chiều cao menu ước lượng
menuPos = spaceBelow >= menuH ? rect.bottom + 4 : rect.top - menuH;
```

---

## 5. Trang Cài đặt (Settings)

### File: `src/app/setting/main.js`

### Các tab

| Tab | Key | Component |
|---|---|---|
| Zalo Proxy | `zalo` | `ZaloTab` |
| Cấu hình SLA | `sla` | `SlaTab` |

### ZaloTab

- Danh sách tài khoản Zalo, search theo name/phone/uid
- Mỗi tài khoản hiển thị: avatar, tên, phone, UID, người dùng được gán
- Inline edit proxy (http://user:pass@host:port)
- Gọi `PATCH /api/zalo/:id` để lưu proxy

### SlaTab (Cấu hình SLA)

- Đọc: `GET /api/notifications/settings`
- Ghi: `PUT /api/notifications/settings`

| Key | Mô tả | Default |
|---|---|---|
| `sla_reminder_minutes` | Nhắc nhở điểm danh (phút) | 30 |
| `sla_warning_minutes` | Cảnh báo nhật ký (phút) | 60 |
| `sla_resource_warning_minutes` | Cảnh báo minh chứng (phút) | 90 |
| `sla_incident_minutes` | Vi phạm SLA (phút) | 120 |
| `student_absent_threshold` | Ngưỡng vắng học sinh | 3 |

---

## 6. Điểm danh (Attendance)

### File: `src/app/academic/report/attendance-tab.js`

- Luôn hiển thị 10 hàng (hàng trống dùng `<tr>` trắng)
- Sticky header: `<thead className="sticky top-0 z-10">` trong container `overflow-auto` với `height: 560px`
- Font size tăng
- Pagination: `ITEMS_PER_PAGE`
- Tab mặc định: `useState('attendance')` (file `client.js`)

---

## 7. Chi tiết khóa học (Course Detail)

### File: `src/app/course/[...id]/ui/detailcourse/index.js`

Các guard null-safe:

```js
element.Cmt?.length || 0
element.Image?.length || 0
stu.Learn?.length || 0
learnDetailsArray?.length || 0
lesson?.LessonDetails?.Slide || data.Detail[0]
program.Image ? program.Image.split('/') : '/placeholder.png'
```

---

## 8. Notification Settings (API)

### File: `src/app/api/notifications/settings/route.js`

| Method | Chức năng |
|---|---|
| GET | Lấy tất cả settings |
| PUT | Cập nhật một hoặc nhiều settings |

### Schema MongoDB (`notificationSetting`)

```js
{
  key: String,        // unique
  value: Mixed,
  description: String,
  updated_by: ObjectId,
  timestamps: true
}
```

Các key hiện tại: `sla_reminder_minutes`, `sla_warning_minutes`, `sla_resource_warning_minutes`, `sla_incident_minutes`, `student_absent_threshold`, `teacher_late_report_threshold`.

# MODULE THÔNG BÁO HỆ THỐNG & HEADER NOTIFICATION

**Phiên bản:** 1.0  
**Ngày:** 09/07/2026  
**Trạng thái:** Đặc tả thiết kế  
**Hệ thống:** Air Manager — Quản lý Đào tạo, Giảng dạy & Giám sát Chất lượng Lớp học

---

## Mục lục

1. [Mục tiêu module](#1-mục-tiêu-module)
2. [Vị trí hiển thị trên giao diện](#2-vị-trí-hiển-thị-trên-giao-diện)
3. [Thiết kế danh sách thông báo](#3-thiết-kế-danh-sách-thông-báo)
4. [Thiết kế trang chi tiết thông báo](#4-thiết-kế-trang-chi-tiết-thông-báo)
5. [Phân loại thông báo](#5-phân-loại-thông-báo)
6. [Cấp độ thông báo](#6-cấp-độ-thông-báo)
7. [Cơ chế tự động tạo thông báo](#7-cơ-chế-tự-động-tạo-thông-báo)
8. [Phân quyền nhận thông báo](#8-phân-quyền-nhận-thông-báo)
9. [Luồng xử lý thông báo](#9-luồng-xử-lý-thông-báo)
10. [Tính năng hành động nhanh](#10-tính-năng-hành-động-nhanh)
11. [Thiết kế dữ liệu](#11-thiết-kế-dữ-liệu)
12. [Thiết kế API](#12-thiết-kế-api)
13. [Thiết kế realtime](#13-thiết-kế-realtime)
14. [Tích hợp với dashboard và trung tâm xử lý sự cố](#14-tích-hợp-với-dashboard-và-trung-tâm-xử-lý-sự-cố)
15. [UI/UX đề xuất](#15-uiux-đề-xuất)
16. [Checklist nghiệm thu](#16-checklist-nghiệm-thu)
17. [Yêu cầu đầu ra](#17-yêu-cầu-đầu-ra)

---

## 1. Mục tiêu module

### 1.1. Vấn đề hiện tại

- Học vụ phải kiểm tra thủ công từng lớp, từng buổi học để phát hiện thiếu sót.
- Giáo viên không được nhắc nhở kịp thời khi chưa hoàn tất báo cáo, điểm danh, nhật ký.
- Admin Sys không có kênh tập trung để nhận cảnh báo lỗi hệ thống hoặc bất thường bảo mật.
- Không có cơ chế theo dõi thời gian thực, dẫn đến vi phạm SLA nhưng không ai biết.
- Các cảnh báo trong báo cáo dashboard chỉ hiển thị khi Học vụ chủ động vào xem.

### 1.2. Mục tiêu

Module thông báo hệ thống giải quyết các vấn đề trên bằng cách:

1. **Tự động phát hiện và gửi thông báo** khi có vấn đề phát sinh (thiếu điểm danh, thiếu nhật ký, vi phạm SLA, ...).
2. **Cập nhật thời gian thực** qua icon chuông trên header — Học vụ không cần vào từng lớp để kiểm tra.
3. **Phân quyền thông minh** — mỗi vai trò chỉ nhận thông báo liên quan đến phạm vi trách nhiệm.
4. **Hỗ trợ hành động nhanh** — xử lý ngay từ thông báo mà không cần điều hướng nhiều bước.
5. **Theo dõi vòng đời** — từ phát hiện → cảnh báo → xử lý → đóng, có audit log đầy đủ.

### 1.3. Đối tượng hưởng lợi

| Vai trò | Lợi ích chính |
|---------|---------------|
| **Học vụ** | Nắm toàn bộ vấn đề các lớp theo thời gian thực, không cần kiểm tra thủ công. Phát hiện và xử lý sự cố ngay khi phát sinh. |
| **Giáo viên** | Được nhắc nhở kịp thời các đầu việc cần hoàn tất sau buổi học. Biết được phản hồi và yêu cầu từ Học vụ. |
| **Admin Sys** | Nhận cảnh báo về bảo mật, lỗi hệ thống, cấu hình mà không cần theo dõi log thủ công. |

---

## 2. Vị trí hiển thị trên giao diện

### 2.1. Bố cục header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Logo] [Tên hệ thống]    [🔍 Tìm kiếm...]    [🔔 3] [👤 Avatar ▼] │
└──────────────────────────────────────────────────────────────────────┘
```

Header gồm 4 khu vực chính (từ trái sang phải):

| Khu vực | Thành phần | Mô tả |
|---------|-----------|-------|
| Trái | Logo + Tên hệ thống | Link về trang chủ, ẩn trên mobile |
| Giữa | Thanh tìm kiếm | Tìm kiếm toàn hệ thống (có thể tùy chọn theo role) |
| Phải | 🔔 Notification bell + Badge | Icon chuông + số lượng chưa đọc |
| Phải | Avatar + Dropdown | Menu tài khoản: Thông tin cá nhân, Đổi mật khẩu, Đăng xuất |

### 2.2. Trạng thái icon chuông

| Trạng thái | Icon | Badge | Màu badge |
|------------|------|-------|-----------|
| Không có thông báo mới | `🔔` | Ẩn | — |
| Có thông báo mới (1-9) | `🔔` | Số | `bg-red-500` |
| Có thông báo mới (≥10) | `🔔` | `9+` | `bg-red-500` |
| Có Incident ưu tiên cao | `🔔` (rung animation) | Số | `bg-red-500` pulse |

### 2.3. Dropdown thông báo

Khi bấm vào icon chuông:

```
┌─────────────────────────────────────┐
│ Thông báo                    [🔔]  │
│ ─────────────────────────────────── │
│ [Tất cả | Chưa đọc | Cảnh báo | Sự cố | SLA] │
│ ─────────────────────────────────── │
│ [🔴] Thiếu nhật ký buổi học        │
│      Lớp Robotics A1 · 2 phút trước│
│ ─────────────────────────────────── │
│ [🟡] Cảnh báo SLA sắp hết giờ      │
│      Lớp Toán Tư Duy · 15 phút trước│
│ ─────────────────────────────────── │
│ [🔵] Học viên vắng 3 buổi liên tiếp│
│      Nguyễn Văn A - Lớp Tiếng Anh  │
│ ─────────────────────────────────── │
│              [Xem tất cả]           │
└─────────────────────────────────────┘
```

### 2.4. Các nút chức năng trong dropdown

| Nút | Vị trí | Hành động |
|-----|--------|-----------|
| `🔔` | Header dropdown | Đánh dấu tất cả đã đọc |
| `[Tất cả | Chưa đọc | Cảnh báo | Sự cố | SLA]` | Dưới tiêu đề | Lọc nhanh danh sách |
| `[Xem tất cả]` | Cuối dropdown | Điều hướng đến trang `/notifications` |

---

## 3. Thiết kế danh sách thông báo

### 3.1. Cấu trúc một item trong dropdown

```
┌──────────────────────────────────────────────┐
│ [🔴] Thiếu nhật ký buổi học                  │
│      Lớp Robotics A1 đã kết thúc 60 phút     │
│      nhưng giáo viên chưa cập nhật nhật ký.  │
│      👤 GV: Nguyễn Văn B · 🏫 Robotics A1    │
│      🕐 2 phút trước                    [📘] │
└──────────────────────────────────────────────┘
```

### 3.2. Các field hiển thị

| Field | Hiển thị | Ví dụ |
|-------|----------|-------|
| Icon cấp độ | `🔴` `🟡` `🟢` `🔵` | `🔴` = Incident |
| Tiêu đề | Bold, 14px | "Thiếu nhật ký buổi học" |
| Nội dung tóm tắt | Gray, 13px, 2 dòng | "Lớp Robotics A1 đã kết thúc 60 phút..." |
| Người liên quan | `👤 Tên` | "GV: Nguyễn Văn B" |
| Lớp liên quan | `🏫 Tên lớp` | "Robotics A1" |
| Thời gian | Relative time | "2 phút trước", "1 giờ trước" |
| Trạng thái đọc | Nền/viền | Chưa đọc: `bg-blue-50`, Đã đọc: nền trắng |
| Nút hành động nhanh | Icon hoặc text | `📘` Xem buổi học |

### 3.3. Các loại thông báo và icon tương ứng

| Loại | Icon | Màu |
|------|------|-----|
| Thiếu điểm danh | `📋` | `🟡` Warning |
| Thiếu nhật ký | `📝` | `🟡` Warning |
| Thiếu tài nguyên | `📎` | `🟡` Warning |
| Vi phạm SLA | `⏰` | `🔴` Incident |
| Học viên vắng nhiều | `👤` | `🔵` Reminder |
| Giáo viên trễ báo cáo | `📊` | `🟡` Warning |
| Thiếu bài giảng | `📖` | `🟡` Warning |
| Sự cố cần xử lý | `🚨` | `🔴` Incident |
| Hệ thống | `⚙️` | `🔵` Info |

---

## 4. Thiết kế trang chi tiết thông báo

### 4.1. Layout trang `/notifications/[id]`

```
┌──────────────────────────────────────────────────────────┐
│ ← Quay lại danh sách thông báo    [Đánh dấu đã xử lý ▼] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [🔴] [INCIDENT] Vi phạm SLA - Thiếu nhật ký buổi học   │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  Mã thông báo:       NOTI-20260709-00042                 │
│  Loại cảnh báo:      THIEU_NHAT_KY                      │
│  Cấp độ:             🔴 Incident                         │
│  Trạng thái:         ⏳ Đang xử lý                       │
│  Ngày tạo:           09/07/2026 14:30                    │
│  Thời gian SLA:      09/07/2026 16:30                    │
│                                                          │
│  ─── Thông tin liên quan ───                            │
│  Lớp học:            Robotics A1                         │
│  Buổi học:           Buổi 12 - 09/07/2026 13:30-15:00   │
│  Giáo viên:          Nguyễn Văn B                        │
│  Học viên:           [Danh sách 8 học viên]              │
│                                                          │
│  ─── Nội dung ───                                       │
│  Lớp Robotics A1 đã kết thúc lúc 15:00 ngày 09/07/2026. │
│  Đã quá 120 phút nhưng giáo viên Nguyễn Văn B chưa      │
│  hoàn tất báo cáo buổi học. Vi phạm SLA.                │
│                                                          │
│  ─── Hành động ───                                      │
│  [📘 Xem buổi học] [👤 Nhắc giáo viên]                  │
│  [🔄 Cập nhật thay] [🚨 Chuyển thành sự cố]            │
│  [✅ Đã xử lý] [🔒 Đóng thông báo]                      │
│                                                          │
│  ─── Lịch sử thao tác ───                               │
│  09/07 15:00  Hệ thống    Khởi tạo thông báo            │
│  09/07 15:30  Hệ thống    Nâng cấp → Incident           │
│  09/07 15:32  Học vụ      Đã xem                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2. Thông tin chi tiết

| Thông tin | Mô tả |
|-----------|-------|
| Mã thông báo | Format `NOTI-YYYYMMDD-NNNNN`, tự sinh |
| Tiêu đề | Tự động sinh từ loại + đối tượng |
| Nội dung đầy đủ | Mô tả chi tiết vấn đề, thời gian, dữ liệu liên quan |
| Loại cảnh báo | Mã enum loại thông báo |
| Cấp độ cảnh báo | `REMINDER` / `WARNING` / `INCIDENT` |
| Đối tượng liên quan | Lớp, buổi học, giáo viên, học viên (có link) |
| Thời điểm phát sinh | Thời gian tạo |
| Thời gian SLA | Thời hạn cuối phải xử lý (nếu có) |
| Trạng thái xử lý | UNREAD / READ / IN_PROGRESS / RESOLVED / CLOSED / ESCALATED |
| Người nhận | Danh sách người dùng thuộc diện nhận |
| Lịch sử thao tác | Audit log: ai làm gì, lúc nào |

### 4.3. Các nút hành động

| Nút | Hành động | Điều kiện |
|-----|-----------|-----------|
| `Xem buổi học` | Điều hướng `/calendar/[id]` | Luôn hiển thị |
| `Nhắc giáo viên` | Gửi thông báo nhắc nhở đến GV | Học vụ/Admin |
| `Cập nhật thay` | Mở form thay đổi, bắt buộc nhập lý do | Học vụ |
| `Chuyển thành sự cố` | Nâng cấp lên INCIDENT, thông báo Học vụ | Học vụ |
| `Đánh dấu đã đọc` | Chuyển UNREAD → READ | Người nhận |
| `Đánh dấu đã xử lý` | Chuyển → RESOLVED, ghi nhận người xử lý | Học vụ |
| `Đóng thông báo` | Chuyển → CLOSED | Học vụ/Admin |
| `Xem lịch sử` | Mở modal audit log | Luôn hiển thị |

---

## 5. Phân loại thông báo

### 5.1. Bảng phân loại

| # | Mã loại | Nhóm | Mô tả | Vai trò nhận |
|---|---------|------|-------|-------------|
| 1 | MISSING_ATTENDANCE | Vận hành lớp học | Thiếu điểm danh sau buổi học | GV, Học vụ |
| 2 | MISSING_REASON | Vận hành lớp học | Thiếu lý do vắng/đi muộn | GV, Học vụ |
| 3 | MISSING_LESSON_LOG | Vận hành lớp học | Thiếu nhật ký buổi học | GV, Học vụ |
| 4 | MISSING_RESOURCE | Tài nguyên | Thiếu video/tài liệu/ link | GV, Học vụ |
| 5 | SLA_VIOLATION | SLA | Vi phạm thời gian quy định | Học vụ |
| 6 | STUDENT_ABSENT_MANY | Học viên | Học viên vắng/đi muộn nhiều buổi | Học vụ, GV |
| 7 | TEACHER_LATE_REPORT | Giáo viên | GV nộp báo cáo trễ nhiều lần | Học vụ |
| 8 | LESSON_NOT_READY | Bài giảng | Lớp sắp học nhưng chưa có bài giảng | Học vụ, GV |
| 9 | INCIDENT | Sự cố | Sự cố cần Học vụ xử lý | Học vụ |
| 10 | SYSTEM_ERROR | Hệ thống | Lỗi hệ thống, bảo mật | Admin Sys |
| 11 | ACCOUNT_ISSUE | Hệ thống | Vấn đề tài khoản/phân quyền | Admin Sys |

### 5.2. Nhóm thông báo

| Nhóm | Màu sắc | Mô tả |
|------|---------|-------|
| Vận hành lớp học | `🟡` | Các thông báo liên quan đến thao tác sau buổi học |
| Tài nguyên | `🟡` | Thiếu tài nguyên, video, tài liệu |
| SLA | `🔴` | Vi phạm thời hạn quy định |
| Học viên | `🔵` | Cảnh báo liên quan đến hành vi học viên |
| Giáo viên | `🟡` | Cảnh báo hiệu suất giáo viên |
| Bài giảng | `🟡` | Chuẩn bị bài giảng trước buổi học |
| Sự cố | `🔴` | Sự cố khẩn cấp cần xử lý ngay |
| Hệ thống | `🔵` | Thông báo kỹ thuật, bảo mật |

---

## 6. Cấp độ thông báo

### 6.1. Ba cấp độ

```
REMINDER (🔵) ──→ WARNING (🟡) ──→ INCIDENT (🔴)
  Nhắc nhẹ           Cảnh báo          Sự cố
```

### 6.2. Chi tiết từng cấp độ

| Thuộc tính | REMINDER | WARNING | INCIDENT |
|------------|----------|---------|----------|
| **Icon** | `🔵` `📋` | `🟡` `⚠️` | `🔴` `🚨` |
| **Màu sắc** | `text-blue-600` `bg-blue-50` | `text-yellow-600` `bg-yellow-50` | `text-red-600` `bg-red-50` |
| **Mức ưu tiên** | Thấp (P3) | Trung bình (P2) | Cao (P1) |
| **Âm thanh** | Không | Không | Có (tùy chọn) |
| **Animation** | Không | Không | Icon chuông rung + pulse |
| **Thời hạn xử lý** | 24h | 4h | 1h |
| **Gửi email** | Không | Có (bản tin tổng hợp) | Có (ngay lập tức) |
| **Hiển thị dashboard** | Phụ | Phụ | Chính (section riêng) |
| **Đối tượng** | GV (chính), Học vụ (tham khảo) | GV + Học vụ | Học vụ (chính), Admin (nếu cần) |

### 6.3. Cách xử lý theo cấp độ

| Cấp độ | Cách xử lý |
|--------|-----------|
| REMINDER | Giáo viên chủ động khắc phục. Học vụ theo dõi nhưng không cần can thiệp. |
| WARNING | Giáo viên cần khắc phục ngay. Học vụ theo dõi và có thể nhắc nhở. |
| INCIDENT | Học vụ phải xử lý ngay. Có thể gán cho người phụ trách, theo dõi SLA. |

---

## 7. Cơ chế tự động tạo thông báo

### 7.1. Timeline sau buổi học

```
Buổi học kết thúc (T+0)
    │
    ├── Kiểm tra điểm danh
    │   ├── Đã điểm danh đủ → OK
    │   └── Thiếu → Chuyển trạng thái "Chờ báo cáo"
    │
T+30 phút
    │
    ├── Kiểm tra điểm danh + lý do
    │   ├── Đã đầy đủ → OK
    │   └── Thiếu → Gửi REMINDER đến GV
    │
T+60 phút
    │
    ├── Kiểm tra nhật ký buổi học
    │   ├── Đã có → OK
    │   └── Chưa → Gửi WARNING đến GV + Học vụ
    │
T+90 phút
    │
    ├── Kiểm tra tài nguyên (video, tài liệu, link)
    │   ├── Đã đủ → OK
    │   └── Thiếu → Gửi WARNING đến GV
    │
T+120 phút (SLA)
    │
    └── Kiểm tra báo cáo buổi học
        ├── Hoàn tất → OK
        └── Chưa → Đánh dấu vi phạm SLA
                      Nâng cấp → INCIDENT
                      Gửi ưu tiên cao → Học vụ
```

### 7.2. Bảng tham số SLA

| Tham số | Giá trị mặc định | Có thể cấu hình | Ghi chú |
|---------|-----------------|----------------|---------|
| `sla_reminder_minutes` | 30 | Có | Thời gian gửi REMINDER |
| `sla_warning_minutes` | 60 | Có | Thời gian gửi WARNING nhật ký |
| `sla_resource_warning_minutes` | 90 | Có | Thời gian gửi WARNING tài nguyên |
| `sla_incident_minutes` | 120 | Có | Thời gian vi phạm SLA |
| `student_absent_threshold` | 3 | Có | Số buổi vắng liên tiếp để cảnh báo |
| `teacher_late_report_threshold` | 3 | Có | Số lần trễ báo cáo để cảnh báo |

### 7.3. Các điều kiện kiểm tra khác

| Điều kiện | Thời điểm kiểm tra | Hành động |
|-----------|-------------------|-----------|
| Học viên vắng ≥ N buổi liên tiếp | Sau mỗi buổi học | Tạo WARNING cho Học vụ + GV |
| Giáo viên trễ báo cáo ≥ N lần | Sau mỗi lần trễ | Tạo WARNING cho Học vụ |
| Lớp sắp học (trong 24h) nhưng chưa có bài giảng | Chạy cron hàng ngày | Tạo REMINDER cho GV + Học vụ |
| Hệ thống lỗi kết nối database | Ngay khi phát hiện | Tạo INCIDENT cho Admin Sys |
| Tài khoản đăng nhập bất thường | Ngay khi phát hiện | Tạo WARNING cho Admin Sys |

---

## 8. Phân quyền nhận thông báo

### 8.1. Ma trận phân quyền

| Loại thông báo | Admin Sys | Học vụ | Giáo viên |
|----------------|-----------|--------|-----------|
| MISSING_ATTENDANCE | — | ✅ | ✅ (lớp được phân công) |
| MISSING_REASON | — | ✅ | ✅ (lớp được phân công) |
| MISSING_LESSON_LOG | — | ✅ | ✅ (lớp được phân công) |
| MISSING_RESOURCE | — | ✅ | ✅ (lớp được phân công) |
| SLA_VIOLATION | — | ✅ | — |
| STUDENT_ABSENT_MANY | — | ✅ | ✅ (lớp được phân công) |
| TEACHER_LATE_REPORT | — | ✅ | — |
| LESSON_NOT_READY | — | ✅ | ✅ (lớp được phân công) |
| INCIDENT | — | ✅ | — |
| SYSTEM_ERROR | ✅ | — | — |
| ACCOUNT_ISSUE | ✅ | — | — |

### 8.2. Nguyên tắc phân quyền

1. **Admin Sys**: Chỉ nhận thông báo hệ thống — không nhận thông báo vận hành lớp học.
2. **Học vụ**: Nhận toàn bộ thông báo vận hành, SLA, sự cố — không nhận thông báo hệ thống trừ khi được cấp thêm quyền.
3. **Giáo viên**: Chỉ nhận thông báo của lớp được phân công — không thấy thông báo lớp khác. Không nhận SLA, không nhận sự cố (trừ khi được tag).
4. **Lọc dữ liệu**: Khi lấy danh sách thông báo, backend phải kiểm tra vai trò + phạm vi (lớp được phân công) để trả về dữ liệu chính xác.

---

## 9. Luồng xử lý thông báo

### 9.1. Sơ đồ luồng

```
[Phát hiện] → [Tạo thông báo] → [Gán người nhận] → [Gửi realtime]
                                                          │
                                                          ▼
                                              [Hiển thị trên header]
                                                          │
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                        [Người dùng xem]    [Hết hạn SLA]
                                              │                       │
                                              ▼                       ▼
                                      [Thực hiện hành động]   [Nâng cấp cảnh báo]
                                              │                       │
                                              ▼                       ▼
                                      [Cập nhật trạng thái]   [Gửi thông báo mới]
                                              │
                                              ▼
                                      [Đóng thông báo]
```

### 9.2. Các trạng thái thông báo

| Mã trạng thái | Tên | Mô tả | Icon |
|--------------|-----|-------|------|
| `UNREAD` | Chưa đọc | Thông báo mới tạo, người dùng chưa xem | 🔵 |
| `READ` | Đã đọc | Người dùng đã mở xem | 🟢 |
| `IN_PROGRESS` | Đang xử lý | Người dùng đã thực hiện hành động, đang xử lý | 🟡 |
| `RESOLVED` | Đã xử lý | Vấn đề đã được giải quyết | ✅ |
| `CLOSED` | Đã đóng | Thông báo đã đóng, không cần theo dõi | 🔒 |
| `ESCALATED` | Đã nâng cấp | Đã chuyển thành sự cố cấp cao hơn | 🚨 |

### 9.3. Sơ đồ trạng thái

```
        ┌─→ UNREAD ──→ READ ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
        │                               │
        └─── (hết hạn SLA) ─────────────┘
                    │
                    ▼
              ESCALATED ──→ IN_PROGRESS ──→ RESOLVED ──→ CLOSED
```

### 9.4. Audit log

Mỗi thao tác trên thông báo phải được ghi lại:

| Trường | Mô tả |
|--------|-------|
| `notification_id` | ID thông báo |
| `actor_id` | Người thực hiện (hoặc "system") |
| `action` | Hành động: CREATE, VIEW, UPDATE_STATUS, REMIND, ASSIGN, CLOSE, ESCALATE |
| `old_status` | Trạng thái trước |
| `new_status` | Trạng thái sau |
| `note` | Ghi chú (bắt buộc nếu là UPDATE_TEACHER) |
| `created_at` | Thời gian |

---

## 10. Tính năng hành động nhanh

### 10.1. Danh sách hành động

| # | Hành động | API | Quyền | Ghi chú |
|---|-----------|-----|-------|---------|
| 1 | `Xem chi tiết lớp` | `GET /course/[...id]` | Tất cả | Mở tab mới |
| 2 | `Xem chi tiết buổi học` | `GET /calendar/[id]` | Tất cả | Mở tab mới |
| 3 | `Nhắc giáo viên` | `POST /api/notifications/remind` | Học vụ | Gửi notification đến GV |
| 4 | `Nhắc Học vụ` | `POST /api/notifications/remind` | GV | Gửi notification đến Học vụ |
| 5 | `Cập nhật thay giáo viên` | `PUT /api/course/[id]/teacher` | Học vụ | Bắt buộc nhập lý do |
| 6 | `Chuyển thành sự cố` | `POST /api/notifications/escalate` | Học vụ | Nâng cấp lên INCIDENT |
| 7 | `Đánh dấu đã đọc` | `PUT /api/notifications/read` | Người nhận | Cập nhật cá nhân |
| 8 | `Đánh dấu đã xử lý` | `PUT /api/notifications/resolve` | Học vụ | Kèm ghi chú |
| 9 | `Đóng thông báo` | `PUT /api/notifications/close` | Học vụ | Kèm lý do |
| 10 | `Xem lịch sử xử lý` | `GET /api/notifications/[id]/logs` | Tất cả | Modal audit log |

### 10.2. Quy tắc "Cập nhật thay giáo viên"

Khi Học vụ thực hiện "Cập nhật thay giáo viên":

1. Bắt buộc nhập lý do thay đổi (text, min 20 ký tự).
2. Hệ thống tự động tạo thông báo mới loại `SYSTEM` cho giáo viên cũ.
3. Hệ thống ghi log với lý do vào `notification_logs`.
4. Hệ thống cập nhật thông tin giáo viên trong buổi học.
5. Nếu thông báo gốc có trạng thái IN_PROGRESS, tự động chuyển sang RESOLVED.

---

## 11. Thiết kế dữ liệu

### 11.1. Bảng `notifications`

```javascript
{
  _id: ObjectId,
  code: String,                    // "NOTI-20260709-00042"
  title: String,                   // "Thiếu nhật ký buổi học"
  content: String,                 // Nội dung chi tiết
  type: String,                    // enum: MISSING_ATTENDANCE, ...
  level: String,                   // enum: REMINDER, WARNING, INCIDENT
  status: String,                  // enum: UNREAD, READ, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED
  priority: Number,                // 1 (cao) / 2 (trung bình) / 3 (thấp)
  
  // Đối tượng liên quan
  ref_course: ObjectId,            // Khóa học (nếu có)
  ref_lesson: ObjectId,            // Buổi học (nếu có)
  ref_teacher: ObjectId,           // Giáo viên (nếu có)
  ref_student: ObjectId,           // Học viên (nếu có)
  
  // SLA
  sla_deadline: Date,              // Thời hạn SLA
  sla_violated_at: Date,           // Thời điểm vi phạm (nếu có)
  
  // Metadata
  created_by: String,              // "system" hoặc user_id
  created_at: Date,
  updated_at: Date,
  resolved_at: Date,
  closed_at: Date,
  resolved_by: ObjectId,
  closed_by: ObjectId
}
```

**Indexes:**
- `{ status: 1, level: 1, created_at: -1 }` — query danh sách
- `{ ref_course: 1, status: 1 }` — query theo lớp
- `{ ref_teacher: 1, status: 1 }` — query theo giáo viên
- `{ sla_deadline: 1, status: 1 }` — kiểm tra SLA
- `{ code: 1 }` — unique

### 11.2. Bảng `notification_recipients`

```javascript
{
  _id: ObjectId,
  notification_id: ObjectId,       // FK → notifications
  user_id: ObjectId,               // FK → users
  role: String,                    // admin, hocvu, teacher
  status: String,                  // UNREAD, READ
  read_at: Date,
  is_acknowledged: Boolean        // Đã xác nhận xử lý?
}
```

**Indexes:**
- `{ user_id: 1, status: 1, created_at: -1 }` — query thông báo của user
- `{ notification_id: 1, user_id: 1 }` — unique

### 11.3. Bảng `notification_logs`

```javascript
{
  _id: ObjectId,
  notification_id: ObjectId,       // FK → notifications
  actor_id: ObjectId,              // user_id hoặc "system"
  actor_name: String,              // Denormalize để hiển thị nhanh
  action: String,                  // CREATE, VIEW, UPDATE_STATUS, REMIND, ASSIGN, CLOSE, ESCALATE
  old_status: String,
  new_status: String,
  note: String,                    // Ghi chú (bắt buộc nếu là UPDATE_TEACHER)
  metadata: Object,                // Dữ liệu bổ sung (VD: { teacher_from: X, teacher_to: Y })
  created_at: Date
}
```

**Indexes:**
- `{ notification_id: 1, created_at: 1 }`

### 11.4. Bảng `notification_settings`

```javascript
{
  _id: ObjectId,
  key: String,                    // "sla_reminder_minutes", "student_absent_threshold", ...
  value: Mixed,                   // 30, 3, ...
  description: String,            // Mô tả tham số
  updated_by: ObjectId,
  updated_at: Date
}
```

**Seed data:**

| key | value | description |
|-----|-------|-------------|
| `sla_reminder_minutes` | 30 | Thời gian gửi REMINDER sau buổi học |
| `sla_warning_minutes` | 60 | Thời gian gửi WARNING nhật ký |
| `sla_resource_warning_minutes` | 90 | Thời gian gửi WARNING tài nguyên |
| `sla_incident_minutes` | 120 | Thời gian vi phạm SLA |
| `student_absent_threshold` | 3 | Số buổi vắng liên tiếp để cảnh báo |
| `teacher_late_report_threshold` | 3 | Số lần trễ báo cáo để cảnh báo |

### 11.5. Bảng `notification_templates`

```javascript
{
  _id: ObjectId,
  type: String,                   // Loại thông báo, unique
  title_template: String,         // "Thiếu nhật ký buổi học - {course_name}"
  content_template: String,        // "Lớp {course_name} đã kết thúc {minutes} phút..."
  default_level: String,          // REMINDER / WARNING / INCIDENT
  default_priority: Number,       // 1, 2, 3
  variables: [String],            // ["course_name", "minutes", "teacher_name"]
  is_active: Boolean
}
```

### 11.6. Mối quan hệ giữa các bảng

```
notifications
     │
     ├── 1──N → notification_recipients → users
     │
     ├── 1──N → notification_logs
     │
     └── *──1 → courses (ref_course, optional)
     └── *──1 → calendar (ref_lesson, optional)
     └── *──1 → users (ref_teacher, optional)
     └── *──1 → students (ref_student, optional)

notification_settings (độc lập)
notification_templates (độc lập)
```

---

## 12. Thiết kế API

### 12.1. Danh sách API

#### `GET /api/notifications`

Lấy danh sách thông báo của người dùng hiện tại.

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `status` | String | Lọc theo trạng thái: `UNREAD`, `READ`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `level` | String | Lọc theo cấp độ: `REMINDER`, `WARNING`, `INCIDENT` |
| `type` | String | Lọc theo loại |
| `page` | Number | Trang (default 1) |
| `limit` | Number | Số lượng (default 20, max 50) |

**Response:**
```json
{
  "data": [
    {
      "id": "NOTI-20260709-00042",
      "title": "Vi phạm SLA - Thiếu nhật ký buổi học",
      "content": "Lớp Robotics A1 đã kết thúc 120 phút...",
      "type": "MISSING_LESSON_LOG",
      "level": "INCIDENT",
      "status": "UNREAD",
      "priority": 1,
      "course_name": "Robotics A1",
      "teacher_name": "Nguyễn Văn B",
      "created_at": "2026-07-09T14:30:00Z",
      "sla_deadline": "2026-07-09T16:30:00Z",
      "read_status": "UNREAD"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

**Quyền:** Tất cả (tự động lọc theo role + phạm vi).

---

#### `GET /api/notifications/unread-count`

Lấy số lượng thông báo chưa đọc.

**Response:**
```json
{
  "total_unread": 12,
  "by_level": {
    "REMINDER": 5,
    "WARNING": 5,
    "INCIDENT": 2
  }
}
```

**Quyền:** Tất cả.

---

#### `GET /api/notifications/[id]`

Xem chi tiết thông báo.

**Response:**
```json
{
  "data": {
    "id": "NOTI-20260709-00042",
    "title": "Vi phạm SLA - Thiếu nhật ký buổi học",
    "content": "Chi tiết đầy đủ...",
    "type": "MISSING_LESSON_LOG",
    "level": "INCIDENT",
    "status": "IN_PROGRESS",
    "priority": 1,
    "ref_course": { "id": "...", "name": "Robotics A1" },
    "ref_lesson": { "id": "...", "date": "2026-07-09", "time": "13:30-15:00" },
    "ref_teacher": { "id": "...", "name": "Nguyễn Văn B" },
    "created_at": "2026-07-09T14:30:00Z",
    "sla_deadline": "2026-07-09T16:30:00Z",
    "logs": [
      { "action": "CREATE", "actor": "Hệ thống", "time": "..." },
      { "action": "VIEW", "actor": "Nguyễn Văn A", "time": "..." }
    ],
    "available_actions": ["VIEW_LESSON", "REMIND_TEACHER", "UPDATE_TEACHER", "CLOSE"]
  }
}
```

**Quyền:** Người nhận hoặc có quyền xem.

---

#### `PUT /api/notifications/[id]/read`

Đánh dấu đã đọc.

**Response:** `{ "success": true }`

**Quyền:** Người nhận.

---

#### `PUT /api/notifications/read-all`

Đánh dấu tất cả đã đọc.

**Response:** `{ "success": true, "updated_count": 12 }`

**Quyền:** Tất cả.

---

#### `PUT /api/notifications/[id]/resolve`

Đánh dấu đã xử lý.

**Request body:**
```json
{
  "note": "Đã nhắc giáo viên cập nhật nhật ký. Giáo viên xác nhận sẽ hoàn tất trong 30 phút."
}
```

**Response:** `{ "success": true }`

**Quyền:** Học vụ.

---

#### `PUT /api/notifications/[id]/close`

Đóng thông báo.

**Request body:**
```json
{
  "reason": "Vấn đề đã được giải quyết. Giáo viên đã cập nhật nhật ký."
}
```

**Response:** `{ "success": true }`

**Quyền:** Học vụ.

---

#### `POST /api/notifications/[id]/escalate`

Chuyển thành sự cố.

**Request body:**
```json
{
  "reason": "Giáo viên chưa phản hồi sau 2 lần nhắc nhở. Chuyển thành sự cố để Học vụ xử lý."
}
```

**Response:**
```json
{
  "success": true,
  "new_notification_id": "NOTI-20260709-00050",
  "level": "INCIDENT"
}
```

**Quyền:** Học vụ.

---

#### `POST /api/notifications/[id]/remind`

Gửi nhắc nhở.

**Request body:**
```json
{
  "target_role": "teacher",
  "message": "Vui lòng cập nhật nhật ký buổi học Robotics A1."
}
```

**Response:** `{ "success": true }`

**Quyền:** Học vụ.

---

#### `POST /api/notifications/system`

Tạo thông báo hệ thống (cho Admin Sys).

**Request body:**
```json
{
  "title": "Phát hiện đăng nhập bất thường",
  "content": "Tài khoản admin đăng nhập từ IP lạ...",
  "type": "SYSTEM_ERROR",
  "level": "WARNING",
  "target_roles": ["admin"]
}
```

**Response:** `{ "success": true, "id": "..." }`

**Quyền:** Admin Sys.

---

#### `GET /api/notifications/settings`

Lấy cấu hình SLA.

**Response:**
```json
{
  "data": [
    { "key": "sla_reminder_minutes", "value": 30, "description": "..." },
    { "key": "sla_incident_minutes", "value": 120, "description": "..." }
  ]
}
```

**Quyền:** Admin Sys, Học vụ (read-only).

---

#### `PUT /api/notifications/settings`

Cập nhật cấu hình SLA.

**Request body:**
```json
{
  "settings": [
    { "key": "sla_incident_minutes", "value": 150 }
  ]
}
```

**Response:** `{ "success": true }`

**Quyền:** Admin Sys.

---

#### `GET /api/notifications/templates`

Lấy danh sách mẫu thông báo.

**Quyền:** Admin Sys, Học vụ (read-only).

---

#### `PUT /api/notifications/templates/[id]`

Cập nhật mẫu thông báo.

**Quyền:** Admin Sys.

---

## 13. Thiết kế realtime

### 13.1. Phân tích phương án

| Phương án | Ưu điểm | Nhược điểm | Phù hợp |
|-----------|---------|------------|---------|
| **WebSocket** | Hai chiều, realtime thực sự, ít overhead sau khi kết nối | Phức tạp hơn, cần maintain connection, khó scale ngang | Hệ thống realtime cao |
| **Server-Sent Events (SSE)** | Đơn giản, một chiều server→client, tự động reconnect | Chỉ một chiều, không hỗ trợ HTTP/2 multiplexing trên mọi browser | Phù hợp cho notification |
| **Polling (setInterval)** | Đơn giản nhất, dễ implement | Tốn tài nguyên, độ trễ cao, không realtime thực sự | Chỉ dùng fallback |

### 13.2. Đề xuất: SSE + Polling fallback

**Kiến trúc:**

```
[Next.js API Route] ──SSE──→ [Client EventSource]
       │                            │
       └── Kết nối thất bại ────────┘
                                      │
                                      ▼
                              [Polling 30s]
```

**Chi tiết:**

| Thành phần | Công nghệ | Mô tả |
|-----------|-----------|-------|
| SSE Endpoint | `GET /api/notifications/stream` | Server gửi sự kiện realtime |
| Event format | `{ type: "new_notification" \| "count_update", data: {...} }` | |
| Polling fallback | `setInterval(fetchUnreadCount, 30000)` | Poll 30s nếu SSE fail |
| Cache | Redis | Cache unread count, giảm query DB |
| Throttle | 5s giữa các lần gửi | Tránh spam client |

**Luồn hoạt động:**

1. Client mở kết nối SSE đến `/api/notifications/stream` kèm token xác thực.
2. Backend giữ kết nối, lắng nghe sự kiện từ MongoDB Change Stream hoặc Redis Pub/Sub.
3. Khi có thông báo mới, backend push event qua SSE.
4. Client cập nhật icon badge + dropdown.
5. Nếu SSE ngắt kết nối (network error, timeout), client tự động fallback sang polling 30s.

**Triển khai Frontend (React hook):**

```javascript
// useNotification.js
function useNotification() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // SSE
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_notification') {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      // Fallback polling
    };
    return () => eventSource.close();
  }, []);
  
  return { unreadCount, notifications };
}
```

---

## 14. Tích hợp với dashboard và trung tâm xử lý sự cố

### 14.1. Dashboard Học vụ

| Widget | Dữ liệu từ module notification |
|--------|-------------------------------|
| Số cảnh báo chưa xử lý | `GET /api/notifications/unread-count` |
| Incident đang xử lý | `GET /api/notifications?status=IN_PROGRESS&level=INCIDENT` |
| SLA sắp vi phạm | `GET /api/notifications?status=WARNING&type=SLA` |
| Biểu đồ cảnh báo theo ngày | `GET /api/notifications/stats?group_by=date` |

### 14.2. Trung tâm xử lý sự cố (Incident Center)

Route: `/incidents`

**Chức năng:**
1. Danh sách tất cả Incident đang mở (UNREAD, READ, IN_PROGRESS).
2. Bộ lọc: cấp độ, loại, lớp, giáo viên, thời gian.
3. Bulk actions: đánh dấu đã đọc, chuyển giao, đóng hàng loạt.
4. Thống kê: số incident hôm nay, SLA vi phạm, thời gian xử lý trung bình.
5. Export báo cáo incident.

### 14.3. Luồng tích hợp

```
[Thông báo mới trên header]
       │
       ├── Nhẹ (REMINDER) → Dashboard phụ
       │
       ├── Trung bình (WARNING) → Dashboard chính + Header
       │
       └── Nặng (INCIDENT) → Dashboard chính + Header + Incident Center
                              → Tự động push vào Incident Center queue
```

---

## 15. UI/UX đề xuất

### 15.1. Trạng thái không có thông báo

```
┌─────────────────────────────────────┐
│ Thông báo                    [🔔]  │
│ ─────────────────────────────────── │
│                                     │
│           🔔                        │
│    Không có thông báo mới           │
│                                     │
│              [Xem tất cả]           │
└─────────────────────────────────────┘
```

Icon chuông trên header: trạng thái tĩnh, không badge.

### 15.2. Trạng thái có thông báo mới

Icon chuông: badge đỏ với số lượng.

Dropdown mở ra danh sách thông báo mới nhất (tối đa 5 item), item chưa đọc có nền xanh nhạt (`bg-blue-50`).

### 15.3. Trạng thái nhiều thông báo chưa đọc (>10)

Badge hiển thị `9+`. Dropdown có scroll. Header filter tabs để lọc nhanh.

### 15.4. Trạng thái thông báo ưu tiên cao (INCIDENT)

Icon chuông: animation rung nhẹ (CSS `@keyframes shake`) + badge đỏ pulse.

### 15.5. Dropdown thông báo

| Thuộc tính | Giá trị |
|-----------|---------|
| Chiều rộng | 400px (desktop), full width (mobile) |
| Chiều cao tối đa | 480px (có scroll) |
| Số item | 5 item mới nhất |
| Vị trí | Căn phải, dưới icon chuông |
| Shadow | `shadow-lg` |
| Animation | Mở: fade + slide down (200ms) |

### 15.6. Trang danh sách tất cả thông báo (`/notifications`)

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ Thông báo                              [🔔 Đánh dấu tất cả]  │
│ ────────────────────────────────────────────────────────────── │
│ [Tất cả] [Chưa đọc] [Cảnh báo] [Sự cố] [SLA]  [🔍 Tìm kiếm] │
│ ────────────────────────────────────────────────────────────── │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [🔴] Vi phạm SLA - Thiếu nhật ký   🕐 2 phút trước  [📘] │ │
│ │      Lớp Robotics A1 · GV: Nguyễn Văn B                   │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ [🟡] Thiếu điểm danh               🕐 15 phút trước [👤] │ │
│ │      Lớp Toán Tư Duy · GV: Trần Thị C                     │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ ...                                                        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                    [Trang 1/5] │
└────────────────────────────────────────────────────────────────┘
```

### 15.7. Responsive

| Thiết bị | Header | Dropdown | Notification page |
|-----------|--------|----------|-------------------|
| Desktop (≥1024px) | Full header | 400px, phải | Full layout |
| Tablet (768-1023px) | Thu gọn logo, ẩn search | 350px, phải | Full layout |
| Mobile (<768px) | Logo + icon phải | Full width, bottom sheet | Stack layout |

**Mobile header:**
```
┌──────────────────────────────┐
│ [Logo]    [🔔 3]  [👤]      │
└──────────────────────────────┘
```

**Mobile notification dropdown:** Dạng bottom sheet, kéo lên từ dưới, chiếm 80% màn hình.

---

## 16. Checklist nghiệm thu

### 16.1. Header & icon

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 1.1 | Header có icon chuông thông báo | ☐ | |
| 1.2 | Icon chuông hiển thị đúng vị trí (phải header) | ☐ | |
| 1.3 | Badge hiển thị số lượng chưa đọc | ☐ | |
| 1.4 | Badge tự động cập nhật khi có thông báo mới | ☐ | |
| 1.5 | Badge ẩn khi không có thông báo | ☐ | |
| 1.6 | Icon chuông có animation khi có INCIDENT | ☐ | |
| 1.7 | Header responsive (tablet, mobile) | ☐ | |

### 16.2. Dropdown thông báo

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 2.1 | Bấm icon chuông mở dropdown | ☐ | |
| 2.2 | Bấm ra ngoài đóng dropdown | ☐ | |
| 2.3 | Hiển thị 5 thông báo mới nhất | ☐ | |
| 2.4 | Có phân biệt đã đọc/chưa đọc | ☐ | |
| 2.5 | Có icon cấp độ cảnh báo | ☐ | |
| 2.6 | Có thời gian tương đối (2 phút trước) | ☐ | |
| 2.7 | Có bộ lọc nhanh (Tất cả, Chưa đọc, ...) | ☐ | |
| 2.8 | Có nút "Đánh dấu tất cả đã đọc" | ☐ | |
| 2.9 | Có nút "Xem tất cả" | ☐ | |
| 2.10 | Dropdown responsive mobile (bottom sheet) | ☐ | |

### 16.3. Chi tiết thông báo

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 3.1 | Bấm vào thông báo xem được chi tiết | ☐ | |
| 3.2 | Hiển thị đầy đủ: mã, tiêu đề, nội dung, loại, cấp độ | ☐ | |
| 3.3 | Hiển thị đối tượng liên quan (lớp, buổi học, GV, HV) | ☐ | |
| 3.4 | Hiển thị lịch sử thao tác | ☐ | |
| 3.5 | Hiển thị các nút hành động phù hợp theo quyền | ☐ | |

### 16.4. Tự động tạo thông báo

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 4.1 | Tự động tạo thông báo thiếu điểm danh (T+30) | ☐ | |
| 4.2 | Tự động tạo thông báo thiếu nhật ký (T+60) | ☐ | |
| 4.3 | Tự động tạo thông báo thiếu tài nguyên (T+90) | ☐ | |
| 4.4 | Tự động tạo thông báo vi phạm SLA (T+120) | ☐ | |
| 4.5 | Tự động nâng cấp REMINDER → WARNING → INCIDENT | ☐ | |
| 4.6 | Tự động cảnh báo học viên vắng ≥ N buổi | ☐ | |
| 4.7 | Tự động cảnh báo giáo viên trễ báo cáo ≥ N lần | ☐ | |
| 4.8 | Tự động cảnh báo lớp sắp học chưa có bài giảng | ☐ | |
| 4.9 | Tham số SLA có thể cấu hình | ☐ | |

### 16.5. Phân quyền

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 5.1 | Học vụ nhận được thông báo toàn bộ lớp | ☐ | |
| 5.2 | Giáo viên chỉ nhận thông báo lớp mình phụ trách | ☐ | |
| 5.3 | Admin Sys nhận thông báo hệ thống | ☐ | |
| 5.4 | Giáo viên không thấy thông báo lớp khác | ☐ | |
| 5.5 | Admin Sys không thấy thông báo vận hành lớp học | ☐ | |
| 5.6 | API tự động lọc theo role + phạm vi | ☐ | |

### 16.6. Hành động

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 6.1 | Có thể đánh dấu đã đọc từng thông báo | ☐ | |
| 6.2 | Có thể đánh dấu tất cả đã đọc | ☐ | |
| 6.3 | Có thể chuyển thông báo thành sự cố | ☐ | |
| 6.4 | Có thể nhắc giáo viên | ☐ | |
| 6.5 | Có thể cập nhật thay giáo viên (kèm lý do bắt buộc) | ☐ | |
| 6.6 | Có thể đánh dấu đã xử lý | ☐ | |
| 6.7 | Có thể đóng thông báo | ☐ | |
| 6.8 | Có lưu lịch sử thao tác | ☐ | |

### 16.7. Realtime

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 7.1 | Icon badge cập nhật realtime khi có thông báo mới | ☐ | |
| 7.2 | SSE hoặc polling hoạt động ổn định | ☐ | |
| 7.3 | Fallback polling khi SSE thất bại | ☐ | |
| 7.4 | Không gây ảnh hưởng hiệu năng | ☐ | |

### 16.8. Dashboard & Trung tâm sự cố

| # | Hạng mục | Kết quả | Ghi chú |
|---|----------|---------|---------|
| 8.1 | Dashboard Học vụ hiển thị số cảnh báo | ☐ | |
| 8.2 | Incident được push vào Incident Center | ☐ | |
| 8.3 | Incident Center có danh sách, bộ lọc, bulk actions | ☐ | |
| 8.4 | Incident Center có thống kê | ☐ | |

---

## 17. Yêu cầu đầu ra

Kết quả của bản đặc tả này bao gồm:

| Đầu ra | Mô tả |
|--------|-------|
| ✅ Bảng phân quyền thông báo | Mục [8.1](#81-ma-trận-phân-quyền) — ma trận 3 role × 11 loại thông báo |
| ✅ Bảng loại thông báo | Mục [5.1](#51-bảng-phân-loại) — 11 loại, mã, nhóm, vai trò nhận |
| ✅ Bảng trạng thái thông báo | Mục [9.2](#92-các-trạng-thái-thông-báo) — 6 trạng thái: UNREAD → CLOSED |
| ✅ Bảng cấp độ cảnh báo | Mục [6.2](#62-chi-tiết-từng-cấp-độ) — REMINDER / WARNING / INCIDENT |
| ✅ Bảng tham số SLA | Mục [7.2](#72-bảng-tham-số-sla) — 6 tham số có giá trị mặc định |
| ✅ Thiết kế database | Mục [11](#11-thiết-kế-dữ-liệu) — 5 bảng: notifications, notification_recipients, notification_logs, notification_settings, notification_templates |
| ✅ Thiết kế API | Mục [12](#12-thiết-kế-api) — 13 API: method, endpoint, request, response, quyền |
| ✅ Thiết kế realtime | Mục [13](#13-thiết-kế-realtime) — SSE + Polling fallback |
| ✅ Checklist nghiệm thu | Mục [16](#16-checklist-nghiệm-thu) — 40+ hạng mục kiểm thử |
| ✅ UI/UX đề xuất | Mục [15](#15-uiux-đề-xuất) — Giao diện header, dropdown, mobile responsive |

---
*Tài liệu được soạn thảo bởi chuyên gia phân tích hệ thống. Dành cho đội ngũ phát triển Frontend (React/Next.js), Backend (Node.js/MongoDB) và QA/Tester.*

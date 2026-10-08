# 📋 BÁO CÁO TUẦN — Hệ thống AI Robotic (SYS-AIR)

---

## 🔹 KẾ HOẠCH TUẦN NÀY — Công việc đã thực hiện

### 1. Tích hợp AI tự động curate ePortfolio (Zero-Click Automation)

| Hạng mục | Chi tiết |
|---|---|
| **Mô tả** | Xây dựng pipeline tự động sử dụng **Gemini Vision AI** để phân tích, chọn lọc và sắp xếp ảnh cho portfolio học viên |
| **Tiến độ** | ✅ Hoàn thành |

**Các công việc cụ thể đã hoàn thành:**

- **Backend API — `POST /api/curate-portfolio`**
  - Tự động quét folder Google Drive của khóa học
  - Gửi ảnh đến Gemini 1.5 Flash để phân tích chất lượng (bố cục, ánh sáng, biểu cảm, sự phù hợp)
  - Trả về danh sách ảnh đề xuất ở dạng JSON có cấu trúc
  - Lưu cache kết quả vào database (`aiPortfolioDraft`) → lần mở sau **tải ngay 0 giây**

- **Cập nhật Database Schema**
  - Thêm trường `aiPortfolioDraft` (Schema.Types.Mixed) vào model `course.js`
  - Đảm bảo tương thích ngược, không ảnh hưởng data hiện có

- **Tích hợp Google Drive**
  - Phát triển hàm `getFilesInDriveFolder` trong `image.js`
  - Hỗ trợ quét toàn bộ ảnh trong folder Drive của khóa học

- **Cập nhật Frontend — ReviewSheetModal**
  - Loại bỏ nút thủ công → chuyển sang **tự động kích hoạt** khi mở modal
  - Sử dụng `useEffect` hook để fetch hoặc dùng cache có sẵn
  - Fix lỗi `next/image` 400 Bad Request với ảnh Google Drive (thêm `unoptimized`)
  - Cấu hình `next.config.js` whitelist hostname ảnh ngoài

### 2. Kiểm thử & Xác minh

| Hạng mục | Chi tiết |
|---|---|
| **Mô tả** | Viết script verify và test trực tiếp trên trình duyệt |
| **Tiến độ** | ✅ Hoàn thành |

- Tạo script `verify_publish.mjs` kiểm tra tính nhất quán dữ liệu
- Xác minh: AI drafts, radar skills, student profile syncing đều hoạt động đúng
- Test trực tiếp trên giao diện web (đăng nhập, mở modal, kiểm tra hình ảnh)
- Kiểm thử với kho ảnh thực tế **Trại hè Titan 26/6/2026** (69 ảnh JPG) và 8 học sinh thật

### 3. Khắc phục lỗi kỹ thuật

| Lỗi | Giải pháp | Trạng thái |
|---|---|---|
| `next/image` trả 400 với ảnh Google Drive | Thêm `unoptimized` prop | ✅ Đã fix |
| Hostname `images.unsplash.com` chưa whitelist | Cập nhật `next.config.js` | ✅ Đã fix |
| Gemini API key thiếu/hết hạn | Fallback sang thuật toán deterministic | ✅ Đã xử lý |

---

## 🔹 KẾ HOẠCH TUẦN SAU — Dự kiến thực hiện

### 1. Nén ảnh Client-side trước khi Upload
| Hạng mục | Chi tiết |
|---|---|
| **Mục tiêu** | Giảm dung lượng ảnh 60–80% trước khi upload lên Drive |
| **Lợi ích** | Tiết kiệm bandwidth, tăng tốc độ upload, giảm tải storage |
| **Cách làm** | Tích hợp thư viện `browser-image-compression` vào luồng upload hiện tại |

### 2. Auto-date Matching — Tự động gán ảnh theo ngày học
| Hạng mục | Chi tiết |
|---|---|
| **Mục tiêu** | Tự động khớp ảnh upload với buổi học dựa trên metadata ngày chụp |
| **Lợi ích** | Giảm thao tác thủ công cho giáo viên, tăng độ chính xác phân loại |
| **Cách làm** | Đọc EXIF date từ ảnh → so sánh với lịch học → gán tự động |

### 3. Checklist sức khỏe khóa học (Course Health Bar)
| Hạng mục | Chi tiết |
|---|---|
| **Mục tiêu** | Dashboard tổng quan hiển thị tiến độ hoàn thiện dữ liệu của mỗi khóa học |
| **Lợi ích** | Giáo viên/admin biết ngay khóa nào thiếu dữ liệu cần bổ sung |
| **Cách làm** | Tính điểm dựa trên: đủ ảnh, có điểm danh, có nhận xét, có portfolio |

### 4. Cải thiện Error Handling & Logging
| Hạng mục | Chi tiết |
|---|---|
| **Mục tiêu** | Nâng cao khả năng theo dõi và xử lý lỗi trong hệ thống |
| **Lợi ích** | Phát hiện sớm vấn đề, giảm downtime, dễ debug |
| **Cách làm** | Thêm structured logging, error boundary cho các API quan trọng |

---

## 📊 Tóm tắt tiến độ tổng quan

```
Tuần này:  ████████████████████ 100%  — AI Portfolio Curation hoàn thành
Tuần sau:  ░░░░░░░░░░░░░░░░░░░░   0%  — 4 mục tiêu mới đã lên kế hoạch
```

> **Ghi chú:** Toàn bộ code mới được phát triển theo nguyên tắc **không can thiệp code hiện tại** — chỉ mở rộng thêm tính năng, đảm bảo tương thích ngược hoàn toàn.

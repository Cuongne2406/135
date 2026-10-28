# BỘ DATASET MẪU CHO TÍNH NĂNG AI EPORTFOLIO - SYS-AIR

Bộ dữ liệu này được khởi tạo chuẩn hóa để phục vụ thử nghiệm và vận hành luồng sinh **ePortfolio học sinh tự động** trên hệ thống giáo dục **SysAir (sys-air_v1)**.

---

## 📁 Cấu Trúc Thư Mục Dataset

```text
dataset_eportfolio/
├── 01_chan_dung_hoc_vien/            # 10 Ảnh chân dung học viên chất lượng cao (1:1 HD)
│   ├── HS01_Nguyen_Van_An.jpg
│   ├── HS02_Tran_Minh_Duc.jpg
│   ├── HS03_Le_Phuong_Anh.jpg
│   ├── HS04_Pham_Hoang_Nam.jpg
│   ├── HS05_Vu_Bao_Chau.jpg
│   ├── HS06_Dang_Gia_Huy.jpg
│   ├── HS07_Bui_Thao_My.jpg
│   ├── HS08_Hoang_Quoc_Bao.jpg
│   ├── HS09_Do_Khanh_Linh.jpg
│   └── HS10_Ngo_Tuan_Kiet.jpg
│
├── 02_hoat_dong_lop_hoc_robotics/    # 42 Ảnh chụp hoạt động thực tế 7 buổi học (Đã nhúng EXIF)
│   ├── Buoi_1_Nhap_Mon_Co_Dien_Tu/     (6 ảnh: phân loại kit, lắp khung xe, cắm nguồn)
│   ├── Buoi_2_Banh_Rang_Dong_Co_DC/    (6 ảnh: hộp giảm tốc, tỷ số truyền, động cơ DC)
│   ├── Buoi_3_Lap_Rap_Xe_Do_Duong/     (6 ảnh: cảm biến hồng ngoại, đi dây, xe hoàn thiện)
│   ├── Buoi_4_Lap_Trinh_Scratch_Sieu_Am/ (6 ảnh: code khối lệnh, cảm biến siêu âm né vật cản)
│   ├── Buoi_5_Toi_Uu_Xe_Me_Cung/       (6 ảnh: sa bàn mê cung, ghi chép thời gian, ăn mừng)
│   ├── Buoi_6_Che_Tao_Canh_Tay_Robot/  (6 ảnh: lắp khớp Servo, móng kẹp, gắp nhả hàng)
│   └── Buoi_7_Bao_Cao_Tot_Nghiep_Gala/ (6 ảnh: thuyết trình slide, biểu diễn robot, bế mạc)
│
└── 03_so_theo_doi_va_nhan_xet/       # File dữ liệu theo dõi và đánh giá của giáo viên
    └── So_Theo_Doi_Lop_Hoc_Robotics_K26.xlsx
```

---

## 👥 1. Danh Sách 10 Học Viên & Ảnh Chân Dung

| Mã HS | Họ và Tên | Tên ở lớp | Tuổi | Trường học | Thế mạnh & Phong cách học | File ảnh chân dung |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **HS01** | Nguyễn Văn An | An Bách Khoa | 11 | Archimedes Academy | Tư duy thuật toán nhạy bén, đam mê cơ cấu bánh răng | `HS01_Nguyen_Van_An.jpg` |
| **HS02** | Trần Minh Đức | Đức Cơ Khí | 12 | THCS Đoàn Thị Điểm | Lắp ráp cơ khí chuẩn xác, kiên trì thử nghiệm chuyển động | `HS02_Tran_Minh_Duc.jpg` |
| **HS03** | Lê Phương Anh | Phương Anh Logic | 12 | THCS Giảng Võ | Tư duy không gian tốt, đi dây tỉ mỉ, gỡ lỗi thuật toán nhanh | `HS03_Le_Phuong_Anh.jpg` |
| **HS04** | Phạm Hoàng Nam | Nam Diễn Giả | 11 | Vinschool The Harmony | Hoạt ngôn, thuyết trình đồ án tự tin, kỹ năng nhóm tốt | `HS04_Pham_Hoang_Nam.jpg` |
| **HS05** | Vũ Bảo Châu | Châu Sáng Tạo | 10 | TH Lê Quý Đôn | Sáng tạo thẩm mỹ thiết kế robot, năng nổ đặt câu hỏi | `HS05_Vu_Bao_Chau.jpg` |
| **HS06** | Đặng Gia Huy | Huy Tốc Độ | 12 | Newton Grammar School | Đam mê xe đua tốc độ, tinh chỉnh động cơ vượt dốc | `HS06_Dang_Gia_Huy.jpg` |
| **HS07** | Bùi Thảo My | My Thiết Kế | 11 | TH Chu Văn An | Ngăn nắp, thiết kế kết cấu cánh tay robot cân đối | `HS07_Bui_Thao_My.jpg` |
| **HS08** | Hoàng Quốc Bảo | Bảo Thuật Toán | 13 | THCS Cầu Giấy | Chững chạc, hỗ trợ các em nhỏ sửa lỗi vòng lặp logic | `HS08_Hoang_Quoc_Bao.jpg` |
| **HS09** | Đỗ Khánh Linh | Linh Tỉ Mỉ | 11 | Hà Nội Academy | Cẩn thận kiểm thử cảm biến, ghi chép khoa học | `HS09_Do_Khanh_Linh.jpg` |
| **HS10** | Ngô Tuấn Kiệt | Kiệt Thủ Lĩnh | 12 | THCS Thăng Long | Điều phối nhóm, quyết đoán xử lý tình huống sa bàn | `HS10_Ngo_Tuan_Kiet.jpg` |

---

## 📷 2. Kho Ảnh Hoạt Động & Metadata EXIF

Tất cả 42 bức ảnh hoạt động đều được nhúng sẵn **EXIF Metadata chuẩn** (Camera: `Canon EOS R6`, Lens 24-70mm, Software: `Adobe Lightroom Classic`).

Đặc biệt, trường `DateTimeOriginal` (Tag `0x9003`) được gán chính xác theo thời gian thực tế diễn ra từng buổi học (Thứ 7 hàng tuần, từ 08:30 đến 10:30):

- **Buổi 1**: `2024:09:07 08:30 - 10:15`
- **Buổi 2**: `2024:09:14 08:30 - 10:15`
- **Buổi 3**: `2024:09:21 08:30 - 10:15`
- **Buổi 4**: `2024:09:28 08:30 - 10:15`
- **Buổi 5**: `2024:10:05 08:30 - 10:15`
- **Buổi 6**: `2024:10:12 08:30 - 10:15`
- **Buổi 7**: `2024:10:19 08:30 - 10:15`

### Tính năng tương thích với SysAir:
Khi người dùng tải cả folder ảnh này lên modal **AutoDateMatcherModal** (`src/app/course/[...id]/ui/autoDateMatcher`), hàm `getPhotoCaptureDate()` trong `src/utils/exifReader.js` sẽ tự động đọc `DateTimeOriginal` và phân loại ảnh vào đúng 7 buổi học trên thời khóa biểu mà **không cần chọn ngày thủ công**.

---

## 📊 3. Sổ Theo Dõi & Nhật Ký Lớp Học (Excel)

Tệp `So_Theo_Doi_Lop_Hoc_Robotics_K26.xlsx` bao gồm 4 sheet chi tiết:

1. **`Thong_Tin_Khoa_Hoc`**:
   - Tên môn học: *Robotics Khám Phá & Chế Tạo Xe Thông Minh*
   - Mã lớp: `ROBO-K26-CGI`
   - Giáo viên: ThS. Nguyễn Hoàng Long | Phòng: Lab A1 Cầu Giấy
   - Lộ trình đào tạo chuẩn 7 buổi kèm mục tiêu & sản phẩm đầu ra.
2. **`Danh_Sach_Hoc_Sinh`**:
   - Hồ sơ 10 học sinh, số điện thoại phụ huynh, đường dẫn ảnh chân dung tương ứng, phong cách học tập.
3. **`Nhat_Ky_Va_Diem_Danh`**:
   - 70 dòng nhật ký nhận xét sư phạm chi tiết (10 học sinh × 7 buổi học).
   - Đánh giá theo 3 tiêu chí: Thái độ học tập, Kỹ năng cơ khí lắp ráp, Tư duy thuật toán.
   - Ghi chú quá trình khắc phục khó khăn, các tình huống thực hành thực tế.
4. **`Tong_Ket_Danh_Gia`**:
   - Tên đồ án tốt nghiệp, vai trò dự án, điểm số và xếp loại cuối khóa.
   - **Đoạn nhận xét tổng kết tốt nghiệp mẫu**: Được viết chuẩn ngôn ngữ sư phạm STEM, đóng vai trò làm dữ liệu ngữ cảnh (Few-shot context / Prompt context) để AI sinh ePortfolio.
   - Lộ trình đề xuất học tiếp (Level 2: AI & IoT ESP32).

---

## 🚀 4. Hướng Dẫn Tích Hợp Lên Google Drive & SysAir

1. **Đưa lên Google Drive**:
   - Tạo thư mục gốc: `[SysAir] Robotics_K26_CauGiay`
   - Tải lên 3 folder con tương ứng: `01_chan_dung_hoc_vien`, `02_hoat_dong_lop_hoc_robotics`, `03_so_theo_doi_va_nhan_xet`.
   - Cài đặt chia sẻ: `Bất kỳ ai có đường liên kết đều có thể xem`.
2. **Sử dụng trong SysAir Web App**:
   - Chạy dev server: `npm run dev`
   - Đăng nhập giáo viên: `gvtest@test.com` / `123456`
   - Vào khóa học `TEST-OFFICIAL-01`
   - Mở modal **Auto Date Matcher**: Kéo thả ảnh từ thư mục `02_hoat_dong_lop_hoc_robotics` vào hệ thống ➔ Hệ thống tự động đọc EXIF và phân loại vào 7 buổi.
   - Mở modal **Review Sheet**: Xem và chỉnh sửa nhật ký đánh giá đã được đồng bộ từ file Excel.
   - Bấm **"Sinh ePortfolio với Gemini AI"** ➔ AI sẽ đọc toàn bộ nhật ký 7 buổi và ảnh thành phẩm để tạo ra trang Portfolio cá nhân hóa sống động cho từng học viên.

# 📊 SLIDE THUYẾT TRÌNH BÁO CÁO TIẾN ĐỘ TUẦN
**Dự án:** Hệ thống Quản trị Đào tạo & ePortfolio AI Robotics (SYS-AIR)  
**Thời gian:** Tuần 10/2026  
**Người thực hiện:** Nhóm Kỹ thuật SYS-AIR  

---

## 🖥️ SLIDE 1: TRANG TIÊU ĐỀ
* **Tiêu đề lớn:** BÁO CÁO TIẾN ĐỘ TUẦN — NÂNG CẤP HỆ THỐNG SYS-AIR
* **Tiêu đề phụ:** Tích hợp AI Curate ePortfolio & Định hướng Tối ưu Vận hành
* **Nội dung chính:**
  * 🔹 Đánh giá tiến độ công việc tuần này (Hoàn thành 100%)
  * 🔹 Kế hoạch & Mục tiêu trọng tâm tuần tới
* **Speaker Notes (Lời thoại gợi ý):**
  > *"Kính chào thầy cô / anh chị và các bạn trong nhóm dự án. Hôm nay em xin phép báo cáo tiến độ công việc tuần này của hệ thống SYS-AIR, tập trung vào tính năng đột phá: Tự động hóa tuyển chọn ePortfolio bằng AI, cùng kế hoạch hành động chi tiết cho tuần tiếp theo."*

---

## 🖥️ SLIDE 2: BỐI CẢNH & VẤN ĐỀ CẦN GIẢI QUYẾT (WHY?)
* **Thực trạng trước đây:**
  * Mỗi khóa học có 50–100 bức ảnh chụp chung trên Google Drive.
  * Giáo viên/học vụ phải tự tải về, lọc thủ công 3 ảnh đẹp nhất cho từng học sinh $\rightarrow$ Mất **30–45 phút mỗi lớp**.
  * Dễ chọn nhầm ảnh mờ, nhắm mắt hoặc trùng lặp; chậm trễ gửi báo cáo cho phụ huynh.
* **Mục tiêu đặt ra cho tuần này:**
  * Tự động hóa việc chọn ảnh bằng Vision AI.
  * Rút ngắn thời gian duyệt Portfolio xuống **dưới 30 giây / lớp** (Zero-Click Co-pilot).
* **Speaker Notes:**
  > *"Trước đây, khi kết thúc khóa học, giáo viên phải lục tung hàng trăm bức ảnh trên Google Drive để chọn ra ảnh bìa và sản phẩm cho từng bé. Quy trình thủ công này tốn từ 30 đến 45 phút mỗi lớp. Mục tiêu tuần này của chúng em là ứng dụng AI để tự động hóa hoàn toàn khâu này."*

---

## 🖥️ SLIDE 3: TỔNG QUAN KẾT QUẢ TUẦN NÀY (TIẾN ĐỘ: 100%)
* **Bảng tổng hợp công việc đã hoàn thành:**

| STT | Hạng mục công việc | Trạng thái | Kết quả đạt được |
|:---:|---|:---:|---|
| **1** | **Pipeline AI Portfolio Curation** | ✅ 100% | Tích hợp Gemini 1.5 Flash Vision, tự quét ảnh Drive và sinh đề xuất JSON |
| **2** | **Cơ chế Cache thông minh** | ✅ 100% | Lưu bản nháp vào MongoDB (`aiPortfolioDraft`), tải lại chỉ mất 0.1 giây |
| **3** | **Giao diện ReviewSheetModal (Zero-Click)** | ✅ 100% | Tự động kích hoạt khi mở modal, hỗ trợ khay đổi ảnh nhanh (Photo Tray) |
| **4** | **Kiểm thử trên dữ liệu thực tế** | ✅ 100% | Test thành công với 69 ảnh thật từ Trại hè Titan 2026 & 8 học sinh thật |
| **5** | **Khắc phục lỗi hệ thống (Bug Fixing)** | ✅ 100% | Fix lỗi `next/image` 400 Bad Request, whitelist Google CDN & Unsplash |

* **Speaker Notes:**
  > *"Trong tuần vừa qua, toàn bộ 5 hạng mục công việc đặt ra đều đã hoàn thành 100%. Hệ sinh thái ePortfolio đã có bước nhảy vọt từ việc làm thủ công sang tự động hóa thông minh."*

---

## 🖥️ SLIDE 4: CHI TIẾT KỸ THUẬT — AI CURATION PIPELINE
* **Kiến trúc hoạt động:**
  1. **Đầu vào (Input):** Danh sách học sinh + Folder ảnh buổi học trên Google Drive.
  2. **Bộ não AI:** Gemini 1.5 Flash Vision phân tích chất lượng ảnh (độ nét, ánh sáng, góc chụp bé đang lắp robot/thuyết trình).
  3. **Cơ chế dự phòng (Safe Fallback):** Nếu không có API Key hoặc mạng chậm $\rightarrow$ tự động kích hoạt thuật toán chia ảnh đều theo lịch sử buổi học.
  4. **Tối ưu tốc độ:** Quét tối đa 24 ảnh đại diện, chuyển đổi base64 và cache kết quả ngay lần chạy đầu tiên.
* **Speaker Notes:**
  > *"Về mặt kiến trúc kỹ thuật, pipeline sử dụng mô hình Gemini 1.5 Flash Vision để đánh giá bố cục ảnh. Điểm đặc biệt là hệ thống có cơ chế Fallback an toàn: dù AI hay mạng gặp sự cố thì giáo viên vẫn luôn có ảnh đề xuất hợp lý mà không bị nghẽn hệ thống."*

---

## 🖥️ SLIDE 5: TRẢI NGHIỆM NGƯỜI DÙNG — GIAO DIỆN "DUYỆT TRONG 30 GIÂY"
* **Những cải tiến vượt trội trên giao diện:**
  * **Zero-Click:** Giáo viên chỉ cần bấm *"Xác nhận hoàn thành"* $\rightarrow$ Modal tự mở và AI đã chọn sẵn 3 ảnh cho từng em.
  * **Nhận xét & Radar kỹ năng:** Tự động tổng hợp từ nhật ký học tập (Tư duy, Thao tác, Thuyết trình, Đồng đội, Sáng tạo).
  * **Khay ảnh 1 chạm (Quick Photo Tray):** Nhấp vào ô ảnh bất kỳ để mở kho 48+ ảnh lớp $\rightarrow$ Đổi ảnh chỉ mất đúng 2 giây.
  * **Xuất bản hàng loạt:** 1 nút *"🚀 Xác Nhận & Xuất Bản"* lưu đồng thời Portfolio cho toàn bộ học sinh trong lớp.
* **Speaker Notes:**
  > *"Về phía người dùng, mục tiêu của giao diện này là 'Duyệt trong 30 giây'. Giáo viên chỉ cần nhìn lướt qua, nếu ưng ý thì bấm Xuất bản ngay, hoặc nếu muốn đổi ảnh thì nhấp vào ô ảnh để chọn từ khay ảnh chỉ trong 2 click chuột."*

---

## 🖥️ SLIDE 6: KẾT QUẢ KIỂM THỬ THỰC TẾ & BÀI HỌC KỸ THUẬT
* **Kiểm thử trên dữ liệu thực tế (Dataset):**
  * Nạp kho ảnh thật từ **Trại hè Titan 26/6/2026** (69 ảnh JPG độ nét cao).
  * Nạp danh sách 8 học sinh thật từ giải đấu (*Bùi Thiên Bảo, Đỗ Nguyễn Huy Hoàng, Nguyễn Đăng Khoa...*).
  * Kết quả: Ảnh hiển thị sắc nét qua Google CDN, không vỡ layout.
* **Các lỗi kỹ thuật đã giải quyết triệt để:**
  * ❌ *Lỗi 1: `next/image` 400 Bad Request* $\rightarrow$ Đã thêm `unoptimized` và whitelist `lh3.googleusercontent.com`.
  * ❌ *Lỗi 2: Lỗi trùng key MongoDB khi sinh ảnh* $\rightarrow$ Chuẩn hóa tạo mã ID duy nhất.
  * ❌ *Lỗi 3: Khóa học đã đóng không thể mở lại* $\rightarrow$ Thêm nút điều khiển linh hoạt.
* **Speaker Notes:**
  > *"Chúng em không chỉ kiểm tra với dữ liệu mẫu mà đã đưa vào kiểm thử trực tiếp với kho ảnh thực tế gồm 69 tấm ảnh từ Trại hè Titan. Các lỗi thường gặp của Next.js về domain ảnh và cache dữ liệu đều đã được xử lý triệt để."*

---

## 🖥️ SLIDE 7: KẾ HOẠCH TUẦN TỚI (DỰ KIẾN & MỤC TIÊU CẦN ĐẠT)
* **Trọng tâm tuần tới: Tối ưu hiệu năng, giảm tải vận hành và tự động hóa sâu hơn.**

| STT | Công việc dự kiến | Mục tiêu hoàn thành | Lợi ích mang lại |
|:---:|---|---|---|
| **1** | **Nén ảnh Client-side trước upload** | Giảm **60% – 80%** dung lượng ảnh | Tăng tốc upload gấp 3 lần, tiết kiệm bộ nhớ Drive |
| **2** | **Auto-date Matching (Khớp ngày chụp)** | Đọc metadata EXIF ngày chụp | Tự động gán ảnh vào đúng buổi học mà không cần chọn thủ công |
| **3** | **Checklist Sức khỏe Khóa học (Health Bar)** | Widget đo % hoàn thiện dữ liệu | Quản lý biết ngay lớp nào thiếu ảnh, thiếu điểm danh |
| **4** | **Error Handling & Structured Logging** | Bắt lỗi Google API & thông báo rõ ràng | Tránh lỗi màn hình trắng, người dùng dễ hiểu lỗi |

* **Speaker Notes:**
  > *"Sang tuần tiếp theo, mục tiêu của chúng em là tập trung vào 4 bài toán giúp hệ thống chạy mượt hơn, nhẹ hơn và tự động hơn, giảm thiểu tối đa thao tác của người dùng."*

---

## 🖥️ SLIDE 8: KẾ HOẠCH TUẦN TỚI — CHI TIẾT 4 HẠNG MỤC

### 1. Nén ảnh Client-side trước khi Upload
* **Hiện trạng:** Ảnh máy ảnh gốc nặng từ 5MB – 8MB/tấm $\rightarrow$ Upload lâu, tốn dung lượng Drive.
* **Mục tiêu:** Giảm **60% – 80%** dung lượng ngay trên trình duyệt trước khi gửi lên server (sử dụng Web Workers nén Canvas).
* **Kết quả dự kiến:** Tốc độ upload nhanh gấp 3 lần, ảnh chỉ còn ~800KB – 1.2MB mà vẫn giữ nguyên độ nét.

### 2. Auto-date Matching (Tự động gán ảnh theo buổi học)
* **Hiện trạng:** Giáo viên phải chọn đúng buổi học mới upload ảnh buổi đó.
* **Mục tiêu:** Đọc metadata EXIF ngày chụp của ảnh $\rightarrow$ Tự động khớp vào đúng buổi học trên lịch dạy.

### 3. Course Health Bar (Thanh sức khỏe dữ liệu khóa học)
* **Hiện trạng:** Quản lý không biết lớp nào đã đủ ảnh, lớp nào thiếu điểm danh.
* **Mục tiêu:** Widget hiển thị % hoàn thiện của lớp (*Điểm danh: 100%, Nhận xét: 100%, Minh chứng: 80%*).

### 4. Nâng cấp Error Handling & Logging
* **Mục tiêu:** Bắt lỗi Google API và hiển thị thông báo hướng dẫn người dùng thân thiện, tránh màn hình trắng.

* **Speaker Notes:**
  > *"Điểm quan trọng nhất tuần tới là tính năng Nén ảnh Client-side. Việc giảm 60-80% dung lượng ảnh sẽ giúp các thầy cô ở cơ sở dù mạng yếu vẫn có thể tải cả album ảnh lên trong vài giây."*

---

## 🖥️ SLIDE 9: ĐỀ XUẤT PHÁT TRIỂN DÀI HẠN (VISION)
* **1. Nhận diện học sinh bằng khuôn mặt (Face Recognition / Clustering):**
  * Lưu 1 ảnh thẻ/avatar chuẩn của từng bé khi nhập học.
  * Tự động quét kho ảnh lớp và gán chính xác từng học sinh vào album của bé mà không cần thầy cô chọn thủ công.
* **2. Tích hợp Chứng nhận PDF (Certificate):**
  * Tự động đính kèm bản mềm giấy chứng nhận tham gia / giải thưởng trực tiếp vào Portfolio phụ huynh xem được.
* **3. Cấu hình Google Cloud Service Account chính thức:**
  * Cấp quyền tự động quét mọi folder Drive của trung tâm.
* **Speaker Notes:**
  > *"Về định hướng tương lai, bước tiếp theo sẽ là tích hợp Face Recognition dựa trên ảnh đại diện nhập học, giúp hệ thống biết chính xác từng em học sinh trong ảnh chụp tập thể mà không cần ai phải tag tên."*

---

## 🖥️ SLIDE 10: TỔNG KẾT & TRÌNH CHIẾU DEMO (Q&A)
* **Tóm tắt ngắn gọn:**
  * 🎯 **Tuần này:** Hoàn thành xuất sắc tính năng AI ePortfolio Curation (Zero-Click, duyệt trong 30 giây).
  * 🚀 **Tuần tới:** Tối ưu hóa nén ảnh, tự động khớp ngày chụp và hoàn thiện Course Health Bar.
* **Trình chiếu Demo trực tiếp:**
  * Thao tác trực tiếp trên khóa học `TEST-OFFICIAL-01` tại `localhost:3000`.
* **Kính mời Thầy/Cô và các bạn đóng góp ý kiến!**
* **Speaker Notes:**
  > *"Trên đây là toàn bộ báo cáo tiến độ tuần này và định hướng tuần tới của nhóm. Ngay sau đây em xin phép được mở màn hình demo trực tiếp trên hệ thống để mọi người cùng trải nghiệm. Rất mong nhận được đóng góp ý kiến từ mọi người. Em xin cảm ơn!"*

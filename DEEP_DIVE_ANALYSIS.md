# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU MÃ NGUỒN HỆ THỐNG SYS-AIR V1
**Tài liệu:** Đánh giá Chi tiết Kiến trúc Thực thi (Lead System Architect Deep Dive)  
**Ngày thực hiện:** 21/10/2026  
**Mục tiêu:** Làm rõ chi tiết thực thi (Implementation Details), luồng dữ liệu thực tế và các khoảng trống kiến trúc (Architectural Gaps) của 6 phân hệ trọng yếu dựa trên `SYSTEM_SPEC.md` và mã nguồn đang chạy.

---

## 1. PHÂN HỆ CÔNG NỢ (`/academic/debt`) & HÓA ĐƠN (`src/models/invoices.js`)

### 1.1. Nguồn Dữ liệu Thực tế của Trang `/academic/debt`
Qua kiểm tra tập tin [`src/app/academic/debt/page.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/academic/debt/page.js) và [`client.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/academic/debt/client.js):

* **Nguồn truy vấn chính:** Trang `/academic/debt` đọc dữ liệu thực tế từ collection `Student` (thông qua `student_data()`) kết hợp với collection `Course` và `Book`. Bảng `invoices.js` **không** được query trực tiếp ở tầng khởi tạo trang `DebtPage`.
* **Cơ chế xác định công nợ:**
  * Mỗi học sinh có mảng `Course` trong [`src/models/student.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/models/student.js):
    ```javascript
    Course: [{
      course: { type: Schema.Types.ObjectId, ref: 'course' },
      tuition: { type: Schema.Types.ObjectId, default: null }, // Trỏ tới Invoice._id
      status: { type: Number, default: 0 }
    }]
    ```
  * Logic tính toán công nợ tại `src/app/academic/debt/client.js` (dòng 23–48):
    ```javascript
    paid: c.tuition != null // Nếu tuition !== null là Đã nộp; tuition === null là Chưa nộp (Nợ)
    ```
  * Số tiền học phí phải nộp được lấy trực tiếp từ `Book.Price` của giáo trình gắn với khóa học (`courseMap[cid].price = c.Book.Price`).
  * Số buổi đã học (`attended`) được đếm động từ các buổi có `Checkin > 0` trong `Course.Student.Learn`.

### 1.2. Cơ chế Tạo Phiếu Thu, Gạch Nợ & Tự Động Hóa
* **Khi xếp học sinh vào khóa học:**
  * Tại API [`src/app/api/(course)/course/[id]/student/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/%28course%29/course/%5Bid%5D/student/route.js) (dòng 40–44), khi học sinh được thêm vào khóa học:
    ```javascript
    const newCourseEntry = { course: id, tuition: null, status: 0 };
    ```
  * Hệ thống **tự động khởi tạo khoản nợ mới** bằng cách gán `tuition: null`. Tuy nhiên, hệ thống **CHƯA tự động tạo bản ghi Invoice trong `invoices.js`** tại thời điểm này.
* **Quy trình thu tiền và gạch nợ (Payment Settlement):**
  * Được kích hoạt thủ công thông qua nút thao tác mở component `<Pay _id={r._id} />` ([`src/app/student/list/ui/pay/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/student/list/ui/pay/index.js)).
  * Hỗ trợ 2 phương thức: Tiền mặt (`paymentMethod: 0`) hoặc VietQR ngân hàng (`paymentMethod: 1`).
  * Khi xác nhận thanh toán, client gửi yêu cầu đến `POST /api/pay` ([`src/app/api/(student)/pay/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/%28student%29/pay/route.js)):
    1. Tạo mới bản ghi hóa đơn trong `src/models/invoices.js`:
       ```javascript
       const newInvoice = new Invoice({
           studentId, courseId, amountInitial, amountPaid, paymentMethod, discount, createBy: user._id
       });
       const savedInvoice = await newInvoice.save();
       ```
    2. **Thực hiện gạch nợ nguyên tử:**
       ```javascript
       await PostStudent.findOneAndUpdate(
           { _id: studentId, 'Course.course': courseId },
           { $set: { 'Course.$.tuition': savedInvoice._id } },
           { new: true }
       );
       ```
    3. Sau khi `tuition` nhận giá trị `savedInvoice._id`, giao diện `/academic/debt` tự động chuyển trạng thái sang **"Đã nộp"**, và người dùng có thể nhấp vào để in hóa đơn thanh toán chuẩn A4 (`invoices_data(invoiceId)`).

---

## 2. LUỒNG AI CURATOR (`/api/(ai)/curate-portfolio`) & KHỚP ẢNH EXIF (`/course/[...id]`)

### 2.1. Phân Tích Prompt & Dữ liệu Gửi Lên Gemini AI
Qua kiểm tra tập tin [`src/app/api/(ai)/curate-portfolio/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/%28ai%29/curate-portfolio/route.js):

* **Model AI sử dụng:** `gemini-1.5-flash` qua SDK `@google/generative-ai`.
* **Những dữ liệu ĐƯỢC GỬI lên Gemini AI:**
  1. **Danh sách học sinh:** Chuỗi text định danh gồm `ID` và `Tên` của từng học sinh trong lớp (`${i + 1}. ID: ${s.ID}, Tên: ${s.Name}`).
  2. **Dữ liệu hình ảnh:** Tối đa **24 ảnh đại diện** lấy từ thư mục Google Drive của các buổi học hoặc thư mục local, được chuyển đổi thành **Base64 Payload** (`inlineData: { data: Buffer.toString('base64'), mimeType: 'image/jpeg' }`).
  3. **Prompt đặc tả nhiệm vụ:**
     ```text
     Bạn là chuyên gia tuyển chọn ảnh tốt nghiệp E-Portfolio cho trung tâm giáo dục STEM/Robotics.
     Dưới đây là danh sách học sinh: [Danh sách học sinh]
     Chúng tôi đã gửi kèm [N] bức ảnh hoạt động từ khóa học.
     Hãy chọn ra 3 ảnh đẹp nhất cho mỗi học sinh:
     - coverImg: Ảnh cận cảnh/nửa người rõ mặt học sinh, nét mặt vui vẻ/tự tin/rạng rỡ.
     - projectImg1: Ảnh học sinh đang tập trung thao tác, lắp ráp robot, code hoặc chế tạo.
     - projectImg2: Ảnh chụp cùng sản phẩm hoàn chỉnh hoặc thuyết trình.
     Trả về duy nhất định dạng JSON thuần theo cấu trúc: { "recommendations": [{ studentId, coverImg, projectImg1, projectImg2 }] }
     ```
* **Những dữ liệu KHÔNG gửi lên Gemini AI (Xử lý Local Heuristic):**
  * **Điểm số `Scores`:** Không gửi lên AI.
  * **Nhận xét `Cmt`:** Không gửi lên AI. Nhận xét được tổng hợp cục bộ bằng hàm `synthesizeComment(stu, stuDataInCourse)` (dòng 54–66) ghép từ nhận xét cuối khóa `CmtFn` hoặc các ghi chú buổi học `Cmt`.
  * **Điểm danh `Checkin`:** Không gửi lên AI. Tỷ lệ chuyên cần được dùng trong hàm `calculateRadarSkills(stuDataInCourse, totalLessons, sIdx)` (dòng 69–81) để tính toán điểm số 5 trục Radar kỹ năng (Thuật toán, Thao tác, Thuyết trình, Đồng đội, Sáng tạo).
* **Cơ chế lưu trữ:** Kết quả được cache vào trường `aiPortfolioDraft` trong `Course` để các lần truy cập tiếp theo không cần gọi lại Gemini API (tiết kiệm chi phí và tăng tốc tải 0s).

### 2.2. Xử lý Ảnh Mất EXIF Metadata (Ví dụ: Ảnh tải từ Zalo)
Qua kiểm tra [`src/utils/exifReader.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/utils/exifReader.js) và modal [`src/app/course/[...id]/ui/autoDateMatcher/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/course/%5B...id%5D/ui/autoDateMatcher/index.js):

1. **Cơ chế Fallback nhiều tầng:**
   * Tầng 1: Đọc tag EXIF `0x0132` (DateTime) hoặc `0x9003` (DateTimeOriginal) trong 128KB buffer đầu của file JPEG.
   * Tầng 2: Nếu ảnh bị Zalo nén và tước sạch EXIF (strip metadata), hàm `getPhotoCaptureDate` chuyển sang đọc thuộc tính `file.lastModified`.
2. **Khi cả 2 tầng đều không xác định được ngày:**
   * Ảnh **KHÔNG HỀ BỊ HỦY BỎ** và **KHÔNG HỀ BỊ DỒN VÀO BUỔI ĐẦU TIÊN**.
   * Hệ thống tự động xếp ảnh vào nhóm riêng: **`unmatchedFiles` ("⚠️ Ảnh chưa nhận diện được ngày học")**.
3. **Giao diện can thiệp thủ công (Manual Override):**
   * Trong modal `AutoDateMatcherModal`, mỗi bức ảnh chưa khớp được hiển thị kèm một ô chọn `<select>` dropdown (`handleReassign`).
   * Giáo viên có thể nhấp chọn gán ảnh thủ công vào Buổi 1, Buổi 2,... Buổi 7 tương ứng trước khi nhấn nút "Tải lên Google Shared Drive".

---

## 3. ĐỒNG BỘ HAI CHIỀU GIỮA ĐIỂM DANH (`course.js`) VÀ HỌC BÙ (`makeupSession.js`)

### 3.1. Chiều 1: Điểm Danh -> Học Bù (Khi Đánh Dấu Vắng)
* **Thực trạng mã nguồn:** Tại API [`src/app/api/(course)/checkin/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/%28course%29/checkin/route.js) (dòng 88–101):
  ```javascript
  const updateFields = {
    'Student.$[stu].Learn.$[les].Checkin': Number(a.checkin),
    'Student.$[stu].Learn.$[les].Cmt': a.comment || [],
  };
  if (a.absenceReason !== undefined) {
    updateFields['Student.$[stu].Learn.$[les].absenceReason'] = a.absenceReason;
  }
  await PostCourse.updateOne(
    { _id: course._id },
    { $set: updateFields },
    { arrayFilters: [{ 'stu.ID': a.studentId }, { 'les.Lesson': sessionIdObj }] }
  );
  ```
* **Kết luận:** Khi giáo viên chấm vắng (`Checkin: 0/2/3`), hệ thống **CHƯA TỰ ĐỘNG** tạo bản ghi sang collection `MakeupSession`.
* **Hiện trạng luồng nghiệp vụ:** Việc ghi nhận vắng chỉ lưu lại lý do `absenceReason` trong mảng `Learn`. Để tạo phiên học bù, giáo vụ cần tạo yêu cầu qua giao diện hoặc gọi `POST /api/academic/makeup-sessions`.

### 3.2. Chiều 2: Học Bù -> Điểm Danh (Khi Cập Nhật Trạng Thái Học Bù)
* **Thực trạng mã nguồn:** Tại API [`src/app/api/academic/makeup-sessions/[id]/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/academic/makeup-sessions/%5Bid%5D/route.js):
  * Khi cập nhật trạng thái học bù (hàm `PATCH`, dòng 31–41):
    ```javascript
    if (body.makeupStatus) {
        await PostCourse.updateOne(
            {
                _id: session.course,
                'Student.ID': session.studentId,
                'Student.Learn.Lesson': session.lesson
            },
            { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': body.makeupStatus } },
            { arrayFilters: [{ 'stu.ID': session.studentId }, { 'les.Lesson': session.lesson }] }
        );
    }
    ```
  * Khi xóa phiên học bù (hàm `DELETE`, dòng 66–74): Tự động khôi phục `makeupStatus` về `'NOT_REQUIRED'`.
* **Kết luận:** 
  * Chiều từ `makeupSession.js` về `course.js` **ĐÃ ĐỒNG BỘ 100%** đối với trường `makeupStatus`.
  * **Điểm cần lưu ý:** Trường `Checkin` gốc của buổi học vắng trong `course.js` vẫn giữ nguyên giá trị vắng để bảo toàn lịch sử chuyên cần của lớp chính quy; việc học sinh đã học bù xong được biểu thị qua nhãn `makeupStatus: 'MAKEUP_COMPLETED'`.

---

## 4. CƠ CHẾ REAL-TIME SSE (`/api/notifications`) & ENGINE QUÉT SLA (`/academic/sla`)

### 4.1. Cơ Chế Kích Hoạt Quét SLA (`Check-Engine`)
* **Không có Cron Job chạy ngầm độc lập:** Trong toàn bộ dự án không có tiến trình cron ngầm (như `node-cron` hay Redis BullQueue) tự động chạy định kỳ ở background server.
* **Cách kích hoạt của `check-engine`:**
  * File [`src/app/api/notifications/check-engine/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/notifications/check-engine/route.js) cung cấp endpoint `POST` quét các buổi học trong 7 ngày gần nhất thông qua hàm `checkLessonAfterEnd(courseId, lessonId)` trong [`src/function/notificationEngine.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/function/notificationEngine.js). Endpoint này được gọi thủ công hoặc qua webhook kiểm thử.
* **Cách hoạt động của Dashboard Cảnh Báo SLA (`/academic/sla`):**
  * Tại [`src/app/academic/sla/page.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/academic/sla/page.js), khi người dùng mở trang hoặc nhấn "Làm mới dữ liệu", client gửi request đến `GET /api/academic/dashboard/sla-alerts` ([`src/app/api/academic/dashboard/sla-alerts/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/academic/dashboard/sla-alerts/route.js)).
  * Endpoint này thực thi **truy vấn MongoDB Aggregation thời gian thực (On-Demand Scan)** trực tiếp trên các buổi học trong ngày hôm nay (`Detail.Day`), tính toán độ trễ phút so với mốc kết thúc buổi học (`minutesSinceEnd`) và trả về danh sách vi phạm ngay lập tức mà không phụ thuộc vào cron job.

### 4.2. Cơ Chế Kết Nối Real-Time SSE (Server-Sent Events)
* **Kết nối toàn cục trên toàn hệ thống:** **CÓ.**
* **Chi tiết luồng hoạt động:**
  1. Component `<NotificationBell>` ([`src/components/(features)/(noti)/notificationBell/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/components/%28features%29/%28noti%29/notificationBell/index.js)) được gắn trực tiếp vào Sidebar chính ([`src/components/(layout)/nav/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/components/%28layout%29/nav/index.js)). Do Sidebar xuất hiện trên mọi trang nội bộ nên kết nối luôn được duy trì.
  2. Hook [`src/hooks/useNotification.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/hooks/useNotification.js) khởi tạo kết nối:
     ```javascript
     const eventSource = new EventSource('/api/notifications/stream');
     ```
  3. Server tại [`src/app/api/notifications/stream/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/notifications/stream/route.js) giải mã cookie JWT, mở một `ReadableStream` và lưu client vào bộ nhớ RAM (`clients.set(userId, { controller })`).
  4. Khi có thông báo vi phạm SLA hoặc thông báo hệ thống được tạo, hàm `broadcastNotification(notificationId)` sẽ đẩy event trực tiếp tới trình duyệt của người dùng có quyền tương ứng để cập nhật badge số đỏ và phát âm thanh cảnh báo.

---

## 5. QUẢN LÝ PHÒNG HỌC (`/academic/rooms`) & LỊCH BIỂU (`/calendar`, `schedule.js`)

### 5.1. Mô Hình Tham Chiếu của Trường `Room` (ObjectId)
* **Thực trạng Schema:** Trong collection `Course`, `Coursetry` và `MakeupSession`, trường `Room` lưu trữ kiểu `ObjectId`.
* **Model thực tế:** Trường này **KHÔNG tham chiếu đến một Collection `Room` riêng biệt**.
* **Định nghĩa gốc:** `Room` là một **Sub-document Schema** nằm bên trong mảng `rooms` của Model `Area` ([`src/models/area.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/models/area.js)):
  ```javascript
  const RoomSchema = new Schema(
    { name: { type: String, required: true, trim: true }},
    { _id: true } // Mỗi phòng tự sinh một ObjectId riêng
  );

  const AreaSchema = new Schema({
    name: { type: String, required: true, trim: true },
    rooms: { type: [RoomSchema], default: [] },
    color: { type: String, trim: true }
  });
  ```
* Trang `/academic/rooms` ([`src/app/academic/rooms/page.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/academic/rooms/page.js)) thực chất là giao diện quản lý thêm/sửa/xóa các phòng học trực thuộc từng chi nhánh/khu vực (`Area`).

### 5.2. Kiểm Tra Xung Đột Phòng Học & Giáo Viên (Conflict Detection)
* **Thực trạng mã nguồn:** Qua phân tích API thêm/sửa buổi học [`src/app/api/(course)/course/ucalendarcourse/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/%28course%29/course/ucalendarcourse/route.js) (dòng 75–108) và API tạo học bù [`src/app/api/academic/makeup-sessions/route.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/api/academic/makeup-sessions/route.js):
  * **HIỆN TẠI HOÀN TOÀN CHƯA CÓ CODE KIỂM TRA TRÙNG LỊCH.**
  * Khi tạo mới một `Detail` trong khóa học hoặc xếp lịch `makeupDate` + `makeupTime`:
    Hệ thống chỉ tìm kiếm `roomId` hợp lệ theo tên, sau đó gọi `$push` trực tiếp vào mảng `Detail` mà **không hề có bất kỳ câu lệnh truy vấn nào kiểm tra xem phòng học đó hoặc giáo viên đó đã có lớp khác học cùng khung giờ hay chưa**.
  * Model `schedule.js` hiện mới chỉ định nghĩa schema cấu trúc khung (`courseId`, `dayOfWeek`, `timeSlot`, `room`, `teacher`) và đang nằm trong danh mục "Sẵn sàng cho Giai đoạn Mở rộng" của `SYSTEM_SPEC.md`.

---

## 6. TRANG DASHBOARD CHÍNH (`src/app/page.js`) & PHÂN QUYỀN GIAO DIỆN THEO ROLE

### 6.1. Phân Quyền Tại Trang Dashboard Chính (`src/app/page.js`)
Kiểm tra trực tiếp tại [`src/app/page.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/page.js):
```javascript
export default async function Home() {
  const user = await CheckRole();
  if (!user) redirect('/login'); 

  const isAdmin = Array.isArray(user.role)
    ? user.role.some(r => /^admin$/i.test(r))
    : user.role === 'Admin';

  return (
    <>
      {isAdmin ? <AdminPage /> : <TeacherPage data={await user_data({ _id: user.id })} />}
    </>
  );
}
```
* **Kết quả phân quyền:** **ĐÃ ĐƯỢC TÁCH BIỆT RÕ RÀNG.**
  * **Khi `admin` đăng nhập:** Hiển thị `<AdminPage />` ([`src/app/(admin)/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/%28admin%29/index.js)), nạp component `<Overview />` hiển thị toàn bộ biểu đồ doanh thu, số liệu tài chính, học viên mới và các KPI điều hành.
  * **Khi `teacher` hoặc `hr` đăng nhập:** Chỉ hiển thị `<TeacherPage />` ([`src/app/(teacher)/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/app/%28teacher%29/index.js)), nạp `<TeacherDashboard />` chỉ chứa lịch dạy cá nhân, danh sách lớp phụ trách và đầu việc chuyên môn. **Giáo viên và nhân sự hoàn toàn không nhìn thấy biểu đồ doanh thu của admin trên trang chủ.**

### 6.2. Phân Quyền Trên Menu Sidebar (`src/components/(layout)/nav/index.js`)
Kiểm tra tại [`src/components/(layout)/nav/index.js`](file:///c:/Users/Cuong/Desktop/Project_code/135/sys-air_v1/src/components/%28layout%29/nav/index.js):
* **Thực trạng mã nguồn:**
  * Danh sách menu `initialNavItems` (dòng 51–97) bao gồm 11 mục: `Học sinh`, `Người dùng`, `Học vụ` (gồm menu con: `Học bù`, `Phòng học`, `Quản lý học phí`, `Báo cáo chuyên cần`), `Khóa học`, `Kho Template`, `Kỷ yếu Lookbook`, `Lịch dạy`, `Chăm sóc`, `Tìm kiếm`, `Hướng dẫn`, `Thống kê`.
  * Component `Nav` **hiện tại không nhận prop `user` hay `role`**, và **không có logic filter loại bỏ các menu item theo vai trò**.
* **Hệ quả thực tế:**
  * Khi `teacher` hoặc `hr` đăng nhập, trên thanh Sidebar **họ vẫn nhìn thấy đầy đủ các menu mục** (kể cả menu `Người dùng` hay `Quản lý học phí`).
  * **Tuy nhiên tầng bảo mật phía sau (Defense-in-Depth):**
    * Nếu `teacher` nhấp vào trang `/teacher` hoặc `/academic/debt`, giao diện hoặc API nghiệp vụ (như `POST /api/pay`) sẽ kiểm tra quyền qua `src/utils/checkuser.js` / `authenticate.js` và chặn hành động bằng mã lỗi `403 Forbidden` (hoặc chuyển hướng).
  * **Đề xuất kiến trúc:** Cần bổ sung trường `roles: ['admin']` vào từng item của `initialNavItems` và thực hiện `items.filter(item => hasPermission(user.role, item.roles))` để ẩn hoàn toàn các mục menu không thuộc quyền hạn, mang lại trải nghiệm UX gọn gàng và bảo mật hơn.

---

## 7. BẢNG TỔNG KẾT KIẾN TRÚC & KHUYẾN NGHỊ PHÁT TRIỂN

| Phân hệ / Tính năng | Hiện trạng Thực thi trong Code | Cơ chế Hoạt động Thực tế | Khuyến nghị Nâng cấp cho Giai đoạn 4 |
| :--- | :--- | :--- | :--- |
| **Công nợ & Hóa đơn** | Hoạt động bán tự động qua modal `<Pay>` | Đọc từ `Student.Course.tuition` + `Book.Price`. `POST /api/pay` tạo hóa đơn và gạch nợ ngay | Bổ sung API tự động sinh hóa đơn hàng loạt đầu tháng & tích hợp webhook VietQR tự động đối soát |
| **AI Curator & EXIF** | Gemini 1.5 Flash Vision + Fallback hoàn chỉnh | AI chỉ chọn 3 ảnh đẹp nhất (Base64). Nhận xét & Radar tính toán local. Ảnh mất EXIF có UI chọn buổi thủ công | Cho phép giáo viên tinh chỉnh prompt sinh nhận xét và chọn lọc ảnh theo nhận diện khuôn mặt học viên |
| **Điểm danh & Học bù** | Đồng bộ 1 chiều từ Học bù về Điểm danh | Chấm vắng chưa tự sinh `makeupSession`. Cập nhật trạng thái học bù tự động đồng bộ `makeupStatus` về `Course` | Tích hợp trigger: Khi chấm vắng có phép (`Checkin: 3`), tự động khởi tạo bản ghi `MAKEUP_REQUIRED` |
| **Real-time SSE & SLA** | SSE toàn cục, Quét SLA On-Demand | SSE duy trì qua `<NotificationBell>` ở Sidebar. Trang `/academic/sla` quét MongoDB theo thời gian thực (không có cron ngầm) | Thiết lập Next.js Cron / Node-cron quét nền mỗi 15 phút để chủ động bắn notification qua SSE |
| **Phòng học & Trùng lịch** | Lưu sub-document trong `Area.rooms` | `Room` là ObjectId trong mảng `Area.rooms`. Chưa có dòng code nào kiểm tra trùng lịch phòng/giáo viên | Kích hoạt `schedule.js`, viết middleware xác thực xung đột phòng và giáo viên trước khi lưu buổi học |
| **Dashboard & Sidebar** | Dashboard đã phân quyền, Sidebar tĩnh | `src/app/page.js` render riêng `<AdminPage>` hoặc `<TeacherPage>`. Sidebar hiển thị chung toàn bộ 11 menu | Bổ sung cơ chế lọc mảng `initialNavItems` theo `user.role` để ẩn menu quản trị đối với giáo viên/tư vấn viên |

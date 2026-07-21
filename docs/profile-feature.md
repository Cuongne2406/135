# Tính năng Hồ sơ điện tử (ePortfolio) — Phân tích

## 1. Tổng quan

Tính năng **Hồ sơ điện tử (ePortfolio)** cho phép học sinh xây dựng một hồ sơ cá nhân trực tuyến bao gồm:

- **Giới thiệu bản thân** (Intro) + **Ảnh đại diện** (Avatar)
- **Kĩ năng cá nhân** (Skill) — 6 kĩ năng với thang điểm 0–100% + Ảnh minh hoạ
- **Hình ảnh sản phẩm** (ImgPJ) — bộ sưu tập ảnh dự án
- **Thuyết trình tổng kết** (Present) — video, ảnh, nhận xét cho mỗi khoá đã hoàn thành

Hồ sơ được lưu trong MongoDB dưới trường `Profile` (embedded document) của collection `students`.

---

## 2. Luồng dữ liệu

### 2.1. Server Component → Client

```
[Browser] → /[id] → layout.js (server) → student_data(id) → dataStudent(_id)
                                                                    ↓
                                                      Student.find().populate('Area Course.course.Book')
                                                                    ↓
                                                      CheckProfileDone(student) → statusProfile: bool
                                                                    ↓
                                                      { ...student, createdAt, statusProfile }
                                                                    ↓
                                                   <Banner data={data} />
                                                   <Layout> → {children}
                                                                    ↓
                                              /[id]/page.js (server) → student_data(id) → <Profile data={data} />
```

**Server component** (`src/app/[id]/page.js`):
- Gọi `student_data(id)` để lấy toàn bộ dữ liệu học sinh (có populated Course → Book, Area)
- Truyền thẳng vào `Profile` component dưới dạng prop `data`

### 2.2. Khởi tạo Profile trong Client

`Profile` component (`src/app/[id]/ui/profile/index.js`):

```js
useEffect(() => {
    const profile = { ...defaultProfile, ...(data.Profile || {}) };
    // Sync presentations với danh sách khoá đã hoàn thành
    const completedCourses = data.Course?.filter(c => c.enrollmentStatus === 2) || [];
    const syncedPresent = completedCourses.map(course => {
        const existingPresent = presentMap.get(course._id) || {};
        return {
            bookId: course.Book.ID,
            bookName: course.Book.Name,
            Video: extractId(existingPresent.Video || ''),
            Img: extractId(existingPresent.Img || ''),
            Comment: existingPresent.Comment || '',
            course: existingPresent.course || course._id
        };
    });
    setEditableProfile({ ...profile, Avatar: extractId(...), ImgSkill: extractId(...), ImgPJ: [...], Present: syncedPresent });
}, [data]);
```

**Quy tắc merge:**
1. Lấy `defaultProfile` (6 kĩ năng mặc định = 50%, các trường rỗng)
2. Ghi đè bằng `data.Profile` từ DB (nếu có)
3. Tự động đồng bộ danh sách `Present` với số khoá đã hoàn thành (`enrollmentStatus === 2`)
   - Nếu đã có dữ liệu Present cũ → giữ lại Video/Img/Comment
   - Nếu khoá mới hoàn thành → tạo bản ghi rỗng
   - Nếu khoá bị xoá khỏi danh sách → loại bỏ khỏi Present

### 2.3. Lưu Profile

```
[User] → Click "Lưu thay đổi" → handleSaveChanges()
                                    ↓
                    fetch(PUT /api/student/[id]/profile, body: editableProfile)
                                    ↓
                    authenticate(request) — kiểm tra JWT
                                    ↓
                    PostStudent.findByIdAndUpdate(id, { Profile: body })
                                    ↓
                    reloadStudent(id) — xoá cache students
                                    ↓
                    router.refresh() — re-render server component
```

**API endpoint** (`src/app/api/(student)/student/[id]/profile/route.js`):
- **PUT**: Yêu cầu xác thực (`authenticate`). Cập nhật toàn bộ field `Profile` bằng body request.
- **GET**: Trả về profile đã merge với `defaultProfile` + đồng bộ Present. Không yêu cầu auth.

---

## 3. Thành phần giao diện

### 3.1. Trang cá nhân (`/src/app/[id]/layout.js`)

| Khu vực | Nội dung |
|---------|----------|
| Banner | Avatar, ID, Name, Status, tab links (Tổng quan / Khóa học) |
| Sidebar trái | Ngày sinh, Trường, Khu vực, Địa chỉ, Phụ huynh, Liên hệ, Email |
| Sidebar trái (dưới) | Tổng số khoá tham gia / hoàn thành / đang diễn ra / bảo lưu |
| Content chính | `{children}` — render Profile (mặc định) hoặc Courses |

### 3.2. Trang hồ sơ (`/src/app/[id]/ui/profile/index.js`)

4 section chính:

#### a. Giới thiệu bản thân
- **Textarea**: Nhập giới thiệu (free text)
- **Avatar**: 200×200px, click để mở popup chọn ảnh từ thư viện, lưu dưới dạng Google Drive ID

#### b. Kĩ năng cá nhân
- 6 thanh trượt (`<input type="range">`), mỗi kĩ năng 0–100%
  - "Sự tiến bộ và Phát triển"
  - "Kỹ năng giao tiếp"
  - "Diễn giải vấn đề"
  - "Tự tin năng động"
  - "Đổi mới sáng tạo"
  - "Giao lưu hợp tác"
- **Ảnh kĩ năng**: 200×200px, click để chọn ảnh

#### c. Hình ảnh sản phẩm
- Grid ảnh tự động (140px mỗi ảnh)
- Nút "+" để thêm ảnh (popup chọn nhiều)
- Mỗi ảnh có nút "×" để xoá
- Tối thiểu 3 ảnh để hồ sơ đạt trạng thái "Hoàn thành"

#### d. Thuyết trình tổng kết
- Accordion: mỗi khoá đã hoàn thành là một mục
- Mỗi mục gồm:
  - **Video thuyết trình**: 16:9, click để chọn video từ thư viện (filter type=video)
  - **Ảnh đại diện video**: 16:9, click để chọn ảnh
  - **Nhận xét tổng kết**: textarea
- Các trường Video/Img/Comment được đồng bộ với khoá học qua `bookId`

### 3.3. Popup chọn ảnh/video

Khi click vào các khu vực ảnh, popup `CourseAndImageSelection` (`/src/app/[id]/ui/pickimage/index.js`) mở ra cho phép:

- Chọn ảnh từ các buổi học của học sinh (theo khoá)
- Filter: `image` (mặc định) hoặc `video`
- Mode: `single` (chọn 1 ảnh) hoặc `multiple` (chọn nhiều)
- Sau khi chọn → `handleSelectionChange(id)` → cập nhật trường tương ứng

---

## 4. Kiểm tra hồ sơ hoàn chỉnh

### `CheckProfileDone(student)` (`/src/function/server.js`)

Hàm này kiểm tra 5 điều kiện, trả về `boolean`:

| Điều kiện | Chi tiết |
|-----------|----------|
| 1. Giới thiệu + Avatar + Ảnh kĩ năng | `profile.Intro`, `profile.Avatar`, `profile.ImgSkill` phải khác rỗng |
| 2. Đủ ảnh sản phẩm | `profile.ImgPJ.length > 2` (ít nhất 3 ảnh) |
| 3. Đủ 6 kĩ năng | Cả 6 kĩ năng phải có giá trị > 0 |
| 4. Đủ bài thuyết trình | `Present.length === completedCourses.length` |
| 5. Nội dung đầy đủ | Mỗi Present phải có `course`, `bookId`, `bookName`, `Video`, `Img`, `Comment` |

Kết quả được lưu thành field `statusProfile` trên mỗi student object khi fetch dữ liệu.

### Ứng dụng của `statusProfile`

| Nơi sử dụng | Mục đích |
|-------------|----------|
| `src/app/student/list/ui/itemStudent/index.js` | Nút "Hồ sơ điện tử" màu **xanh** (hoàn thành) hoặc **đỏ** (chưa xong) |
| `src/app/search/main.js` | Cột "Trạng thái" với 3 mức: Hoàn thành / Đang làm / Chưa làm |

---

## 5. API endpoints

| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| GET | `/api/student/[id]/profile` | ❌ | Lấy profile đã merge default + sync Present |
| PUT | `/api/student/[id]/profile` | ✅ JWT | Cập nhật profile (`Profile` field) |

### GET — Chi tiết

```js
// 1. Tìm student + populate Course → Book
const student = await PostStudent.findById(id).populate({
    path: 'Course.course',
    populate: { path: 'Book', select: 'Name ID Image' }
});

// 2. Merge với defaultProfile
const mergedProfile = { ...defaultProfile, ...(student.Profile || {}) };

// 3. Đồng bộ Present với danh sách Course (dùng bookId làm key)
const finalPresent = student.Course.map(courseItem => {
    const bookInfo = courseItem.course?.Book;
    const existingData = existingPresentations.get(bookInfo.ID) || {};
    return { bookId: bookInfo.ID, bookName: bookInfo.Name, Video, Img, Comment };
});
```

---

## 6. Schema

### Student.Profile (embedded)

```
Profile {
  Intro:    String       // Giới thiệu
  Avatar:   String       // Google Drive ID
  ImgSkill: String       // Google Drive ID (ảnh kĩ năng)
  ImgPJ:    [String]     // Mảng Google Drive IDs (ảnh sản phẩm)
  Skill:    Map<String>  // { "Tên kĩ năng": "giá trị 0-100" }
  Present:  [Presentation]
}

Presentation {
  course:  ObjectId → Course
  bookId:  String        // Book.ID (khoá chính để đồng bộ)
  bookName: String
  Video:   String        // Google Drive ID
  Img:     String        // Google Drive ID
  Comment: String
}
```

### Xử lý Google Drive ID

Tất cả ảnh/video được lưu dưới dạng **Google Drive File ID** (chuỗi 33 ký tự), không phải URL đầy đủ:

```js
const extractId = (urlOrId) => {
    const match = urlOrId.match(/id=([^&]+)/) || urlOrId.match(/\/d\/([^/]+)/);
    return match ? match[1] : urlOrId;
};
const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : defaultAvatar;
```

---

## 7. Cache

- `getStudentAll()` sử dụng `cacheData` với tag `'students'`
- `getStudentOne(_id)` gọi thẳng `dataStudent(_id)` **không qua cache**
- Khi PUT profile → `reloadStudent(id)` → xoá cache `'students'` + `'student:{id}'`

---

## 8. Trang Danh sách hồ sơ (`/search`)

Trang `/search/main.js` hiển thị danh sách tất cả học sinh với:

| Cột | Mô tả |
|-----|-------|
| ID | Mã học sinh |
| Họ và tên | Click → vào trang profile |
| Giới thiệu | ✓ / — |
| Avatar | ✓ / — |
| Kĩ năng | ✓ / — (cả 6 kĩ năng > 0) |
| Sản phẩm | ✓ / — (≥ 3 ảnh) |
| Trạng thái | Hoàn thành / Đang làm / Chưa làm |
| Ngày tạo | Từ ObjectId timestamp |

Bộ lọc: "Tất cả" / "Hoàn thành" / "Đang làm" / "Chưa làm". Tìm kiếm theo tên hoặc ID.

---

## 9. Luồng tổng thể

```
                    +-----------+
                    |  MongoDB  |
                    | students  |
                    +-----+-----+
                          |
            +-------------+-------------+
            |                           |
    dataStudent(id)              dataStudent()
            |                           |
     Student.find()              Student.find()
     + populate(Course.Book)     (cached)
     + populate(Area)
            |
     CheckProfileDone()
     + createdAt (ObjectId)
            |
     <Profile data={...} />
            |
     User chỉnh sửa → PUT /api/student/[id]/profile
            |
     reloadStudent(id)
            |
     router.refresh()
```

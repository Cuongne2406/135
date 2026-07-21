# Báo cáo đánh giá code - System AI Robotic

## 🔴 Lỗi nghiêm trọng (BUG)

### 1. Lỗi tham số truyền sai - Query MongoDB không chạy đúng
**File:** `data/database/student.js:62`, `data/database/area.js:30`, `data/database/zalo.js:30`

```js
// Sai: đang bọc _id trong object
cachedFunction(() => dataStudent({ _id }), [`student:${_id}`])
// Bên trong dataStudent:
const query = _id ? { _id } : {}  // query = { _id: { _id: value } } → không tìm thấy

// Đúng:
cachedFunction(() => dataStudent(_id), [`student:${_id}`])
// query = { _id: value }
```

Hàm `getStudentOne`, `getAreaOne`, `getZaloOne` truyền `{ _id }` vào hàm data, nhưng bên trong hàm data kiểm tra `_id ? { _id } : {}` — khi `_id` là object `{ _id: value }`, nó truthy nhưng query sai cấu trúc, dẫn đến không tìm được document.

### 2. Thiếu `await` trên cached function
**File:** `data/database/student.js:63`, `data/database/area.js:31`, `data/database/zalo.js:31`, `data/database/book.js:34`, `data/database/course.js:125`

```js
return cachedFunction()
// Thiếu await → nếu cachedFunction() reject, catch không bắt được lỗi
// Sửa: return await cachedFunction()
```

### 3. `CheckProfileDone` nhận sai đối tượng
**File:** `data/database/course.js:100`

```js
student.StatusProfile = CheckProfileDone(info?.Profile || {});
```

`CheckProfileDone` (trong `function/server.js`) mong đợi toàn bộ object **student** (chứa `Profile`, `Course`, ...), nhưng đang nhận **chỉ Profile subdocument** (`{ Intro, Avatar, ImgSkill, ... }`). Hàm kiểm tra `student.Profile` luôn là `undefined` và luôn trả về `false`.

→ Sửa: `CheckProfileDone(info || {})`

### 4. `describe.length` gây crash khi null
**File:** `app/actions/data.actions.js:25`

```js
const describe = formData.get('describe');  // có thể null
if (describe.length > 1000)  // TypeError: Cannot read properties of null
```

→ Sửa: `if (describe?.length > 1000)`

### 5. Import linh tinh trong model
**File:** `models/users.js:1`

```js
import Zalo from '@/app/client/ui/zalo'  // Import component UI vào model Mongoose
```

Biến `Zalo` không được dùng — là import chết có thể gây lỗi bundle hoặc circular dependency.

### 6. Bắt lỗi không log
**File:** `data/database/invoices.js:49,58`

```js
catch (error) { return [] }  // Không console.error → không debug được
```

---

## 🟡 Vấn đề bảo mật

### 7. Hardcoded secrets trong Dockerfile
**File:** `Dockerfile:34-40`

MongoDB URI, JWT Secret, Google Private Key được hardcode trực tiếp. Nên dùng build args hoặc Docker secrets.

### 8. `.env` chứa secret thật
**File:** `.env`

Chứa đầy đủ thông tin nhạy cảm: `MongoDB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GOOGLE_PRIVATE_KEY`. `.gitignore` đã có `.env*` nên an toàn với git, nhưng không được share file này ra ngoài.

---

## 🟠 Các lỗi logic khác

### 9. `student.Course.filter` có thể crash
**File:** `function/server.js:27`

```js
const completedCourses = student.Course.filter(c => c.status === 2);
// crash nếu student.Course undefined
```

### 10. `user.role.includes` không check null
**File:** `app/actions/label.actions.js:16,57,95`, `schedule.actions.js`, `data.actions.js`, `variant.actions.js`, `customer.actions.js`, `zalo.actions.js`

```js
if (!user.role.includes('Admin') && ...)
// crash nếu JWT không có field 'role'
```

### 11. Inconsistent return type
**File:** `data/course.js`, `data/client.js`

Success path trả về `res.data || []` (array), error path trả về `{ data: [] }` (object). Gây crash khi code gọi dùng vòng lặp `.map()`, `.filter()`.

### 12. Hardcoded MongoDB ObjectId
**File:** `data/database/coursetry.js:11`

```js
const course = await TrialCourse.findById('6871bc14ada3650715efc786')
// ID cứng, sẽ fail ở môi trường khác
```

### 13. `source` bị ghi đè trong mỗi vòng lặp
**File:** `app/actions/data.actions.js:168-176`

```js
headers.forEach((key, index) => {
    // ...
    newCustomerData['source'] = key === 'source' ? src : DEFAULT_SOURCE_ID
    // Ghi đè source mỗi lần lặp → không hiệu quả
});
```

---

## 🟢 Gợi ý cải thiện

| # | Vấn đề | File | Chi tiết |
|---|--------|------|----------|
| 14 | Config trùng lặp | `next.config.mjs` | Tồn tại song song với `next.config.js`. File `.mjs` là empty config, nên xóa |
| 15 | Typo | `data/default/index.js:28` | `'Chữa xác định'` → `'Chưa xác định'` (thiếu dấu) |
| 16 | Error message sai | `data/database/user.js:116` | Log ghi `'Lỗi trong UserOne'` nhưng đang ở hàm `getUserReport` |
| 17 | Rate-limit fields không có trong schema | `app/actions/schedule.actions.js` | `rateLimitHourStart`, `rateLimitDayStart`... không defined trong `models/zalo.js` |
| 18 | No error handling | `function/drive/index.js` | `getDriveClient()` không có try/catch khi khởi tạo Google auth |

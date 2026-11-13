# Quản lý Phòng học (Room Management)

## 1. Tổng quan

Hệ thống quản lý phòng học cho phép:
- Quản lý khu vực (Area) và phòng học (Room) trực thuộc
- Gán phòng cho từng buổi học trong khóa học
- Kiểm tra xung đột phòng khi tạo/sửa buổi học
- Hiển thị thông tin phòng trên lịch và chi tiết khóa học
- Xóa phòng (tự động clear tham chiếu trong các khóa cũ)

## 2. Cấu trúc dữ liệu

### Area (Khu vực) — `src/models/area.js`

```
Area {
  _id: ObjectId
  name: String        // Tên khu vực (VD: "Tầng 2", "Cơ sở A")
  rooms: [Room]       // Mảng các phòng học embedded
  color: String       // Màu HEX hiển thị
  createdAt, updatedAt
}

Room {
  _id: ObjectId       // Tự động sinh
  name: String        // Tên phòng (VD: "P201", "Lab AI")
}
```

### Course (Khóa học) — `src/models/course.js`

Mỗi buổi học (`Detail`) lưu `Room: ObjectId` tham chiếu đến `rooms._id` trong Area.

Khu vực được lưu ở cấp khóa học: `Area: { type: ObjectId, ref: 'area' }`.

### TrialCourse (Buổi học thử) — `src/models/coursetry.js`

Mỗi session lưu `room: ObjectId` tham chiếu đến `rooms._id` trong Area.

## 3. API Endpoints

### Area CRUD

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/area` | Tạo khu vực mới (kèm danh sách phòng) |
| PUT    | `/api/area/:id` | Cập nhật khu vực |
| DELETE | `/api/area/:id?roomId=X` | Xóa một phòng khỏi khu vực |

**DELETE room**: Khi xóa phòng, hệ thống tự động set `Room = null` cho tất cả buổi học trong các khóa đang tham chiếu đến phòng đó.

### Room Conflict Check

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET    | `/api/room/check?roomId=X&date=YYYY-MM-DD&time=HH:MM-HH:MM&excludeId=OPTIONAL` | Kiểm tra phòng có bận không |

**Response:**
```json
{
  "success": true,
  "conflict": false,
  "conflicts": []
}
```

## 4. Hiển thị

### Calendar (Lịch)

- **Week grid cards**: Phòng (tên + khu vực), mã khóa học, tên giáo viên, thời gian
- **Month list**: Thời gian, mã khóa học, phòng, tên giáo viên
- Nếu không có phòng: hiển thị dấu `—`

### Course Detail (Chi tiết khóa học)

- Header khóa học: Tên khu vực (`data.Area.name`)
- Chi tiết buổi học: Phòng + Khu vực (`lesson.Room - data.Area.name`)
- Nếu không có phòng: hiển thị "Trống"

## 5. Xung đột phòng

Khi tạo/sửa buổi học, hệ thống kiểm tra:
1. Phòng đã được đặt cho buổi khác cùng ngày và khung giờ chồng lấn?
2. Nếu có xung đột → hiển thị danh sách buổi học đang chiếm phòng
3. Giáo viên có thể chọn phòng khác từ danh sách phòng của khu vực

## 6. Xóa phòng

Khi xóa phòng:
1. Xóa khỏi mảng `rooms` của Area
2. Set `Detail.$[].Room = null` trong tất cả PostCourse có tham chiếu
3. Set `sessions.$[].room = null` trong tất cả TrialCourse có tham chiếu
4. Cache được invalidate

## 7. File liên quan

| File | Vai trò |
|------|---------|
| `src/models/area.js` | Mongoose schema Area + Room |
| `src/models/course.js` | Course schema (chứa Detail.Room) |
| `src/models/coursetry.js` | TrialCourse schema (chứa sessions.room) |
| `src/app/api/(area)/area/route.js` | POST create area |
| `src/app/api/(area)/area/[id]/route.js` | PUT update + DELETE room |
| `src/app/api/(area)/room/check/route.js` | GET check room conflict |
| `src/app/api/(course)/calendar/route.js` | GET calendar (room resolving) |
| `src/app/api/(course)/calendar/[id]/route.js` | GET lesson detail |
| `src/app/course/ui/createarea/index.js` | UI tạo khu vực |
| `src/app/course/ui/area-item/index.js` | UI danh sách + sửa khu vực |
| `src/app/course/ui/create/index.js` | UI tạo khóa (chọn phòng) |
| `src/app/course/[...id]/ui/detailcourse/index.js` | Chi tiết khóa (hiển thị phòng) |
| `src/app/course/[...id]/ui/calendarcourse/index.js` | Lịch khóa (chọn phòng khi học bù) |
| `src/app/course/trycourse/ui/detaillesson/index.js` | Chi tiết buổi học thử |
| `src/app/course/trycourse/ui/add/index.js` | Thêm buổi học thử |
| `src/app/calendar/page.js` | Lịch tổng (week grid + month list) |
| `src/data/database/area.js` | Data access functions |
| `src/data/actions/reload.js` | Cache invalidation |

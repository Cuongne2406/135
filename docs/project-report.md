# Air Manager System — Project Report

## 1. Cây thư mục dự án

```
air-manager-system/
├── .dockerignore
├── .env.development
├── .env.production
├── .gitattributes
├── .gitignore
├── Dockerfile
├── improve.md
├── jsconfig.json
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── report.md
├── structure.md
├── public/
│   └── index.js
├── report/
│   └── project-report.md
└── src/
    ├── app/
    │   ├── (admin)/
    │   │   ├── index.js
    │   │   └── ui/
    │   │       ├── student.js
    │   │       └── teacher/
    │   │           └── index.js
    │   ├── (auth)/
    │   │   └── login.js
    │   ├── (teacher)/
    │   │   ├── index.js
    │   │   └── main.js
    │   ├── [id]/
    │   │   ├── page.js
    │   │   ├── layout.js
    │   │   ├── courses/
    │   │   │   ├── page.js
    │   │   │   ├── main.js
    │   │   │   ├── error.js
    │   │   │   └── loading.js
    │   │   ├── overview/
    │   │   │   ├── page.js
    │   │   │   ├── error.js
    │   │   │   └── loading.js
    │   │   └── ui/
    │   │       ├── banner/
    │   │       │   └── index.js
    │   │       ├── pickimage/
    │   │       │   └── index.js
    │   │       └── profile/
    │   │           └── index.js
    │   ├── actions/
    │   │   ├── customer.actions.js
    │   │   ├── data.actions.js
    │   │   ├── label.actions.js
    │   │   ├── schedule.actions.js
    │   │   ├── variant.actions.js
    │   │   └── zalo.actions.js
    │   ├── api/
    │   │   ├── (ai)/
    │   │   │   ├── cmt/route.js
    │   │   │   └── reaicmt/route.js
    │   │   ├── (area)/
    │   │   │   └── area/
    │   │   │       ├── route.js
    │   │   │       └── [id]/route.js
    │   │   ├── (auth)/
    │   │   │   ├── check/route.js
    │   │   │   ├── login/route.js
    │   │   │   ├── logout/route.js
    │   │   │   ├── register/route.js
    │   │   │   └── roleuser/[id]/route.js
    │   │   ├── (client)/
    │   │   │   ├── client/route.js
    │   │   │   ├── hissmes/route.js
    │   │   │   ├── hissmes/[phone]/route.js
    │   │   │   ├── label/route.js
    │   │   │   ├── re/route.js
    │   │   │   ├── res/route.js
    │   │   │   └── sendmes/route.js
    │   │   ├── (course)/
    │   │   │   ├── book/route.js
    │   │   │   ├── book/[id]/route.js
    │   │   │   ├── calendar/route.js
    │   │   │   ├── calendar/[id]/route.js
    │   │   │   ├── checkin/route.js
    │   │   │   ├── course/route.js
    │   │   │   ├── course/[id]/route.js
    │   │   │   ├── course/[id]/student/route.js
    │   │   │   ├── course/ucalendarcourse/route.js
    │   │   │   ├── coursetry/route.js
    │   │   │   ├── exportx/route.js
    │   │   │   ├── studentcourse/[id]/route.js
    │   │   │   ├── updatecmtfn/route.js
    │   │   │   ├── updateimage/route.js
    │   │   │   └── updateimagestudent/route.js
    │   │   ├── (image)/
    │   │   │   └── image/route.js
    │   │   ├── (student)/
    │   │   │   ├── pay/route.js
    │   │   │   └── student/
    │   │   │       ├── route.js
    │   │   │       ├── [id]/route.js
    │   │   │       ├── [id]/profile/route.js
    │   │   │       └── [id]/status/route.js
    │   │   └── (zalo)/
    │   │       ├── action/route.js
    │   │       └── senduser/route.js
    │   ├── calendar/
    │   │   ├── page.js
    │   │   ├── loading.js
    │   │   ├── [id]/
    │   │   │   ├── page.js
    │   │   │   └── ui/
    │   │   │       ├── formcmt/index.js
    │   │   │       ├── formimage/index.js
    │   │   │       ├── formimages/index.js
    │   │   │       └── main/index.js
    │   │   └── ui/
    │   │       ├── button/load.js
    │   │       ├── lesson_m/index.js
    │   │       ├── lesson_td/index.js
    │   │       ├── listlesson/index.js
    │   │       ├── month/index.js
    │   │       └── today/index.js
    │   ├── client/
    │   │   ├── page.js
    │   │   ├── index.js
    │   │   ├── loading.js
    │   │   └── ui/
    │   │       ├── action/index.js
    │   │       ├── data/index.js
    │   │       ├── filter/index.js
    │   │       ├── hisotry/index.js
    │   │       ├── label/index.js
    │   │       ├── run/index.js
    │   │       ├── table/
    │   │       │   ├── index.js
    │   │       │   └── row.js
    │   │       ├── variant/index.js
    │   │       ├── zalo/index.js
    │   │       └── zalos/index.js
    │   ├── course/
    │   │   ├── page.js
    │   │   ├── loading.js
    │   │   ├── [...id]/
    │   │   │   ├── page.js
    │   │   │   ├── loading.js
    │   │   │   └── ui/
    │   │   │       ├── Report/index.js
    │   │   │       ├── bell/index.js
    │   │   │       ├── calendarcourse/index.js
    │   │   │       ├── cmt/index.js
    │   │   │       ├── detailcourse/index.js
    │   │   │       ├── detatilstudent/index.js
    │   │   │       ├── exportStudents/index.js
    │   │   │       ├── sencmt/index.js
    │   │   │       ├── student/index.js
    │   │   │       └── timeline/
    │   │   │           ├── index.js
    │   │   │           └── dot.js
    │   │   ├── book/[id]/
    │   │   │   ├── page.js
    │   │   │   └── ui/
    │   │   │       ├── main/index.js
    │   │   │       ├── AddTopicForm/index.js
    │   │   │       ├── EditBookForm/index.js
    │   │   │       └── EditTopicForm/index.js
    │   │   ├── template/navbar/index.js
    │   │   ├── trycourse/
    │   │   │   ├── page.js
    │   │   │   ├── main.js
    │   │   │   ├── filter.js
    │   │   │   └── ui/
    │   │   │       ├── add/index.js
    │   │   │       ├── calendar/index.js
    │   │   │       ├── detaillesson/index.js
    │   │   │       ├── more/index.js
    │   │   │       └── student/
    │   │   │           ├── index.js
    │   │   │           └── item.js
    │   │   └── ui/
    │   │       ├── area-item/index.js
    │   │       ├── book-item/index.js
    │   │       ├── course-item/index.js
    │   │       ├── coursetry-item/index.js
    │   │       ├── create/index.js
    │   │       ├── createarea/index.js
    │   │       ├── createbook/index.js
    │   │       └── nav-item/index.js
    │   ├── student/
    │   │   ├── layout.js
    │   │   ├── loading.js
    │   │   ├── nav/index.js
    │   │   ├── list/
    │   │   │   ├── page.js
    │   │   │   ├── layout/
    │   │   │   │   ├── filter/index.js
    │   │   │   │   └── main/index.js
    │   │   │   └── ui/
    │   │   │       ├── create/index.js
    │   │   │       ├── itemStudent/index.js
    │   │   │       ├── out/index.js
    │   │   │       ├── pay/index.js
    │   │   │       └── update/index.js
    │   │   └── overview/
    │   │       ├── page.js
    │   │       ├── layout.js
    │   │       ├── client.js
    │   │       └── overviews/page.js
    │   ├── teacher/
    │   │   ├── layout.js
    │   │   ├── page.js
    │   │   ├── nav/index.js
    │   │   ├── overview/page.js
    │   │   └── ui/
    │   │       ├── main/index.js
    │   │       └── report/
    │   │           ├── index.js
    │   │           └── chart.js
    │   ├── error.js
    │   ├── layout.js
    │   ├── loading.js
    │   └── page.js
    ├── components/
    │   ├── (features)/
    │   │   ├── (noti)/
    │   │   │   ├── alert/index.js
    │   │   │   ├── noti/index.js
    │   │   │   └── textnoti/index.js
    │   │   └── (popup)/
    │   │       ├── popup_center/index.js
    │   │       ├── popup_right/index.js
    │   │       └── title/index.js
    │   ├── (icon)/svg/index.js
    │   ├── (layout)/
    │   │   ├── login/index.js
    │   │   ├── nav/index.js
    │   │   └── navMobile/index.js
    │   └── (ui)/
    │       ├── (box)/file/index.js
    │       ├── (button)/
    │       │   ├── button/index.js
    │       │   ├── hoveIcon/index.js
    │       │   ├── menu/index.js
    │       │   ├── swith/index.js
    │       │   └── tooltip/index.js
    │       ├── (image)/index.js
    │       ├── (input)/input/index.js
    │       ├── (loading)/loading/index.js
    │       └── grid/index.js
    ├── config/
    │   └── connectDB.js
    ├── data/
    │   ├── actions/
    │   │   ├── get.js
    │   │   └── reload.js
    │   ├── client.js
    │   ├── course.js
    │   ├── database/
    │   │   ├── area.js
    │   │   ├── book.js
    │   │   ├── course.js
    │   │   ├── coursetry.js
    │   │   ├── form.js
    │   │   ├── invoices.js
    │   │   ├── label.js
    │   │   ├── student.js
    │   │   ├── user.js
    │   │   └── zalo.js
    │   ├── default/index.js
    │   └── style/color.js
    ├── function/
    │   ├── index.js
    │   ├── server.js
    │   └── drive/
    │       ├── index.js
    │       ├── image.js
    │       └── appscript.js
    ├── hooks/
    │   └── useCrudManager.js
    ├── lib/
    │   └── cache.js
    ├── models/
    │   ├── area.js
    │   ├── book.js
    │   ├── course.js
    │   ├── coursetry.js
    │   ├── customer.js
    │   ├── formclient.js
    │   ├── historyClient.js
    │   ├── invoices.js
    │   ├── label.js
    │   ├── log.js
    │   ├── schedule.js
    │   ├── student.js
    │   ├── users.js
    │   ├── variant.js
    │   └── zalo.js
    ├── styles/
    │   ├── all.css
    │   └── font.css
    └── utils/
        ├── authenticate.js
        ├── checktoken.js
        ├── checkuser.js
        ├── env.js
        ├── fetchApi.js
        └── response.js
```

---

## 2. Tổng quan công nghệ

| Mục | Chi tiết |
|------|---------|
| **Framework** | Next.js 16.2.7 (App Router) |
| **UI Library** | React 19.2.7 |
| **Styling** | Tailwind CSS v4 |
| **Database** | MongoDB + Mongoose 8.16.4 |
| **Auth** | JWT + bcryptjs + cookie |
| **AI** | Google Gemini AI, Google Drive API |
| **Chart** | Chart.js 4.4.9 + react-chartjs-2 |
| **Export** | ExcelJS |
| **Deploy** | Docker + VPS |

---

## 3. Routes (Pages)

| Route | Layout | Chức năng |
|-------|--------|-----------|
| `/` | Root layout | Trang chủ, redirect theo role |
| `/login` | Root layout | Đăng nhập |
| `/[id]` | Student layout | Profile học viên |
| `/[id]/courses` | Student layout | Khóa học của học viên |
| `/[id]/overview` | Student layout | Tổng quan học viên |
| `/calendar` | Root layout | Lịch dạy |
| `/calendar/[id]` | Root layout | Chi tiết buổi học (điểm danh, cmt) |
| `/client` | Root layout | Quản lý khách hàng (CRM) |
| `/course` | Root layout | Danh sách khóa học |
| `/course/[...id]` | Root layout | Chi tiết khóa học |
| `/course/book/[id]` | Root layout | Quản lý giáo trình |
| `/course/trycourse` | Root layout | Khóa học thử |
| `/student/list` | Student layout | Danh sách học viên |
| `/student/overview` | Student layout | Tổng quan học viên |
| `/student/overview/overviews` | Student layout | Thống kê chi tiết |
| `/teacher` | Teacher layout | Dashboard giáo viên |
| `/teacher/overview` | Teacher layout | Tổng quan giáo viên |

---

## 4. API Routes

### Auth (`/api/(auth)`)
| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/check` | POST | Kiểm tra token |
| `/api/login` | POST | Đăng nhập |
| `/api/logout` | POST | Đăng xuất |
| `/api/register` | POST | Đăng ký |
| `/api/roleuser/[id]` | GET/PUT | Role user |

### Course (`/api/(course)`)
| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/book` | GET/POST | Giáo trình |
| `/api/book/[id]` | GET/PUT/DELETE | Chi tiết giáo trình |
| `/api/calendar` | GET/POST | Lịch học |
| `/api/calendar/[id]` | GET/PUT/DELETE | Chi tiết buổi học |
| `/api/checkin` | POST | Điểm danh |
| `/api/course` | GET/POST | Khóa học |
| `/api/course/[id]` | GET/PUT/DELETE | Chi tiết khóa học |
| `/api/course/[id]/student` | POST | Thêm học viên vào khóa |
| `/api/course/ucalendarcourse` | PUT | Cập nhật lịch khóa học |
| `/api/coursetry` | GET/POST | Khóa học thử |
| `/api/exportx` | POST | Export Excel |
| `/api/studentcourse/[id]` | DELETE | Xóa học viên khỏi khóa |
| `/api/updatecmtfn` | PUT | Cập nhật comment |
| `/api/updateimage` | PUT | Cập nhật ảnh |
| `/api/updateimagestudent` | PUT | Cập nhật ảnh học viên |

### Client / CRM (`/api/(client)`)
| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/client` | GET/POST | Quản lý khách hàng |
| `/api/hissmes` | GET | Lịch sử SMS |
| `/api/hissmes/[phone]` | GET | Lịch sử SMS theo SĐT |
| `/api/label` | GET/POST | Nhãn khách hàng |
| `/api/re` | POST | Gửi lại tin nhắn |
| `/api/res` | POST | Trả lời tin nhắn |
| `/api/sendmes` | POST | Gửi tin nhắn |

### Student (`/api/(student)`)
| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/pay` | POST | Thanh toán |
| `/api/student` | GET/POST | Danh sách học viên |
| `/api/student/[id]` | GET/PUT | Chi tiết học viên |
| `/api/student/[id]/profile` | GET/PUT | Profile học viên |
| `/api/student/[id]/status` | PUT | Cập nhật trạng thái |

### Others
| Endpoint | Method | Chức năng |
|----------|--------|-----------|
| `/api/area` | GET/POST | Khu vực |
| `/api/area/[id]` | GET/PUT/DELETE | Chi tiết khu vực |
| `/api/image` | POST | Upload ảnh lên Google Drive |
| `/api/cmt` | POST | AI comment |
| `/api/reaicmt` | POST | AI re-comment |
| `/api/action` | POST | Zalo action |
| `/api/senduser` | POST | Gửi Zalo user |

---

## 5. Components

### Layout
| Component | Path | Chức năng |
|-----------|------|-----------|
| Nav (Sidebar) | `src/components/(layout)/nav/` | Sidebar chính, collapse/expand, tooltip |
| NavMobile | `src/components/(layout)/navMobile/` | Navigation mobile |
| Login | `src/components/(layout)/login/` | Form đăng nhập |

### Features
| Component | Path | Chức năng |
|-----------|------|-----------|
| Noti | `src/components/(features)/(noti)/noti/` | Thông báo overlay (success/fail) |
| Alert | `src/components/(features)/(noti)/alert/` | Alert component |
| TextNoti | `src/components/(features)/(noti)/textnoti/` | Text notification |
| PopupCenter | `src/components/(features)/(popup)/popup_center/` | Popup trung tâm |
| PopupRight | `src/components/(features)/(popup)/popup_right/` | Popup phải |
| Title | `src/components/(features)/(popup)/title/` | Tiêu đề popup |

### UI
| Component | Path | Chức năng |
|-----------|------|-----------|
| Button | `src/components/(ui)/(button)/button/` | Button base |
| HoveIcon | `src/components/(ui)/(button)/hoveIcon/` | Icon hover |
| Menu | `src/components/(ui)/(button)/menu/` | Dropdown menu |
| Switch | `src/components/(ui)/(button)/swith/` | Toggle switch |
| Tooltip | `src/components/(ui)/(button)/tooltip/` | Tooltip |
| Input | `src/components/(ui)/(input)/input/` | Input field |
| Loading | `src/components/(ui)/(loading)/loading/` | Loading spinner |
| Grid | `src/components/(ui)/grid/` | Grid layout |
| Image | `src/components/(ui)/(image)/` | Image component |
| File | `src/components/(ui)/(box)/file/` | File upload |
| SVG | `src/components/(icon)/svg/` | SVG icons |

---

## 6. Data Layer

### Models (Mongoose)
| Model | Path | Bộ sưu tập |
|-------|------|------------|
| Area | `src/models/area.js` | Khu vực |
| Book | `src/models/book.js` | Giáo trình |
| Course | `src/models/course.js` | Khóa học |
| Coursetry | `src/models/coursetry.js` | Khóa học thử |
| Customer | `src/models/customer.js` | Khách hàng (Zalo) |
| FormClient | `src/models/formclient.js` | Form khách hàng |
| HistoryClient | `src/models/historyClient.js` | Lịch sử khách hàng |
| Invoices | `src/models/invoices.js` | Hóa đơn |
| Label | `src/models/label.js` | Nhãn |
| Log | `src/models/log.js` | Log |
| Schedule | `src/models/schedule.js` | Lịch học |
| Student | `src/models/student.js` | Học viên |
| Users | `src/models/users.js` | Người dùng |
| Variant | `src/models/variant.js` | Variant |
| Zalo | `src/models/zalo.js` | Tài khoản Zalo |

### Database Helpers (`src/data/database/`)
| File | Chức năng |
|------|-----------|
| `area.js` | CRUD khu vực |
| `book.js` | CRUD giáo trình |
| `course.js` | CRUD khóa học |
| `coursetry.js` | CRUD khóa học thử |
| `form.js` | CRUD form |
| `invoices.js` | CRUD hóa đơn |
| `label.js` | CRUD nhãn |
| `student.js` | CRUD học viên |
| `user.js` | CRUD người dùng |
| `zalo.js` | CRUD Zalo |

### Data Access (`src/data/`)
| File | Chức năng |
|------|-----------|
| `client.js` | Data client/CRM |
| `course.js` | Data course |
| `actions/get.js` | Server actions — get data |
| `actions/reload.js` | Server actions — reload data |
| `default/index.js` | Default data |
| `style/color.js` | Color definitions |

---

## 7. Server Actions
| File | Chức năng |
|------|-----------|
| `customer.actions.js` | Actions cho customer |
| `data.actions.js` | Actions cho data |
| `label.actions.js` | Actions cho label |
| `schedule.actions.js` | Actions cho schedule |
| `variant.actions.js` | Actions cho variant |
| `zalo.actions.js` | Actions cho Zalo |

---

## 8. Utilities
| File | Chức năng |
|------|-----------|
| `env.js` | `getAppUrl()`, `getCookieName()`, `getJwtSecret()`, `getMongoUri()` |
| `fetchApi.js` | Fetch wrapper (tự động thêm URL, token) |
| `authenticate.js` | Xác thực |
| `checktoken.js` | Kiểm tra token |
| `checkuser.js` | Kiểm tra user |
| `response.js` | Response helper |
| `cache.js` | Cache helper |

---

## 9. Functions (`src/function/`)
| File | Chức năng |
|------|-----------|
| `index.js` | Utility functions |
| `server.js` | Server-side helpers |
| `drive/index.js` | Google Drive integration |
| `drive/image.js` | Image upload to Drive |
| `drive/appscript.js` | Google Apps Script |

---

## 10. Config & Global

| File | Chức năng |
|------|-----------|
| `src/styles/all.css` | Tailwind v4 theme, CSS variables, global styles, dark mode |
| `src/styles/font.css` | Font imports (Inter, Roboto) |
| `src/config/connectDB.js` | Kết nối MongoDB |
| `src/hooks/useCrudManager.js` | Hook CRUD cho form |
| `src/app/error.js` | Error boundary global |
| `src/app/loading.js` | Loading global |
| `src/app/layout.js` | Root layout (sidebar, nav, content) |

---

## 11. Styling — Tailwind CSS v4

### Theme (`all.css`)
```css
@theme {
  --color-main: #0374da;
  --color-main-b: #1688eb;
  --color-main-d: #0374da;
  --color-main-l: #e8f4ff;
}
```

### CSS Variables
| Variable | Light | Dark |
|----------|-------|------|
| `--bg-primary` | `#ffffff` | `#252728` |
| `--text-primary` | `#656565` | `#e4e6ea` |
| `--border-color` | `#e0e0e0` | `#404244` |
| `--main` | `#0374da` | `#0374da` |
| `--bg-secondary` | `#f2f4f7` | `#1c1c1d` |
| `--bg-btn` | `#e2e5e9` | `#3b3d3e` |
| `--hover` | `#efefef` | `#4d4d4d` |
| `--popup-width` | `320px` | `320px` |
| `--sidebar-w` | `240px` | `240px` |

### Global Classes
- `.scroll` — Custom scrollbar
- `.loadingOverlay` — Loading overlay fullscreen
- `.button` — Animated button (hover gradient effect)

---

## 12. Environment Variables

| Variable | Mô tả |
|----------|-------|
| `URL` | App URL (dùng cho server-side fetch, fallback `http://localhost:3000`) |
| `MongoDB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key cho JWT |
| `token` | Token name |
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_CLIENT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |
| `GEMINI_API_KEY` | Google Gemini AI API key |

---

## 13. Project Statistics

| Loại | Số lượng |
|------|----------|
| Pages | ~20 routes |
| API endpoints | ~30 route files |
| Components | ~25 components |
| Mongoose Models | 16 models |
| Database helpers | 10 files |
| Server Actions | 6 files |
| CSS files | 2 (`all.css`, `font.css`) |
| Dependencies | ~16 production, ~4 dev |

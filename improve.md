# Đề xuất cải tiến cấu trúc dự án

> Dựa trên đánh giá tổng quan code và kiến trúc dự án system-airobotic

---

## Mục lục

1. [Sửa lỗi route /login](#1-s%E1%BB%ADa-l%E1%BB%97i-route-login)
2. [Dẹp Route Groups giả](#2-d%E1%BA%B9p-route-groups-gi%E1%BA%A3)
3. [Thống nhất data fetching pattern](#3-th%E1%BB%91ng-nh%E1%BA%A5t-data-fetching-pattern)
4. [Tổ chức lại components/](#4-t%E1%BB%95-ch%E1%BB%A9c-l%E1%BA%A1i-components)
5. [Cấu trúc thư mục đề xuất](#5-c%E1%BA%A5u-tr%C3%BAc-th%C6%B0-m%E1%BB%A5c-%C4%91%E1%BB%81-xu%E1%BA%A5t)
6. [Xoá file chết](#6-xo%C3%A1-file-ch%E1%BA%BFt)
7. [Sửa lỗi đặt tên](#7-s%E1%BB%ADa-l%E1%BB%97i-%C4%91%E1%BA%B7t-t%C3%AAn)
8. [Checklist triển khai](#8-checklist-tri%E1%BB%83n-khai)

---

## 1. Sửa lỗi route /login

### Vấn đề
`app/page.js` gọi `redirect('/login')` khi không có token, nhưng không có route nào cho `/login`. UI login chỉ được render conditional trong root `layout.js`.

### Cách sửa

**Tạo** `app/login/page.js`:

```js
import LoginForm from '@/components/(layout)/login';
import checkAuthToken from '@/utils/checktoken';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const user = await checkAuthToken();
  if (user) redirect('/');
  return <LoginForm />;
}
```

**Chuyển** component login từ `app/(auth)/login.js` vào `components/(layout)/login/index.js`.

**Sửa** `app/page.js` — thay `redirect('/login')` bằng render `<LoginForm />` hoặc redirect hẳn:

```js
if (!user) redirect('/login');  // Lúc này /login là route thật, không còn 404
```

**Xoá** conditional render login trong `app/layout.js` — không cần thiết nữa.

---

## 2. Dẹp Route Groups giả

### Vấn đề
`(admin)/`, `(teacher)/`, `(auth)/` là route groups nhưng không chứa route thật. Chúng chỉ chứa component được import từ nơi khác.

### Cách sửa
Tạo private folder `app/_components/` và chuyển các component từ route groups vào đó:

```
app/
  _components/
    admin/
      index.js           # Từ (admin)/index.js
      ui/
        student.js       # Từ (admin)/ui/student.js
        teacher/         # Từ (admin)/ui/teacher/
    teacher/
      index.js           # Từ (teacher)/index.js
      main.js            # Từ (teacher)/main.js
    auth/
      login.js           # Từ (auth)/login.js
```

Sau đó cập nhật import:
- `app/page.js`: `import AdminPage from '@/_components/admin'` thay cho `@/app/(admin)/index`
- `app/layout.js`: `import Layout_Login from '@/_components/auth/login'` thay cho `@/app/(auth)/login`

**Xoá** các thư mục `(admin)/`, `(teacher)/`, `(auth)/` sau khi chuyển xong.

---

## 3. Thống nhất data fetching pattern

### Vấn đề
Hiện tại có 2 pattern song song:
- **Pattern A:** Page gọi `data/database/xxx.js` trực tiếp
- **Pattern B:** Page gọi `data/actions/get.js` → gọi `data/database/xxx.js`
- **Pattern C:** Component gọi `fetchApi()` → gọi API route `app/api/xxx/route.js` → gọi `data/database/xxx.js`

### Cách sửa
Chọn **1 pattern duy nhất**. Khuyến nghị:

**Server Components → Server Actions (data/actions) → Database**

```
Page (Server Component)
  └─ data/actions/get.js        # "use server"
       └─ data/database/xxx.js  # Mongoose queries
```

Thay vì dùng `app/api/` cho CRUD, hãy dùng Server Actions. Giữ `app/api/` chỉ cho:
- Webhooks (Zalo callback, Google)
- File upload
- Các endpoint cần gọi từ bên ngoài

Ví dụ thống nhất:

```js
// data/actions/student.js (server action)
'use server'
import { getStudentOne, getStudentAll } from '@/data/database/student'

export async function student_data(_id) {
  return _id ? await getStudentOne(_id) : await getStudentAll()
}

export async function updateStudentAction(prev, formData) {
  // mutation logic ở đây
}
```

**Chặn access trực tiếp** vào `data/database/` từ page — chỉ qua `data/actions/`.

---

## 4. Tổ chức lại components/

### Vấn đề
- Quá nhiều tầng ngoặc đơn: `(features)/(noti)/`, `(ui)/(button)/`
- Component route-specific (nav, sidebar) nằm trong `app/student/nav/`, `app/teacher/nav/`

### Cách sắp xếp đề xuất

```
components/
  ui/                          # UI atomic components
    button/
    input/
    loading/
    tooltip/
    grid/
    image/
    menu/
    switch/                    # Đã sửa từ swith
  layout/                      # Layout components
    nav/
    sidebar/
    login/
  features/                    # Feature-specific (không lồng ngoặc)
    noti/
      alert/
      notification/
      textnoti/
    popup/
      center/
      right/
      title/
  icons/
    svg/
```

Nếu component chỉ dùng trong 1 route, đặt trong `app/_components/` (private folder).

---

## 5. Cấu trúc thư mục đề xuất (tổng thể)

```
system-airobotic/
├── app/
│   ├── _components/           # Shared components nội bộ app
│   ├── login/
│   │   └── page.js            # Route login thật
│   ├── (dashboard)/
│   │   ├── page.js            # Trang chủ (role-based)
│   │   └── layout.js
│   ├── [id]/
│   ├── calendar/
│   ├── client/
│   ├── course/
│   ├── student/
│   ├── teacher/
│   ├── actions/               # Server Actions (duy nhất)
│   │   ├── student.actions.js
│   │   ├── customer.actions.js
│   │   ├── course.actions.js
│   │   ├── schedule.actions.js
│   │   ├── label.actions.js
│   │   ├── variant.actions.js
│   │   ├── zalo.actions.js
│   │   └── get.js
│   └── api/                   # Chỉ webhooks & external endpoints
│       └── (webhook)/
│           └── zalo/route.js
│
├── components/                # UI Components chuẩn
│   ├── ui/
│   ├── layout/
│   ├── features/
│   └── icons/
│
├── data/
│   ├── database/              # Mongoose queries (CHỈ gọi từ data/actions/)
│   ├── default/               # Default data factories
│   └── style/
│
├── models/                    # Mongoose schemas
├── lib/                       # Third-party integrations
├── hooks/                     # Custom React hooks
├── utils/                     # Utility functions
├── config/                    # Global config
├── styles/                    # Global styles
└── public/                    # Static assets (images, fonts...)
```

---

## 6. Xoá file chết

| File | Lý do |
|------|-------|
| `next.config.mjs` | Config rỗng, `next.config.js` đã có config thật |
| `public/index.js` | Public chỉ nên chứa static assets, file JS không có tác dụng |
| `models/users.js:1` | `import Zalo from '@/app/client/ui/zalo'` — unused import, có thể gây circular dependency |
| `app/(admin)/` | Sau khi chuyển component sang `app/_components/` |
| `app/(teacher)/` | Sau khi chuyển component sang `app/_components/` |
| `app/(auth)/` | Sau khi tạo route login thật |

---

## 7. Sửa lỗi đặt tên

| Đường dẫn hiện tại | Sửa thành | Lý do |
|---|---|---|
| `components/(ui)/(button)/swith/` | `components/ui/switch/` | Sai chính tả + bỏ ngoặc đơn thừa |
| `app/client/ui/hisotry/` | `app/client/ui/history/` | Sai chính tả |
| `data/default/index.js:28` | `'Chưa xác định'` | Thiếu dấu |
| `data/database/user.js:116` | `'Lỗi trong UserReport'` | Sai tên hàm trong log |

---

## 8. Checklist triển khai

### Mức độ 1 — Urgent (cần làm ngay)
- [ ] Tạo `app/login/page.js` — route login thật
- [ ] Xoá `next.config.mjs`
- [ ] Xoá `public/index.js`

### Mức độ 2 — Cải thiện kiến trúc
- [ ] Tạo `app/_components/` và chuyển component từ route groups
- [ ] Xoá `(admin)/`, `(teacher)/`, `(auth)/`
- [ ] Thống nhất data fetching pattern (chọn Server Actions làm chính)
- [ ] Tổ chức lại `components/` — bỏ ngoặc đơn, sửa tên folder sai

### Mức độ 3 — Nâng cao
- [ ] Dồn API routes CRUD vào Server Actions, giữ API chỉ cho webhook
- [ ] Thêm `TypeScript` cho type safety
- [ ] Thêm unit test cho database queries
- [ ] Thêm `docker-compose.yml` cho môi trường dev
- [ ] CI/CD pipeline (GitHub Actions)

---

*Cập nhật lần cuối: 05/06/2026*

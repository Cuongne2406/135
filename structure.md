# Cấu trúc dự án chuẩn - system-airobotic

> Cấu trúc thư mục đề xuất sau khi refactor, dựa trên Next.js App Router convention.

---

## Kiến trúc tổng quan

```
system-airobotic/
│
├── app/                          # Next.js App Router
│   ├── _components/              # Shared components nội bộ (private folder)
│   ├── login/                    # Route: /login
│   ├── (dashboard)/              # Route group: trang chủ
│   ├── [id]/                     # Dynamic route: /[id]
│   ├── calendar/                 # Route: /calendar
│   ├── client/                   # Route: /client
│   ├── course/                   # Route: /course
│   ├── student/                  # Route: /student
│   ├── teacher/                  # Route: /teacher
│   ├── actions/                  # Server Actions
│   └── api/                      # API Routes (chỉ webhook/endpoint ngoài)
│
├── components/                   # UI Components (dùng chung toàn app)
│   ├── ui/                       # Atomic components
│   ├── layout/                   # Layout components
│   ├── features/                 # Feature-specific components
│   └── icons/                    # Icons & SVGs
│
├── data/                         # Data layer
│   ├── database/                 # Mongoose queries
│   ├── default/                  # Default data factories
│   └── style/                    # Style utilities
│
├── models/                       # Mongoose schemas
├── lib/                          # Thư viện / third-party integation
├── hooks/                        # Custom React hooks
├── utils/                        # Utility functions
├── config/                       # Global config
├── styles/                       # Global styles
├── public/                       # Static assets
│
├── function/                     # Server-side utilities
│   └── drive/                    # Google Drive integration
│
├── Dockerfile
├── next.config.js
├── package.json
├── jsconfig.json
└── .env                          # Environment variables
```

---

## Chi tiết từng thư mục

### `app/` — Next.js App Router

```
app/
├── _components/                  # Private — không tạo route
│   ├── admin/
│   │   ├── index.js              # Admin dashboard
│   │   └── ui/
│   │       ├── student.js
│   │       └── teacher/
│   ├── teacher/
│   │   ├── index.js              # Teacher dashboard
│   │   └── main.js
│   └── auth/
│       └── login.js              # Login form component
│
├── login/                        # Route: /login
│   └── page.js
│
├── (dashboard)/                  # Route group — trang chủ
│   ├── layout.js
│   ├── page.js                   # Role-based (Admin → AdminPage, Teacher → TeacherPage)
│   ├── loading.js
│   └── error.js
│
├── [id]/                         # Dynamic route: /[id] (student detail)
│   ├── layout.js                 # Student info banner
│   ├── page.js                   # Tab: Profile
│   ├── courses/
│   │   ├── page.js
│   │   ├── loading.js
│   │   ├── error.js
│   │   └── main.js
│   ├── overview/
│   │   ├── page.js
│   │   ├── loading.js
│   │   └── error.js
│   └── ui/
│       ├── banner/
│       ├── pickimage/
│       └── profile/
│
├── calendar/                     # Route: /calendar
│   ├── page.js
│   ├── loading.js
│   ├── [id]/                     # /calendar/[id] (lesson detail)
│   │   ├── page.js
│   │   └── ui/
│   │       └── main/
│   └── ui/
│       ├── button/
│       │   └── load.js
│       ├── lesson_m/
│       ├── lesson_td/
│       ├── listlesson/
│       ├── month/
│       └── today/
│
├── client/                       # Route: /client (customer management)
│   ├── page.js
│   ├── loading.js
│   ├── _components/              # Private — component chỉ dùng trong /client
│   │   ├── action/
│   │   ├── data/
│   │   ├── filter/
│   │   ├── history/              # Đã sửa tên từ hisotry
│   │   ├── label/
│   │   ├── run/
│   │   ├── table/
│   │   ├── variant/
│   │   ├── zalo/
│   │   └── zalos/
│   └── _index.js                 # Main view component
│
├── course/                       # Route: /course
│   ├── page.js
│   ├── loading.js
│   ├── [...id]/                  # Catch-all: /course/[...id]
│   │   ├── page.js
│   │   ├── loading.js
│   │   └── ui/
│   │       ├── timeline/
│   │       └── detailcourse/
│   ├── book/
│   │   └── [id]/
│   ├── template/
│   │   └── navbar/
│   ├── trycourse/
│   │   ├── page.js
│   │   ├── filter.js
│   │   ├── main.js
│   │   └── _components/
│   └── _components/              # Private — component chỉ dùng trong /course
│       ├── area-item/
│       ├── book-item/
│       ├── course-item/
│       ├── coursetry-item/
│       ├── create/
│       ├── createarea/
│       ├── createbook/
│       └── nav-item/
│
├── student/                      # Route: /student
│   ├── layout.js
│   ├── loading.js
│   ├── list/
│   │   ├── page.js
│   │   ├── layout/
│   │   │   ├── filter/
│   │   │   └── main/
│   │   └── _components/
│   │       ├── create/
│   │       ├── itemStudent/
│   │       ├── out/
│   │       ├── pay/
│   │       └── update/
│   ├── overview/
│   │   ├── page.js
│   │   ├── layout.js
│   │   ├── client.js
│   │   └── overviews/
│   │       └── page.js 
│   └── _components/
│       └── nav/                  # Navigation component (private)
│
├── teacher/                      # Route: /teacher
│   ├── layout.js                 # Admin-only access check
│   ├── page.js
│   ├── overview/
│   │   └── page.js
│   └── _components/
│       ├── nav/                  # Navigation component (private)
│       ├── main/
│       └── report/
│           └── chart.js
│
├── actions/                      # Server Actions (use server)
│   ├── get.js                    # Server action: get all data types
│   ├── reload.js                 # Server action: revalidation
│   ├── customer.actions.js
│   ├── data.actions.js
│   ├── label.actions.js
│   ├── schedule.actions.js
│   ├── variant.actions.js
│   └── zalo.actions.js
│
└── api/                          # API Routes (chỉ cho mục đích đặc biệt)
    ├── (ai)/
    │   ├── cmt/route.js
    │   └── reaicmt/route.js
    ├── (area)/
    │   ├── area/route.js
    │   └── area/[id]/route.js
    ├── (auth)/
    │   ├── check/route.js
    │   ├── login/route.js
    │   ├── logout/route.js
    │   ├── register/route.js
    │   └── roleuser/[id]/route.js
    ├── (client)/
    │   ├── client/route.js
    │   ├── hissmes/route.js
    │   ├── hissmes/[phone]/route.js
    │   ├── label/route.js
    │   ├── re/route.js
    │   ├── res/route.js
    │   └── sendmes/route.js
    ├── (course)/
    │   ├── book/route.js
    │   ├── book/[id]/route.js
    │   ├── calendar/route.js
    │   ├── calendar/[id]/route.js
    │   ├── checkin/route.js
    │   ├── course/route.js
    │   ├── course/[id]/route.js
    │   ├── course/[id]/ucalendarcourse/route.js
    │   ├── coursetry/route.js
    │   ├── exportx/route.js
    │   ├── studentcourse/[id]/route.js
    │   ├── updatecmtfn/route.js
    │   ├── updateimage/route.js
    │   └── updateimagestudent/route.js
    ├── (image)/
    │   └── image/route.js
    ├── (student)/
    │   ├── pay/route.js
    │   ├── student/route.js
    │   └── student/[id]/route.js
    └── (zalo)/
        ├── action/route.js
        └── senduser/route.js
```

### `components/` — UI Components (dùng chung)

```
components/
├── ui/                           # Atomic UI components
│   ├── button/
│   ├── input/
│   │   └── input.js
│   ├── loading/
│   │   └── loading.js
│   ├── switch/                   # Đã sửa tên từ swith
│   ├── tooltip/
│   ├── grid/
│   ├── image/
│   ├── menu/
│   └── box/
│       └── file/
│
├── layout/                       # Layout components
│   ├── nav/
│   └── login/
│
├── features/                     # Feature-specific (dùng ở nhiều route)
│   ├── noti/
│   │   ├── alert/
│   │   ├── noti/
│   │   └── textnoti/
│   └── popup/
│       ├── center/
│       ├── right/
│       └── title/
│
└── icons/
    └── svg/
```

### `data/` — Data Layer

```
data/
├── database/                     # Mongoose database queries
│   ├── area.js
│   ├── book.js
│   ├── course.js
│   ├── coursetry.js
│   ├── form.js
│   ├── invoices.js
│   ├── label.js
│   ├── student.js
│   ├── user.js
│   └── zalo.js
│
├── default/                      # Default data factories
│   └── index.js
│
└── style/
    └── color.js
```

### `models/` — Mongoose Schemas

```
models/
├── area.js
├── book.js
├── course.js
├── coursetry.js
├── customer.js
├── formclient.js
├── historyClient.js
├── invoices.js
├── label.js
├── log.js
├── schedule.js
├── student.js
├── users.js
├── variant.js
└── zalo.js
```

### `utils/` — Utilities

```
utils/
├── authenticate.js               # Request authentication wrapper
├── checktoken.js                 # JWT verify (server component)
├── checkuser.js                  # JWT verify (API route)
├── fetchApi.js                   # Universal fetch wrapper
└── response.js                   # API response helper + CORS
```

### `function/` — Server-side logic

```
function/
├── index.js                      # formatDate, countStudents, srcImage...
├── server.js                     # CheckRole, CheckSlide, CheckProfileDone
└── drive/
    ├── index.js                  # Google Drive API client
    ├── image.js                  # Upload image to Drive
    └── appscript.js              # Google Apps Script integration
```

### Root files

```
├── Dockerfile                    # Docker build (secrets qua build args, ko hardcode)
├── next.config.js                # Images, standalone output
├── package.json                  # Dependencies & scripts
├── jsconfig.json                 # Path alias @/
├── .env                          # Environment variables (.gitignore đã có .env*)
├── .gitignore
├── .dockerignore
└── .gitattributes
```

---

## Luồng dữ liệu chuẩn

```
[Browser]
    │
    ├── Page (Server Component)
    │     └── Server Action (data/actions/get.js)
    │           └── Database Query (data/database/xxx.js)
    │                 └── MongoDB
    │
    ├── Client Component
    │     └── fetch() → API Route (app/api/xxx/route.js)
    │           └── Database Query (data/database/xxx.js)
    │                 └── MongoDB
    │
    └── Form (Client)
          └── Server Action (app/actions/xxx.actions.js)
                └── Database Mutation
```

---

## Nguyên tắc

| Nguyên tắc | Mô tả |
|---|---|
| **Private folder** | Dùng `_tên` cho component chỉ dùng trong 1 route, đặt trong thư mục route đó |
| **Shared component** | Component dùng ở ≥2 route → đặt trong `components/` |
| **Route Group** | Chỉ dùng `(tên)` khi thực sự cần nhóm route để share layout |
| **1 pattern data** | Server Components ưu tiên dùng Server Actions, hạn chế gọi API nội bộ |
| **Ko file chết** | Xoá file không dùng, config trùng lặp |
| **Tên chính xác** | Ko viết tắt, ko sai chính tả |

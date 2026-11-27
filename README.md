# HRMS Portal

A full-stack Human Resource Management System (HRMS) built with **React 19 + Vite + Tailwind CSS 4** (`client/`) and **Node.js + Express + MongoDB** (`server/`). Includes role-based access (`admin`, `hr`, `manager`, `employee`), biometric Face ID login, Two-Factor Authentication (2FA), automated Earned Leave generation, payroll processing with PDF/Print payslips, and interactive analytics.

---

## Project Structure

```text
HRMS/
├── client/                 # React + Vite frontend (Vercel SPA rewrite via vercel.json)
│   ├── public/models/      # face-api.js weights & shards
│   └── src/
│       ├── components/     # Modals, AdminPayrollView, HolidayManagerModal, UI toasts/dialogs
│       ├── features/auth/  # FaceLogin & FaceEnrollment
│       ├── layouts/        # DashboardLayout (unified slate/primary theme & notifications)
│       ├── pages/          # Lazy-loaded route pages
│       ├── services/       # Axios API client (src/services/api.js)
│       └── store/          # Zustand stores (useAuthStore, useUIStore)
└── server/                 # Express + Mongoose REST API
    ├── config/             # MongoDB connection
    ├── controllers/        # Business logic (auth, employees, attendance, leave, payroll, holidays, announcements, etc.)
    ├── middlewares/        # JWT auth & error handling
    ├── models/             # Mongoose schemas
    ├── routes/             # Express route modules (/api/*)
    └── seedHolidays.js     # Holiday seeding script (2026–2027)
```

---

## Key Features Implemented

### Authentication & Security
- **Role-Tailored Login UI**: Dynamic visual themes and quick demo-fill for **Admin** (Blue), **HR Manager** (Emerald), and **Developer** (Violet).
- **Face Recognition & 2FA**: Biometric login/enrollment via `face-api.js`, TOTP 2FA with QR code + manual setup key, and 4-level password strength meters on Change & Reset Password pages.
- **SPA Routing on Vercel**: Configured [client/vercel.json](client/vercel.json) rewrites so refreshing any client route serves `/index.html`.

### Dashboard & Team Collaboration
- **Attendance Clock-In / Clock-Out**: Geolocation-verified punches, 2-hour permission requests, and regularization requests.
- **Company Announcements**: Pinned/prioritized notices (`info`, `important`, `urgent`) with Admin/HR Create, Edit, and Delete controls.
- **On Leave Today & Celebrations**: Live team availability widget plus clickable **New Joiners**, **Birthdays**, and **Job Anniversaries** modals.
- **Upcoming Holidays Marquee**: Continuous horizontal marquee synced directly with the Holiday Manager database.

### Attendance, Leaves & Holiday Management
- **Holiday Manager (`/holidays`)**: Full CRUD (`Create`, `Edit`, `Delete`, and default 2026–2027 seeding) for Admin/HR, synced with the Dashboard and Attendance Calendar.
- **Automatic Earned Leave (EL) Generation**: Working-day check-ins without approved leave increment a 20-day streak counter (`earnedLeaveProgress`). Every 20 consecutive working days automatically credits `+1` Earned Leave and sends a notification; approved leaves reset the streak.
- **Leave Workflow**: Live day-count calculator, date validation, balance preview, status filter tabs, and overlapping team leave warnings on approval.
- **Attendance Queues & Reports**: Unified **Regularizations | Permissions (2h)** approval screen, **Attendance Calendar** (with holiday markers & Today jump), **My Attendance Log** (including 2-hour permission status history), and **Attendance Report Grid**.

### Employees, Payroll, Assessments & Analytics
- **Personnel Directory & Org Chart (`/employees`)**: Search, multi-filter dropdown, CSV export, Earned Leave (EL) progress column, and a clickable **Directory | Org Chart** reporting hierarchy view.
- **Employee Document Vault (`/profile`)**: Upload, categorize (`Offer Letter`, `ID Proof`, `Tax Form`, `Other`), download, and delete documents, plus self-service profile photo upload.
- **Salary & Payroll (`/payroll`)**: Personal salary slips for all roles (`admin`, `hr`, `manager`, `employee`), Admin/HR payroll processing, allowance/deduction adjustments, **Mark Paid / Mark All Paid** (`paidAt` tracking), PDF export, and `@media print`-styled payslip printing.
- **Self-Assessments (`/assessments`)**: Quarterly employee self-rating/submission locking and manager review workflow.
- **Reports & Analytics (`/reports`)**: Interactive `recharts` visualizations (Daily Attendance Trend, Headcount by Department, Leave Status Mix) and CSV exports.

---

## Local Setup

### 1. Server (`d:\HRMS\server`)
```bash
cd server
npm install
# Configure .env (PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, EMAIL_*)
node seedHolidays.js   # Optional: seed 2026–2027 holidays
npm run dev
```

### 2. Client (`d:\HRMS\client`)
```bash
cd client
npm install
npm run dev
```

For detailed module docs, see [client/README.md](client/README.md) and [server/README.md](server/README.md).

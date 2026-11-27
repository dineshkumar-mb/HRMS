# HRMS Client

Frontend application for the Human Resource Management System (HRMS), built with **React 19**, **Vite**, and **Tailwind CSS 4**.

## Tech Stack

- **Framework:** React 19 (via Vite 7 with `React.lazy` route code-splitting)
- **Styling:** Tailwind CSS 4 (`@theme` tokens, custom animations, `@media print` payslip rules)
- **State Management:** Zustand (`useAuthStore`, `useUIStore` for global toasts & confirmation dialogs)
- **Routing:** React Router DOM 7 (with `vercel.json` SPA rewrite rules)
- **Icons:** Lucide React
- **HTTP Client:** Axios (`src/services/api.js`)
- **Face Recognition:** `face-api.js` + `react-webcam`
- **Charts & Exports:** Recharts, `jspdf`, `html2canvas`
- **Forms & Validation:** React Hook Form + Zod

## Project Structure

```text
client/
├── public/models/                 # face-api.js model weights & shards
├── src/
│   ├── components/
│   │   ├── attendance/            # RegularizationModal
│   │   ├── ui/                    # ToastContainer, ConfirmDialog
│   │   ├── AdminPayrollView.jsx   # Payroll processing, adjustments, Mark Paid, CSV export
│   │   ├── AssessmentModal.jsx    # Employee submission & manager review modal
│   │   ├── HolidayManagerModal.jsx
│   │   ├── PayrollModal.jsx       # Payslip modal with PDF download & print view
│   │   └── SupportModal.jsx
│   ├── features/auth/             # FaceLogin, FaceEnrollment
│   ├── layouts/                   # DashboardLayout (sidebar, submenus, notifications)
│   ├── pages/                     # Lazy-loaded application pages
│   ├── services/api.js            # Axios instance with JWT interceptors
│   └── store/                     # useAuthStore, useUIStore
├── index.html
├── vercel.json                    # SPA fallback rewrite for Vercel
└── vite.config.js
```

## Setup & Scripts

```bash
npm install
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Key UI & UX Features

- **Role-Tailored Login (`LoginPage.jsx`)**: Switches theme, hero copy, and accent colors between **Admin**, **HR Manager**, and **Developer**, with Password, Face ID, 2FA, Forgot Password, and Quick Demo Fill.
- **Dashboard (`DashboardPage.jsx`)**: Real-time clock-in/out, recent regularizations, **Company Announcements** (Create/Edit/Delete for Admin/HR), **On Leave Today**, clickable celebration modals, and an **Upcoming Holidays** horizontal marquee.
- **Holiday Manager (`HolidaysPage.jsx` & `HolidayManagerModal.jsx`)**: Full CRUD for holidays synced with the Dashboard and Attendance Calendar.
- **Attendance & Leaves (`AttendanceCalendar.jsx`, `MyAttendanceLog.jsx`, `RegularizationManagement.jsx`, `LeavesPage.jsx`)**: Monthly calendar with holiday badges, employee 2-hour permission status history, unified Regularization + Permission approval queues, live leave-day calculator, Earned Leave (EL) 20-day progress bar, and overlapping leave warnings.
- **Employees & Profile (`EmployeesPage.jsx`, `ProfilePage.jsx`)**: Directory with EL progress column, **Org Chart** reporting hierarchy, **Document Vault**, self-service avatar upload, and 2FA QR + manual secret setup.
- **Payroll & Reports (`PayrollPage.jsx`, `ReportsPage.jsx`)**: Printable & downloadable PDF payslips (`paidAt` date), bulk/individual payout actions, and `recharts` analytics.

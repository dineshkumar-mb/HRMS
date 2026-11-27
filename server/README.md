# HRMS Server

Backend REST API for the Human Resource Management System (HRMS), built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication & Security:** JWT, bcryptjs, Helmet, CORS, Speakeasy/QRCode (2FA)
- **Email Service:** Nodemailer

## Project Structure

```text
server/
├── config/db.js          # MongoDB connection
├── controllers/          # Route handlers
├── middlewares/          # authMiddleware (protect, authorize), errorMiddleware
├── models/               # Mongoose schemas (User, Employee, Attendance, Leave, Holiday, Payroll, Announcement, etc.)
├── routes/               # Express route definitions
├── utils/                # JWT helpers
├── seedHolidays.js       # Seeds 2026–2027 national holidays
└── index.js              # Server entry point
```

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure `.env`:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   EMAIL_FROM=your_sender_address
   ```

3. **Seed & start:**
   ```bash
   node seedHolidays.js   # Optional: seed 2026–2027 holidays
   npm run dev            # Development with nodemon
   npm start              # Production (node index.js)
   ```

## API Endpoints (`/api`)

- **Auth (`/api/auth`)**: `POST /login`, `POST /face-login`, `POST /enroll-face`, `POST /logout`, `GET /profile`, `PUT /change-password`, `POST /forgot-password`, `PUT /reset-password/:token`, `POST /2fa/generate`, `POST /2fa/verify`, `POST /2fa/validate`, `POST /2fa/disable`.
- **Employees (`/api/employees`)**: CRUD (`GET /`, `GET /:id`, `POST /`, `PUT /:id` including self-service `profilePhoto`, `DELETE /:id`), `GET /highlights`, `POST /:id/documents`, `DELETE /:id/documents/:docId`.
- **Attendance (`/api/attendance`)**: `GET /me`, `POST /check-in` (auto-tracks 20-day consecutive working days for Earned Leave credit), `POST /check-out`.
- **Leaves (`/api/leave`)**: `GET /`, `GET /on-leave-today`, `POST /`, `PUT /:id` (approval deducts balance & resets EL streak; rejection/cancellation restores approved balance).
- **Holidays (`/api/holidays`)**: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /seed-defaults`.
- **Announcements (`/api/announcements`)**: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`.
- **Payroll (`/api/payroll`)**: `GET /me`, `GET /`, `POST /generate`, `PUT /:id` (adjustments & payout), `POST /mark-paid`.
- **Regularization (`/api/regularization`)** & **Permissions (`/api/permissions`)**: Employee submission (`/me`, `/`) and Admin/HR approval queues (`GET /`, `PUT /:id`).
- **Assessments (`/api/assessments`)**, **Reports (`/api/reports`)**, **Notifications (`/api/notifications`)**, **Support (`/api/support`)**.

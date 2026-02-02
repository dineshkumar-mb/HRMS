# HRMS Server

This is the backend server for the Human Resource Management System (HRMS). It is built with Node.js, Express, and MongoDB.

## 🚀 Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens) with Refresh Tokens
- **Security:** Helmet, CORS, bcryptjs
- **File Uploads:** Multer
- **Email Service:** Nodemailer
- **Validation:** Zod

## 📂 Project Structure

```
server/
├── config/             # Database connection configuration
├── controllers/        # Request handlers (logic for routes)
├── middlewares/        # Custom Express middlewares (auth, error handling)
├── models/             # Mongoose schemas/models
├── routes/             # API route definitions
├── uploads/            # Directory for uploaded files
├── utils/              # Utility functions (JWT generation, etc.)
├── .env                # Environment variables
└── index.js            # Server entry point
```

## 🔧 Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Configuration:**
    Ensure you have a `.env` file in the root directory with the following variables:
    ```env
    PORT=5000
    NODE_ENV=development
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRE=24h
    REFRESH_TOKEN_SECRET=your_refresh_secret
    REFRESH_TOKEN_EXPIRE=7d
    CLIENT_URL=http://localhost:5173
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your_email
    EMAIL_PASS=your_email_password
    EMAIL_FROM=your_sender_address
    ```

3.  **Run the Server:**
    - Development mode (with auto-reload):
      ```bash
      npm run dev
      ```
      *(Note: Requires `nodemon` installed globally or as a dev dependency)*
    - Production mode:
      ```bash
      node index.js
      ```

## 📡 API Endpoints

The API is prefixed with `/api`.

### Authentication (`/api/auth`)
- `POST /register`: Register a new user.
- `POST /login`: Login with email and password.
- `POST /face-login`: Login using facial recognition.
- `POST /enroll-face`: Enroll facial biometrics (Protected).
- `POST /logout`: Logout user.
- `GET /profile`: Get current user profile (Protected).
- `PUT /change-password`: Change user password (Protected).
- `POST /forgot-password`: Request password reset.
- `PUT /reset-password/:resettoken`: Reset password.

### Employees (`/api/employees`)
- CRUD operations for employee management.
- `GET /highlights`: Dashboard highlights (birthdays, work anniversaries).

### Attendance (`/api/attendance`)
- Manage daily attendance records.
- Clock-in/Clock-out functionality.

### Leaves (`/api/leave`)
- Apply for leave.
- Approve/Reject leave requests (Admin/HR).
- Leave balance tracking.

### Other Modules
- **Payroll (`/api/payroll`)**: Salary slip generation and management.
- **Holidays (`/api/holidays`)**: Company holiday calendar.
- **Reports (`/api/reports`)**: Generate analytics and reports.
- **Support (`/api/support`)**: Helpdesk and support tickets.
- **Notifications (`/api/notifications`)**: System notifications.

## 🛡️ Security Features

- **JWT Authentication:** Secure stateless authentication.
- **Face Recognition:** Biometric authentication using facial descriptors stored as mathematical representations (not images).
- **Password Hashing:** Passwords are hashed using `bcryptjs` before storage.
- **Route Protection:** `protect` middleware ensures only authorized users can access sensitive endpoints.
- **Role-Based Access:** Support for different user roles (Admin, HR, Employee).

## 📝 Script Utilities
- `seed.js`: Script to seed the database with initial data.
- `check_users.js`, `fix_and_sync.js`: Utilities for database maintenance.

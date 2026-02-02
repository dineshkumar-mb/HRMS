

# HRMS Client

This is the frontend application for the Human Resource Management System (HRMS), built with React, Vite, and Tailwind CSS. It features a modern, responsive UI and integrates biometrically secure face recognition.

## 🚀 Tech Stack

- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Routing:** React Router DOM 7
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Face Recognition:** face-api.js
- **Webcam Integration:** react-webcam
- **Charts:** Recharts
- **Form Handling:** React Hook Form + Zod
- **Date Handling:** date-fns

## 📂 Project Structure

```
client/
├── public/
│   ├── models/             # AI models for face recognition (weights & shards)
│   └── ...                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── features/           # Feature-specific components (auth, face recognition)
│   ├── layouts/            # Layout wrappers (DashboardLayout, etc.)
│   ├── pages/              # Application pages (Dashboard, Login, Profile, etc.)
│   ├── services/           # API service configuration (Axios interceptors)
│   ├── store/              # Global state management config (Zustand)
│   ├── utils/              # Helper functions
│   └── main.jsx            # Application entry point
├── .env                    # Environment variables
└── vite.config.js          # Vite configuration
```

## 🔧 Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the root directory (if not present, though Vite uses `.env.local` primarily):
    ```env
    VITE_API_URL=https://hrms-22ch.onrender.com/api
    ```

3.  **Run the Application:**
    - Development server:
      ```bash
      npm run dev
      ```
    - Build for production:
      ```bash
      npm run build
      ```
    - Preview production build:
      ```bash
      npm run preview
      ```

## ✨ Key Features

### 👤 Authentication & Security
- **Secure Login:** Traditional email/password login.
- **Face Recognition Login:** Login instantly by looking at the camera.
- **Session Management:** Secure token storage with automatic refresh handling.
- **Role-Based Access:** UI elements adapt based on user roles (Admin/Employee).

### 🤳 Face Recognition
- **Technology:** Uses `face-api.js` (`ssdMobilenetv1`, `faceLandmark68Net`, `faceRecognitionNet`).
- **Privacy:** No images are stored. Only mathematical facial descriptors are sent to the server.
- **Enrollment:** Secure enrollment process in the Profile section with liveness checks (camera readiness).

### 📊 Dashboard & Analytics
- **Overview:** Real-time summary of attendance, leave balance, and team members.
- **Charts:** Visual analytics for attendance trends and department metrics.
- **Highlights:** Birthdays and work anniversaries widgets.

### 🏢 Core Modules
- **Personnel Directory:** Browse and search employee records.
- **Attendance Management:** Clock-in/out, view logs, and regularization requests.
- **Leave Management:** Apply for leave, view balances, and approval workflows.
- **Payroll:** View and download salary slips.
- **Reports:** Generate and view detailed organizational reports.

## 🤝 API Integration using `api.js`

The application uses a centralized `api` service (`src/services/api.js`) which:
- Automatically attaches the JWT token to every request.
- Handles authorization errors (401) seamlessly.
- Provides a consistent interface for making HTTP requests.

## 🎨 UI/UX Design

- **Responsive:** Fully responsive layout for unauthorized mobile and desktop views.
- **Modern Interface:** Clean, card-based design with ample whitespace and consistent typography.
- **Feedback:** Interactive loading states, toast notifications, and validation messages.








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

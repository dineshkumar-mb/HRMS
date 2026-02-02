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

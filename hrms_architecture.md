# HRMS Architectural Overview

This document outlines the high-level architecture of the Human Resource Management System (HRMS) based on the repository structure and technology stack.

## 1. High-Level System Architecture

The application follows a standard MERN-stack architecture (MongoDB, Express, React, Node.js), structured as a monolithic frontend interacting with a monolithic RESTful backend API. 

```mermaid
graph TD
    subgraph "Client Tier (Browser)"
        UI[React + Tailwind UI]
        State[Zustand State]
        FaceAPI[face-api.js]
    end

    subgraph "Server Tier (Node.js + Express)"
        Router[API Router]
        Controllers[Controllers]
        Middleware[Auth/Role Middleware]
        Services[Business Logic & Utilities]
    end

    subgraph "Data Tier (MongoDB)"
        DB[(MongoDB Database)]
    end

    %% Flow
    UI -->|HTTP / Axios| Router
    FaceAPI -.->|Face Descriptors| UI
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services -->|Mongoose ODM| DB
```

> [!NOTE]
> The face recognition process happens largely on the **Client Tier**. `face-api.js` processes the webcam feed locally to extract facial descriptors. Only these mathematical descriptors (not raw images) are sent to the backend for verification.

---

## 2. Frontend Architecture (React + Vite)

The frontend uses Vite as the bundler and React for the view layer. Global state is managed by Zustand.

```mermaid
graph TD
    subgraph "Frontend Architecture"
        App[App.jsx / Router]
        
        App --> Layouts[Layouts]
        Layouts --> Pages[Pages]
        Pages --> Components[Reusable Components]
        Pages --> Features[Feature-specific UI]
        
        App --> Store[Zustand Store]
        Pages --> Store
        Features --> Store
        
        Store --> API[API Services / Axios]
        API --> Interceptors[Axios Interceptors]
        Interceptors -->|Handles JWT Tokens| Backend((Backend API))
    end
```

### Key Frontend Directories
- **`src/components/`**: Reusable generic UI components (Buttons, Inputs, Modals).
- **`src/features/`**: Domain-specific logic and UI (e.g., authentication flow, face recognition handling).
- **`src/store/`**: Global state management using Zustand (likely holding auth state, user profile, etc.).
- **`src/services/`**: API definitions via Axios, including interceptors to attach JWT tokens to every request automatically.

---

## 3. Backend Architecture (Express.js)

The backend exposes a REST API consumed by the React client. It uses Mongoose to map application objects to MongoDB documents.

```mermaid
graph TD
    subgraph "Backend Architecture"
        Client((Client Request)) --> AppIndex[index.js]
        AppIndex --> RouteLayer[Routes]
        
        RouteLayer --> AuthRoute[authRoutes]
        RouteLayer --> EmpRoute[employeeRoutes]
        RouteLayer --> LeaveRoute[leaveRoutes]
        RouteLayer --> OtherRoutes[...]
        
        AuthRoute --> AuthCtrl[authController]
        EmpRoute --> EmpCtrl[employeeController]
        LeaveRoute --> LeaveCtrl[leaveController]
        OtherRoutes --> OtherCtrl[Controllers]
        
        AuthCtrl --> UserModel[User Model]
        EmpCtrl --> EmployeeModel[Employee Model]
        LeaveCtrl --> LeaveModel[Leave Model]
        
        UserModel --> Mongoose[(MongoDB)]
        EmployeeModel --> Mongoose
        LeaveModel --> Mongoose
    end
```

### Key Backend Directories
- **`routes/`**: Maps URL paths (e.g., `/api/auth`, `/api/leave`) to the appropriate controller methods.
- **`middlewares/`**: Contains intermediate logic, such as checking for valid JWTs (`protect`) or enforcing role-based access.
- **`controllers/`**: Contains the core business logic (handling requests, calling models, generating responses).
- **`models/`**: Defines the data schema using Mongoose (e.g., `User.js`, `Employee.js`, `Leave.js`, `Attendance.js`).

---

## 4. Module & Data Relationship Diagram

The HRMS system handles multiple distinct domains, such as Users, Employees, Attendance, and Leaves.

```mermaid
erDiagram
    USER ||--o| EMPLOYEE : "has profile"
    EMPLOYEE ||--o{ ATTENDANCE : logs
    EMPLOYEE ||--o{ LEAVE : requests
    EMPLOYEE ||--o{ PAYROLL : receives
    EMPLOYEE ||--o{ ASSESSMENT : undertakes
    EMPLOYEE ||--o{ REGULARIZATION : files
    
    USER {
        string email
        string password_hash
        string role
        array face_descriptor
    }
    
    EMPLOYEE {
        ObjectId user_id
        string department
        string designation
        date joining_date
    }
    
    ATTENDANCE {
        ObjectId employee_id
        datetime clock_in
        datetime clock_out
    }
    
    LEAVE {
        ObjectId employee_id
        string type
        string status
        date start_date
        date end_date
    }
```

> [!TIP]
> The database strictly separates `User` (Authentication and Identity) from `Employee` (HR domain data), connected by a one-to-one relationship.

---

## 5. Face Recognition Login Flow

The most complex specialized flow in the system is the facial recognition login, which spans the client and server.

```mermaid
sequenceDiagram
    participant User
    participant Webcam
    participant Client (React)
    participant FaceAPI (Local)
    participant Server (Express)
    participant DB (MongoDB)

    User->>Client: Clicks "Face Login"
    Client->>Webcam: Request Camera Access
    Webcam-->>Client: Video Stream
    Client->>FaceAPI: Process Video Frames
    FaceAPI-->>Client: Extract 68-Point Descriptor
    Client->>Server: POST /api/auth/face-login (Descriptor)
    Server->>DB: Fetch Enrolled Users' Descriptors
    DB-->>Server: Descriptors List
    Server->>Server: Calculate Euclidean Distance (Match)
    alt Match Found
        Server-->>Client: 200 OK + JWT Token
        Client->>User: Redirect to Dashboard
    else No Match
        Server-->>Client: 401 Unauthorized
        Client->>User: Show Error "Face Not Recognized"
    end
```

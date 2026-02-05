import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import PayrollPage from './pages/PayrollPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AttendanceCalendar from './pages/AttendanceCalendar';
import AttendanceReportGrid from './pages/AttendanceReportGrid';
import MyAttendanceLog from './pages/MyAttendanceLog';
import ChangePasswordPage from './pages/ChangePasswordPage';
import RegularizationManagement from './pages/RegularizationManagement';
import SelfAssessmentPage from './pages/SelfAssessmentPage';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={
            <ProtectedRoute roles={['admin', 'hr', 'manager']}>
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="attendance-management">
            <Route index element={<AttendancePage />} />
            <Route path="calendar" element={<AttendanceCalendar />} />

            <Route path="log" element={<MyAttendanceLog />} />
            <Route path="manage-requests" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <RegularizationManagement />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="leaves" element={<LeavesPage />} />
          <Route path="payroll" element={
            <ProtectedRoute roles={['admin', 'hr', 'employee']}>
              <PayrollPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="assessments" element={
            <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}>
              <SelfAssessmentPage />
            </ProtectedRoute>
          } />
          <Route path="profile/:id?" element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

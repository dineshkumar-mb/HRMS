import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from './store/useAuthStore';
import DashboardLayout from './layouts/DashboardLayout';
import ToastContainer from './components/ui/ToastContainer';
import ConfirmDialog from './components/ui/ConfirmDialog';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const AttendanceCalendar = lazy(() => import('./pages/AttendanceCalendar'));
const AttendanceReportGrid = lazy(() => import('./pages/AttendanceReportGrid'));
const MyAttendanceLog = lazy(() => import('./pages/MyAttendanceLog'));
const RegularizationManagement = lazy(() => import('./pages/RegularizationManagement'));
const LeavesPage = lazy(() => import('./pages/LeavesPage'));
const HolidaysPage = lazy(() => import('./pages/HolidaysPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SelfAssessmentPage = lazy(() => import('./pages/SelfAssessmentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="animate-spin text-primary-600" size={36} />
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
              <Route path="report" element={
                <ProtectedRoute roles={['admin', 'hr']}>
                  <AttendanceReportGrid />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="payroll" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}>
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
      </Suspense>
      <ToastContainer />
      <ConfirmDialog />
    </BrowserRouter>
  );
}

export default App;

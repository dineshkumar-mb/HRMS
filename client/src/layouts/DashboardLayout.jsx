import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CalendarDays,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    User as UserIcon,
    BarChart3,
    CheckCircle2,
    Info,
    AlertTriangle,
    AlertCircle as AlertIcon,
    Trash,
    CalendarClock
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Personnel Directory', icon: Users, path: '/employees', roles: ['admin', 'hr', 'manager'] },
        { name: 'Attendance Management', icon: CalendarCheck, path: '/attendance-management', subItems: true },
        { name: 'Attendance Requests', icon: CalendarClock, path: '/attendance-management/manage-requests', roles: ['admin', 'hr'] },
        { name: 'Leave Management', icon: CalendarDays, path: '/leaves', subItems: true },
        { name: 'Assessment Management', icon: BarChart3, path: '/assessments', subItems: true },
        { name: 'Salary Slip', icon: Wallet, path: '/payroll', subItems: true },
        { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin', 'hr'] },
        { name: 'Profile', icon: UserIcon, path: '/profile' },
        { name: 'Change Password', icon: Settings, path: '/change-password' },
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-white border-r border-gray-200 transition-all duration-300 z-30 flex flex-col",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-16 flex items-center px-6 bg-[#5bc0de] text-white">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard size={20} />
                        {isSidebarOpen && <span className="text-lg font-bold italic tracking-wider">HRMS PORTAL</span>}
                    </div>
                </div>

                <nav className="flex-1 px-0 py-0 space-y-0 overflow-y-auto bg-[#777777]">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 transition-all border-b border-[#888888] text-white hover:bg-[#666666]",
                                location.pathname === item.path
                                    ? "bg-[#5bc0de]"
                                    : ""
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} />
                                {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                            </div>
                            {isSidebarOpen && item.subItems && <span className="text-[10px]">❮</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full group",
                        )}
                    >
                        <LogOut size={22} className="group-hover:text-red-600" />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-[#5bc0de] flex items-center justify-between px-6 z-20 text-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold tracking-tight">
                            {filteredNavItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-lg hover:bg-white/10 text-white relative transition-colors"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#5bc0de] flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowNotifications(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-[10px] text-primary-600 hover:text-primary-700 font-bold uppercase tracking-wider"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Bell className="text-gray-300" size={24} />
                                                    </div>
                                                    <p className="text-gray-500 text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((n) => (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => markAsRead(n._id)}
                                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!n.read ? 'bg-primary-50/20' : ''}`}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-50 text-green-600' :
                                                                    n.type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                                                                        n.type === 'error' ? 'bg-red-50 text-red-600' :
                                                                            'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {n.type === 'success' && <CheckCircle2 size={16} />}
                                                                    {n.type === 'warning' && <AlertTriangle size={16} />}
                                                                    {n.type === 'error' && <AlertIcon size={16} />}
                                                                    {n.type === 'info' && <Info size={16} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                                        {n.message}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => deleteNotification(n._id, e)}
                                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            </div>
                                                            {!n.read && (
                                                                <span className="absolute top-4 right-10 w-2 h-2 bg-primary-600 rounded-full"></span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-white/20 hover:opacity-80 transition-opacity">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-300">
                                <UserIcon size={20} />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

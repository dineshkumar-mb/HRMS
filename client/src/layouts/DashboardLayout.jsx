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
    Trash2,
    CalendarClock,
    ChevronDown,
    ClipboardCheck
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let active = true;
        const loadNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                if (active) setNotifications(data.data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false);
                setShowNotifications(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getNotificationTarget = (n) => {
        const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        if (text.includes('leave')) return '/leaves';
        if (text.includes('regularization')) return isAdminOrHR ? '/attendance-management/manage-requests' : '/attendance-management/log';
        if (text.includes('assessment')) return '/assessments';
        if (text.includes('payroll') || text.includes('salary') || text.includes('payslip')) return '/payroll';
        return null;
    };

    const handleNotificationClick = async (n) => {
        if (!n.read) await markAsRead(n._id);
        const target = getNotificationTarget(n);
        if (target) {
            setShowNotifications(false);
            navigate(target);
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

    const isAdminOrHR = user && ['admin', 'hr'].includes(user.role);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Personnel Directory', icon: Users, path: '/employees', roles: ['admin', 'hr', 'manager'] },
        {
            name: 'Attendance',
            icon: CalendarCheck,
            path: '/attendance-management',
            subItems: [
                { name: 'Overview', path: '/attendance-management' },
                { name: 'Attendance Calendar', path: '/attendance-management/calendar' },
                { name: 'Detailed Punch Log', path: '/attendance-management/log' },
                ...(isAdminOrHR ? [
                    { name: 'Manage Requests', path: '/attendance-management/manage-requests' },
                    { name: 'Attendance Report', path: '/attendance-management/report' }
                ] : []),
            ]
        },
        { name: 'Leave Management', icon: CalendarDays, path: '/leaves' },
        { name: 'Holidays', icon: CalendarCheck, path: '/holidays' },
        {
            name: 'Assessments',
            icon: ClipboardCheck,
            path: '/assessments',
            subItems: [
                { name: 'Self-Assessment', path: '/assessments' }
            ]
        },
        { name: 'Salary & Payroll', icon: Wallet, path: '/payroll', roles: ['admin', 'hr', 'manager', 'employee'] },
        { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin', 'hr'] },
        { name: 'Profile', icon: UserIcon, path: '/profile' },
        { name: 'Change Password', icon: Settings, path: '/change-password' },
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    const isPathActive = (item) => {
        if (item.path === '/') return location.pathname === '/';
        if (item.subItems) {
            return item.subItems.some(sub => location.pathname === sub.path);
        }
        if (item.path === '/profile') {
            return location.pathname.startsWith('/profile');
        }
        return location.pathname === item.path;
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/employees')) return 'Personnel Directory';
        if (path === '/attendance-management') return 'Attendance Management';
        if (path === '/attendance-management/calendar') return 'Attendance Calendar';
        if (path === '/attendance-management/log') return 'My Attendance Log';
        if (path === '/attendance-management/manage-requests') return 'Attendance Requests';
        if (path === '/attendance-management/report') return 'Attendance Report';
        if (path.startsWith('/leaves')) return 'Leave Management';
        if (path.startsWith('/holidays')) return 'Holiday Manager';
        if (path.startsWith('/assessments')) return 'Self-Assessment';
        if (path.startsWith('/payroll')) return 'Salary & Payroll';
        if (path.startsWith('/reports')) return 'Reports & Analytics';
        if (path.startsWith('/profile')) return 'Profile';
        if (path.startsWith('/change-password')) return 'Security Settings';
        return 'Dashboard';
    };

    const displayName = user?.employee?.firstName
        ? `${user.employee.firstName} ${user.employee.lastName || ''}`.trim()
        : user?.email;

    const renderSidebarContent = (isCollapsed = false, isMobile = false) => (
        <div className="flex flex-col h-full bg-slate-900 select-none text-slate-200">
            {/* Sidebar Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-800 shrink-0">
                <Link to="/" className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-950/50 shrink-0">
                        H
                    </div>
                    {!isCollapsed && (
                        <span className="text-base font-extrabold tracking-tight text-white truncate">
                            HRMS Portal
                        </span>
                    )}
                </Link>
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
                {filteredNavItems.map((item) => {
                    const active = isPathActive(item);
                    const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
                    const isExpanded = expandedMenus[item.name] ?? active;

                    if (hasSub && !isCollapsed) {
                        return (
                            <div key={item.name} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !isExpanded }))}
                                    aria-expanded={isExpanded}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                        active
                                            ? "bg-primary-600/15 text-primary-400 font-semibold"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <item.icon size={18} className="shrink-0" />
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                    <ChevronDown
                                        size={15}
                                        className={cn(
                                            "transition-transform duration-200 shrink-0",
                                            isExpanded ? "rotate-180" : ""
                                        )}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="pl-9 space-y-1">
                                        {item.subItems.map((sub) => {
                                            const subActive = location.pathname === sub.path;
                                            return (
                                                <Link
                                                    key={sub.path}
                                                    to={sub.path}
                                                    onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                                        subActive
                                                            ? "bg-primary-600 text-white font-semibold shadow-sm"
                                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        subActive ? "bg-white" : "bg-slate-600"
                                                    )} />
                                                    <span className="truncate">{sub.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => { if (isMobile) setMobileMenuOpen(false); }}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                active
                                    ? "bg-primary-600 text-white font-semibold shadow-md shadow-primary-950/30"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon size={18} className="shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout bottom button */}
            <div className="p-3 border-t border-slate-800 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        if (isMobile) setMobileMenuOpen(false);
                        handleLogout();
                    }}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-500/15 hover:text-red-400 transition-all w-full",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Logout" : undefined}
                >
                    <LogOut size={18} className="shrink-0" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {renderSidebarContent(false, true)}
            </aside>

            {/* Desktop Persistent Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 shrink-0",
                    isDesktopCollapsed ? "w-20" : "w-64"
                )}
            >
                {renderSidebarContent(isDesktopCollapsed, false)}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Topbar Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 z-20 text-slate-900 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {/* Mobile Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 md:hidden transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>

                        {/* Desktop Collapse Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsDesktopCollapsed(prev => !prev)}
                            className="hidden md:inline-flex p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                            title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <Menu size={20} />
                        </button>

                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                            {getPageTitle()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition-colors"
                                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                                aria-expanded={showNotifications}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowNotifications(false)}
                                        aria-hidden="true"
                                    />
                                    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 overflow-hidden animate-zoom-in">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                                            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[360px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Bell className="text-slate-300" size={24} />
                                                    </div>
                                                    <p className="text-slate-500 text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {notifications.map((n) => (
                                                        <div
                                                            key={n._id}
                                                            className={`p-4 hover:bg-slate-50 transition-colors relative flex gap-3 items-start ${!n.read ? 'bg-primary-50/40' : ''}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleNotificationClick(n)}
                                                                className="flex gap-3 flex-1 min-w-0 text-left"
                                                            >
                                                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-50 text-green-600' :
                                                                    n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                                                        n.type === 'error' ? 'bg-red-50 text-red-600' :
                                                                            'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {n.type === 'success' && <CheckCircle2 size={16} />}
                                                                    {n.type === 'warning' && <AlertTriangle size={16} />}
                                                                    {n.type === 'error' && <AlertIcon size={16} />}
                                                                    {n.type === 'info' && <Info size={16} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                                        {n.message}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {!n.read && (
                                                                    <span className="w-2 h-2 bg-primary-600 rounded-full" aria-label="Unread" />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => deleteNotification(n._id, e)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                                    aria-label="Delete notification"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profile User Badge */}
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200 hover:opacity-85 transition-opacity"
                        >
                            <div className="text-right hidden sm:block max-w-[160px]">
                                <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shrink-0 font-bold text-sm">
                                {user?.employee?.firstName ? (
                                    <span>{user.employee.firstName[0]}{user.employee.lastName?.[0] || ''}</span>
                                ) : (
                                    <UserIcon size={18} />
                                )}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

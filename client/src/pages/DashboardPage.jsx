import { useState, useEffect } from 'react';
import {
    Clock,
    CalendarDays,
    Gift,
    Loader2,
    Calendar,
    Trophy,
    UserPlus,
    X,
    CheckCircle2,
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    UserCheck
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { toast } from '../store/useUIStore';
import RegularizationModal from '../components/attendance/RegularizationModal';
import HolidayManagerModal from '../components/HolidayManagerModal';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const DashboardPage = () => {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState(null);
    const [regularizations, setRegularizations] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [allHolidays, setAllHolidays] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [onLeaveToday, setOnLeaveToday] = useState([]);
    const [showNoticeForm, setShowNoticeForm] = useState(false);
    const [editingNoticeId, setEditingNoticeId] = useState(null);
    const [noticeForm, setNoticeForm] = useState({ title: '', message: '', priority: 'info', pinned: false });
    const [highlights, setHighlights] = useState({ newJoiners: [], birthdays: [], anniversaries: [] });

    // Modals
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showRegularizationModal, setShowRegularizationModal] = useState(false);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [activeHighlight, setActiveHighlight] = useState(null); // { title, subtitle, list }
    const [actionLoading, setActionLoading] = useState(false);

    const canManageHolidays = ['admin', 'hr'].includes(user?.role);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchDashboardData();
        return () => clearInterval(timer);
    }, [user]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowPermissionModal(false);
                setActiveHighlight(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [{ data: attRes }, { data: regRes }, { data: highRes }, { data: holRes }, { data: annRes }, { data: leaveTodayRes }] = await Promise.all([
                api.get('/attendance/me'),
                api.get('/regularization/me'),
                api.get('/employees/highlights'),
                api.get('/holidays'),
                api.get('/announcements'),
                api.get('/leave/on-leave-today')
            ]);

            const todayStr = new Date().toLocaleDateString('en-CA');
            const todayRecord = attRes.data.find(rec => {
                const localDate = new Date(rec.date).toLocaleDateString('en-CA');
                return localDate === todayStr;
            });
            setAttendance(todayRecord);
            setRegularizations(regRes.data.slice(0, 5));
            setHighlights(highRes.data);
            setAnnouncements(annRes.data || []);
            setOnLeaveToday(leaveTodayRes.data || []);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const sortedHolidays = [...(holRes?.data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
            setAllHolidays(sortedHolidays);
            const upcoming = sortedHolidays.filter(h => new Date(h.date) >= todayStart);
            setHolidays(upcoming);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handlePunch = async (type) => {
        setActionLoading(true);
        try {
            let location = null;

            if ("geolocation" in navigator) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                    });
                    location = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                } catch (err) {
                    console.warn("Location access denied or failed", err);
                }
            }

            const endpoint = type === 'in' ? '/attendance/check-in' : '/attendance/check-out';
            await api.post(endpoint, { location });
            toast.success(type === 'in' ? 'Checked in successfully' : 'Checked out successfully');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || `Punch ${type} failed`);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePermissionSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        const formData = new FormData(e.target);
        try {
            await api.post('/permissions', {
                date: formData.get('date'),
                type: formData.get('type'),
                reason: formData.get('reason')
            });
            setShowPermissionModal(false);
            toast.success('Permission request submitted');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Permission request failed');
        } finally {
            setActionLoading(false);
        }
    };

    const onRegularizationSuccess = () => {
        toast.success('Regularization request submitted');
        fetchDashboardData();
    };

    const handleCreateOrUpdateNotice = async (e) => {
        e.preventDefault();
        try {
            if (editingNoticeId) {
                await api.put(`/announcements/${editingNoticeId}`, noticeForm);
                toast.success('Announcement updated');
            } else {
                await api.post('/announcements', noticeForm);
                toast.success('Announcement posted');
            }
            setNoticeForm({ title: '', message: '', priority: 'info', pinned: false });
            setEditingNoticeId(null);
            setShowNoticeForm(false);
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save announcement');
        }
    };

    const handleEditNotice = (notice) => {
        setEditingNoticeId(notice._id);
        setNoticeForm({
            title: notice.title,
            message: notice.message,
            priority: notice.priority || 'info',
            pinned: !!notice.pinned
        });
        setShowNoticeForm(true);
    };

    const handleCancelNotice = () => {
        setShowNoticeForm(false);
        setEditingNoticeId(null);
        setNoticeForm({ title: '', message: '', priority: 'info', pinned: false });
    };

    const handleDeleteNotice = async (id) => {
        try {
            await api.delete(`/announcements/${id}`);
            toast.success('Announcement removed');
            if (editingNoticeId === id) handleCancelNotice();
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete announcement');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[320px]">
            <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
    );

    const renderHighlightList = (list) => {
        if (list.length === 0) return <p className="text-xs text-slate-400 mt-3">No celebrations today</p>;

        const colors = [
            'bg-blue-100 text-blue-700',
            'bg-orange-100 text-orange-700',
            'bg-purple-100 text-purple-700',
            'bg-emerald-100 text-emerald-700',
            'bg-rose-100 text-rose-700'
        ];

        return (
            <div className="mt-3 flex -space-x-2 overflow-hidden">
                {list.slice(0, 5).map((emp, i) => (
                    <div
                        key={emp._id || i}
                        title={`${emp.firstName} ${emp.lastName} (${emp.designation})`}
                        className={cn(
                            "inline-flex h-8 w-8 rounded-full ring-2 ring-white overflow-hidden items-center justify-center text-[11px] font-bold shadow-xs",
                            colors[i % colors.length]
                        )}
                    >
                        {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt={`${emp.firstName} ${emp.lastName}`} className="w-full h-full object-cover" />
                        ) : (
                            <span>{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                        )}
                    </div>
                ))}
                {list.length > 5 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 text-[11px] font-bold shadow-xs">
                        +{list.length - 5}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Quick overview of your attendance and team updates.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setShowPermissionModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
                    >
                        <Clock size={14} className="text-primary-600" />
                        Apply Permission
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRegularizationModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-sm"
                    >
                        <CalendarDays size={14} />
                        Raise Regularization
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Punch Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[280px] flex flex-col">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={16} className="text-primary-600" />
                            Today&apos;s Attendance
                        </h3>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Calendar size={13} />
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })}
                        </span>
                    </div>
                    <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center space-y-5">
                        <div className="text-center">
                            <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                                {currentTime.toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        {!attendance?.checkIn?.time ? (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handlePunch('in')}
                                className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-100 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {actionLoading ? 'Processing...' : 'Clock In'}
                            </button>
                        ) : !attendance?.checkOut?.time ? (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handlePunch('out')}
                                className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-100 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {actionLoading ? 'Processing...' : 'Clock Out'}
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
                                <CheckCircle2 size={18} />
                                <span>Completed for Today ({attendance.workHours?.toFixed(2)} hrs)</span>
                            </div>
                        )}

                        {attendance?.checkIn?.time && (
                            <div className="text-xs text-slate-500 text-center space-y-0.5">
                                <p>Clocked in at <span className="font-semibold text-slate-700">{new Date(attendance.checkIn.time).toLocaleTimeString()}</span></p>
                                {attendance.checkIn.location?.lat && (
                                    <p className="text-[11px] text-primary-600 font-medium">Location verified</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* My Regularization Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[280px] flex flex-col">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900">My Regularization Requests</h3>
                        <span className="text-xs font-semibold text-slate-500">{regularizations.length} recent</span>
                    </div>
                    <div className="overflow-x-auto flex-1 max-h-[260px]">
                        <table className="w-full text-left text-xs min-w-[260px]">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider">Attendance Date</th>
                                    <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {regularizations.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-12 text-center text-slate-400">No recent regularization requests</td>
                                    </tr>
                                ) : (
                                    regularizations.map(reg => (
                                        <tr key={reg._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-3.5 text-slate-700 font-medium">
                                                {new Date(reg.attendanceDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg font-bold capitalize text-[11px]",
                                                    reg.status === 'accepted' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                        reg.status === 'rejected' ? "bg-red-50 text-red-700 border border-red-100" :
                                                            "bg-amber-50 text-amber-700 border border-amber-100"
                                                )}>
                                                    {reg.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Announcements & Team Availability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Announcements */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Megaphone size={16} className="text-primary-600" />
                            Company Announcements
                        </h3>
                        {canManageHolidays && (
                            <button
                                type="button"
                                onClick={() => (showNoticeForm ? handleCancelNotice() : setShowNoticeForm(true))}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-colors"
                            >
                                <Plus size={13} />
                                {showNoticeForm ? 'Close' : 'Create Notice'}
                            </button>
                        )}
                    </div>
                    <div className="p-5 flex-1 space-y-3 max-h-[280px] overflow-y-auto">
                        {showNoticeForm && canManageHolidays && (
                            <form onSubmit={handleCreateOrUpdateNotice} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 mb-2">
                                <input
                                    type="text"
                                    required
                                    placeholder="Announcement title"
                                    value={noticeForm.title}
                                    onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Message for the organization..."
                                    value={noticeForm.message}
                                    onChange={(e) => setNoticeForm(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <select
                                        value={noticeForm.priority}
                                        onChange={(e) => setNoticeForm(prev => ({ ...prev, priority: e.target.value }))}
                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                                    >
                                        <option value="info">Info</option>
                                        <option value="important">Important</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        {editingNoticeId && (
                                            <button
                                                type="button"
                                                onClick={handleCancelNotice}
                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button type="submit" className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg">
                                            {editingNoticeId ? 'Update Notice' : 'Publish'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {announcements.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No announcements posted yet.</p>
                        ) : (
                            announcements.map((a) => (
                                <div key={a._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                a.priority === 'important' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {a.priority}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{a.title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
                                    </div>
                                    {canManageHolidays && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleEditNotice(a)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                aria-label={`Edit ${a.title}`}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNotice(a._id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                aria-label={`Delete ${a.title}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Who's Out Today */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <UserCheck size={16} className="text-emerald-600" />
                            On Leave Today
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">{onLeaveToday.length} out</span>
                    </div>
                    <div className="p-5 flex-1 max-h-[280px] overflow-y-auto space-y-2.5">
                        {onLeaveToday.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block px-3.5 py-2 rounded-xl">
                                    Everyone is available today
                                </p>
                            </div>
                        ) : (
                            onLeaveToday.map((leave) => (
                                <div key={leave._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                            {leave.employee?.profilePhoto ? (
                                                <img src={leave.employee.profilePhoto} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {leave.employee?.firstName} {leave.employee?.lastName}
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate">
                                                {leave.employee?.designation || leave.employee?.department}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                        Until {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Social & Holidays Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <button
                    type="button"
                    onClick={() => setActiveHighlight({ title: 'New Joiners', subtitle: 'Welcome our new team members', list: highlights.newJoiners })}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all text-left w-full flex flex-col"
                >
                    <div className="h-20 bg-gradient-to-r from-blue-500 to-primary-600 relative shrink-0">
                        <div className="absolute -bottom-5 left-6 bg-white p-2.5 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform">
                            <UserPlus className="text-primary-600" size={22} />
                        </div>
                    </div>
                    <div className="p-6 pt-8 flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">New Joiners</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Welcome our new team members</p>
                            </div>
                            <span className="bg-primary-50 text-primary-700 font-black text-base px-2.5 py-0.5 rounded-lg">{highlights.newJoiners.length}</span>
                        </div>
                        {renderHighlightList(highlights.newJoiners)}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveHighlight({ title: 'Birthdays', subtitle: 'Celebrate with the team today', list: highlights.birthdays })}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all text-left w-full flex flex-col"
                >
                    <div className="h-20 bg-gradient-to-r from-orange-400 to-amber-500 relative shrink-0">
                        <div className="absolute -bottom-5 left-6 bg-white p-2.5 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform">
                            <Gift className="text-orange-600" size={22} />
                        </div>
                    </div>
                    <div className="p-6 pt-8 flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">Birthdays</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Celebrate with the team today</p>
                            </div>
                            <span className="bg-orange-50 text-orange-700 font-black text-base px-2.5 py-0.5 rounded-lg">{highlights.birthdays.length}</span>
                        </div>
                        {renderHighlightList(highlights.birthdays)}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveHighlight({ title: 'Job Anniversaries', subtitle: 'Milestones and celebrations', list: highlights.anniversaries })}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all text-left w-full flex flex-col"
                >
                    <div className="h-20 bg-gradient-to-r from-purple-500 to-indigo-600 relative shrink-0">
                        <div className="absolute -bottom-5 left-6 bg-white p-2.5 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform">
                            <Trophy className="text-purple-600" size={22} />
                        </div>
                    </div>
                    <div className="p-6 pt-8 flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">Job Anniversaries</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Milestones and celebrations</p>
                            </div>
                            <span className="bg-purple-50 text-purple-700 font-black text-base px-2.5 py-0.5 rounded-lg">{highlights.anniversaries.length}</span>
                        </div>
                        {renderHighlightList(highlights.anniversaries)}
                    </div>
                </button>

                {/* Upcoming Holidays Scrollable Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                    <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600 relative shrink-0">
                        <div className="absolute -bottom-5 left-6 bg-white p-2.5 rounded-xl shadow-md border border-slate-100">
                            <CalendarDays className="text-emerald-600" size={22} />
                        </div>
                    </div>
                    <div className="p-6 pt-8 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-900">Upcoming Holidays</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Company holiday schedule</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {canManageHolidays && (
                                    <button
                                        type="button"
                                        onClick={() => setShowHolidayModal(true)}
                                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                                    >
                                        Manage
                                    </button>
                                )}
                                <span className="bg-emerald-50 text-emerald-700 font-black text-base px-2.5 py-0.5 rounded-lg">{holidays.length}</span>
                            </div>
                        </div>
                        {holidays.length === 0 ? (
                            <p className="text-xs text-slate-400 mt-1">No upcoming holidays</p>
                        ) : (
                            <div className="marquee-container overflow-x-auto overflow-y-hidden py-1">
                                <div className="animate-marquee gap-3 items-stretch">
                                    {[...holidays, ...holidays].map((h, idx) => (
                                        <div
                                            key={`${h._id}-${idx}`}
                                            aria-hidden={idx >= holidays.length}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 min-w-[185px]"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center shrink-0 font-bold leading-none">
                                                <span className="text-[9px] uppercase">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                <span className="text-xs">{new Date(h.date).getDate()}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{h.name}</p>
                                                <p className="text-[11px] text-slate-500 whitespace-nowrap">
                                                    {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Highlight Details Modal */}
            {activeHighlight && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="highlight-modal-title"
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-zoom-in max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 id="highlight-modal-title" className="text-lg font-bold text-slate-900">{activeHighlight.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{activeHighlight.subtitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveHighlight(null)}
                                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Close highlights modal"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto space-y-3 pr-1">
                            {activeHighlight.list.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No team members to display today.</p>
                            ) : (
                                activeHighlight.list.map((emp, idx) => (
                                    <div key={emp._id || idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                            {emp.profilePhoto ? (
                                                <img src={emp.profilePhoto} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-slate-500 truncate">{emp.designation || emp.department}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Modal */}
            {showPermissionModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="permission-modal-title"
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-zoom-in my-auto max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 id="permission-modal-title" className="text-lg font-bold text-slate-900">Apply for Permission (2 Hours)</h3>
                                <p className="text-xs text-slate-500 mt-1">You can apply for one 2-hour permission per month.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPermissionModal(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Close permission modal"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePermissionSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="perm-date" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Date</label>
                                <input id="perm-date" name="date" type="date" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="perm-type" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Time Slot</label>
                                <select id="perm-type" name="type" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                                    <option value="morning">Morning (9:00 AM - 11:00 AM)</option>
                                    <option value="evening">Evening (4:30 PM - 6:30 PM)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="perm-reason" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason</label>
                                <textarea id="perm-reason" name="reason" required placeholder="Medical, Personal, etc." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 h-24 text-sm resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPermissionModal(false)} className="flex-1 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 text-sm shadow-md shadow-primary-100">
                                    {actionLoading ? 'Applying...' : 'Apply Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Regularization Modal */}
            <RegularizationModal
                isOpen={showRegularizationModal}
                onClose={() => setShowRegularizationModal(false)}
                onSuccess={onRegularizationSuccess}
            />

            {/* Admin / HR Holiday Manager Modal */}
            <HolidayManagerModal
                isOpen={showHolidayModal}
                onClose={() => setShowHolidayModal(false)}
                holidays={allHolidays}
                onHolidaysUpdated={fetchDashboardData}
            />
        </div>
    );
};

export default DashboardPage;

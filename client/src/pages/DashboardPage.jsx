import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    CalendarDays,
    Gift,
    ChevronRight,
    Loader2,
    Calendar,
    Trophy,
    UserPlus
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import RegularizationModal from '../components/attendance/RegularizationModal';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const DashboardPage = () => {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState(null);
    const [regularizations, setRegularizations] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [highlights, setHighlights] = useState({ newJoiners: [], birthdays: [], anniversaries: [] });

    // Modals
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showRegularizationModal, setShowRegularizationModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchDashboardData();
        return () => clearInterval(timer);
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [{ data: attRes }, { data: regRes }, { data: pickRes }, { data: highRes }] = await Promise.all([
                api.get('/attendance/me'),
                api.get('/regularization/me'),
                api.get('/permissions/me'),
                api.get('/employees/highlights')
            ]);

            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const todayRecord = attRes.data.find(rec => {
                const localDate = new Date(rec.date).toLocaleDateString('en-CA');
                return localDate === todayStr;
            });
            setAttendance(todayRecord);
            setRegularizations(regRes.data.slice(0, 5));
            setPermissions(pickRes.data.slice(0, 5));
            setHighlights(highRes.data);
            console.log('Dashboard Highlights Loaded:', highRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePunch = async (type) => {
        setActionLoading(true);
        try {
            let location = null;

            // Get Geolocation
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
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || `Punch ${type} failed`);
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
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Permission request failed');
        } finally {
            setActionLoading(false);
        }
    };

    const onRegularizationSuccess = () => {
        fetchDashboardData();
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-[#5bc0de]" size={40} />
        </div>
    );

    const renderHighlightList = (list) => {
        if (list.length === 0) return <p className="text-[10px] text-gray-400 mt-2">No celebrations today</p>;

        const colors = [
            'bg-blue-100 text-blue-600',
            'bg-orange-100 text-orange-600',
            'bg-purple-100 text-purple-600',
            'bg-green-100 text-green-600',
            'bg-red-100 text-red-600'
        ];

        return (
            <div className="mt-2 flex -space-x-2 overflow-hidden">
                {list.slice(0, 5).map((emp, i) => (
                    <div
                        key={i}
                        title={`${emp.firstName} ${emp.lastName} (${emp.designation})`}
                        className={cn(
                            "inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden flex items-center justify-center text-[10px] font-bold shadow-sm",
                            colors[i % colors.length]
                        )}
                    >
                        {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span>{emp.firstName[0]}{emp.lastName[0]}</span>
                        )}
                    </div>
                ))}
                {list.length > 5 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-400 text-[10px] font-bold shadow-sm">
                        +{list.length - 5}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPermissionModal(true)}
                        className="flex items-center gap-1 hover:text-[#46b8da] transition-colors"
                    >
                        <Clock size={12} />
                        Apply Permission
                    </button>
                    <button
                        onClick={() => setShowRegularizationModal(true)}
                        className="flex items-center gap-1 hover:text-[#46b8da] transition-colors"
                    >
                        <CalendarDays size={12} />
                        Raise Regularization
                    </button>
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Home &gt; Dashboard</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Punch Card */}
                <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden h-[300px]">
                    <div className="border-b-2 border-[#d9534f] px-4 py-2">
                        <h3 className="text-sm font-bold text-gray-700">Attendance</h3>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center space-y-6">
                        <h2 className="text-2xl font-medium text-gray-600">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })} {currentTime.toLocaleTimeString()}
                        </h2>

                        {!attendance?.checkIn?.time ? (
                            <button
                                disabled={actionLoading}
                                onClick={() => handlePunch('in')}
                                className="bg-[#5bc0de] text-white px-6 py-2 rounded-sm font-medium hover:bg-[#46b8da] transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Log In'}
                            </button>
                        ) : !attendance?.checkOut?.time ? (
                            <button
                                disabled={actionLoading}
                                onClick={() => handlePunch('out')}
                                className="bg-[#d9534f] text-white px-6 py-2 rounded-sm font-medium hover:bg-[#c9302c] transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Log Out'}
                            </button>
                        ) : (
                            <div className="text-gray-400 font-medium text-center">
                                <p>Logged out for Today</p>
                                <p className="text-xs mt-1">Total Hours: {attendance.workHours?.toFixed(2)} hrs</p>
                            </div>
                        )}

                        {attendance?.checkIn?.time && (
                            <div className="text-xs text-gray-500 text-center">
                                <p>Logged in at: {new Date(attendance.checkIn.time).toLocaleTimeString()}</p>
                                {attendance.checkIn.location?.lat && (
                                    <p className="text-[10px] mt-1 italic text-primary-400">Location captured</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* My Regularization Card */}
                <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden h-[300px]">
                    <div className="border-b-2 border-[#d9534f] px-4 py-2">
                        <h3 className="text-sm font-bold text-gray-700">My Regularization</h3>
                    </div>
                    <div className="overflow-x-auto h-[250px]">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 font-bold text-gray-600">Attendance Date</th>
                                    <th className="px-4 py-2 font-bold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {regularizations.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-8 text-center text-gray-400">No recent requests</td>
                                    </tr>
                                ) : (
                                    regularizations.map(reg => (
                                        <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(reg.attendanceDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "text-white px-2 py-0.5 rounded-sm font-bold capitalize",
                                                    reg.status === 'accepted' ? "bg-[#5cb85c]" :
                                                        reg.status === 'rejected' ? "bg-[#d9534f]" : "bg-[#f0ad4e]"
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

            {/* Bottom Social Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                    <div className="h-24 bg-gradient-to-r from-blue-400 to-primary-400 relative">
                        <div className="absolute -bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <UserPlus className="text-primary-600" size={24} />
                        </div>
                    </div>
                    <div className="p-8 pt-10 px-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-800">New Joiners</h4>
                                <p className="text-xs text-gray-400 mt-1">Welcome our new team members</p>
                            </div>
                            <span className="bg-blue-50 text-blue-600 font-black text-lg px-2 rounded-lg">{highlights.newJoiners.length}</span>
                        </div>
                        {renderHighlightList(highlights.newJoiners)}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                    <div className="h-24 bg-gradient-to-r from-orange-400 to-amber-400 relative">
                        <div className="absolute -bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <Gift className="text-orange-600" size={24} />
                        </div>
                    </div>
                    <div className="p-8 pt-10 px-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-800">Birthdays</h4>
                                <p className="text-xs text-gray-400 mt-1">Celebrate with the team today</p>
                            </div>
                            <span className="bg-orange-50 text-orange-600 font-black text-lg px-2 rounded-lg">{highlights.birthdays.length}</span>
                        </div>
                        {renderHighlightList(highlights.birthdays)}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                    <div className="h-24 bg-gradient-to-r from-purple-400 to-indigo-400 relative">
                        <div className="absolute -bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <Trophy className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <div className="p-8 pt-10 px-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-800">Job Anniversaries</h4>
                                <p className="text-xs text-gray-400 mt-1">Milestones and celebrations</p>
                            </div>
                            <span className="bg-purple-50 text-purple-600 font-black text-lg px-2 rounded-lg">{highlights.anniversaries.length}</span>
                        </div>
                        {renderHighlightList(highlights.anniversaries)}
                    </div>
                </div>
            </div>

            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Apply for Permission (2 Hours)</h3>
                        <p className="text-xs text-gray-500 mb-6">Note: You can only apply for one 2-hour permission per month.</p>
                        <form onSubmit={handlePermissionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Date</label>
                                <input name="date" type="date" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#5bc0de]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Type</label>
                                <select name="type" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#5bc0de]">
                                    <option value="morning">Morning (9:00 AM - 11:00 AM)</option>
                                    <option value="evening">Evening (4:30 PM - 6:30 PM)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Reason</label>
                                <textarea name="reason" required placeholder="Medical, Personal, etc." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#5bc0de] h-20" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowPermissionModal(false)} className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-2 bg-[#5bc0de] text-white font-bold rounded-lg hover:bg-[#46b8da] disabled:opacity-50">
                                    {actionLoading ? 'Applying...' : 'Apply now'}
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
        </div>
    );
};

export default DashboardPage;

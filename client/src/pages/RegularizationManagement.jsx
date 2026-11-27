import { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Calendar,
    AlertCircle,
    Loader2,
    Search,
    Clock
} from 'lucide-react';
import api from '../services/api';
import { toast } from '../store/useUIStore';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const RegularizationManagement = () => {
    const [activeTab, setActiveTab] = useState('regularizations'); // 'regularizations' | 'permissions'
    const [requests, setRequests] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [regRes, permRes] = await Promise.all([
                api.get('/regularization'),
                api.get('/permissions')
            ]);
            setRequests(regRes.data.data || []);
            setPermissions(permRes.data.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load attendance requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            setActionLoading(id);
            await api.put(`/regularization/${id}`, { status });
            toast.success(`Regularization request ${status}`);
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermissionUpdate = async (id, status) => {
        try {
            setActionLoading(id);
            await api.put(`/permissions/${id}`, { status });
            toast.success(`Permission request ${status}`);
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingRegCount = requests.filter(r => r.status === 'pending').length;
    const pendingPermCount = permissions.filter(p => p.status === 'pending').length;

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredPermissions = permissions.filter(perm => {
        const matchesSearch = perm.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || perm.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[320px]">
            <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
    );

    const statusOptions = activeTab === 'regularizations'
        ? ['all', 'pending', 'accepted', 'rejected']
        : ['all', 'pending', 'approved', 'rejected'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Requests</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Review and process employee regularization and 2-hour permission requests.</p>
                </div>

                {/* Queue Switcher */}
                <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200 shadow-xs self-start">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('regularizations'); setStatusFilter('all'); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'regularizations'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Regularizations
                        {pendingRegCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'regularizations' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {pendingRegCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('permissions'); setStatusFilter('all'); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'permissions'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Permissions (2h)
                        {pendingPermCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'permissions' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {pendingPermCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
                    <div className="relative flex-1 min-w-0 sm:max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            aria-label="Search attendance requests"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {statusOptions.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === status
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'regularizations' ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Times</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            <AlertCircle className="mx-auto mb-2 opacity-40" size={36} />
                                            No regularization requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(req => (
                                        <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {req.employee?.firstName?.[0]}{req.employee?.lastName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{req.employee?.firstName} {req.employee?.lastName}</p>
                                                        <p className="text-xs text-slate-500 uppercase">ID: {req.employee?.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                    <Calendar size={14} className="text-primary-600" />
                                                    {new Date(req.attendanceDate).toLocaleDateString()}
                                                </div>
                                                <span className="mt-1 inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold uppercase">
                                                    {req.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {req.startTime && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                                            <CheckCircle size={12} />
                                                            In: {req.startTime}
                                                        </div>
                                                    )}
                                                    {req.endTime && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                                                            <XCircle size={12} />
                                                            Out: {req.endTime}
                                                        </div>
                                                    )}
                                                    {!req.startTime && !req.endTime && (
                                                        <span className="text-xs text-slate-400 italic">Status only</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-slate-600 line-clamp-2" title={req.reason}>
                                                    {req.reason}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusUpdate(req._id, 'accepted')}
                                                            disabled={actionLoading === req._id}
                                                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                            aria-label="Approve request"
                                                        >
                                                            {actionLoading === req._id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                                            disabled={actionLoading === req._id}
                                                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                                                            title="Reject"
                                                            aria-label="Reject request"
                                                        >
                                                            {actionLoading === req._id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                                                            req.status === 'accepted'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                        )}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Slot</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPermissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            <Clock className="mx-auto mb-2 opacity-40" size={36} />
                                            No permission requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPermissions.map(perm => (
                                        <tr key={perm._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {perm.employee?.firstName?.[0]}{perm.employee?.lastName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{perm.employee?.firstName} {perm.employee?.lastName}</p>
                                                        <p className="text-xs text-slate-500 uppercase">ID: {perm.employee?.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                                {new Date(perm.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold capitalize">
                                                    {perm.type === 'morning' ? 'Morning (9:00 AM - 11:00 AM)' : 'Evening (4:30 PM - 6:30 PM)'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-slate-600 line-clamp-2" title={perm.reason}>
                                                    {perm.reason}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {perm.status === 'pending' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePermissionUpdate(perm._id, 'approved')}
                                                            disabled={actionLoading === perm._id}
                                                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
                                                            title="Approve permission"
                                                            aria-label="Approve permission request"
                                                        >
                                                            {actionLoading === perm._id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePermissionUpdate(perm._id, 'rejected')}
                                                            disabled={actionLoading === perm._id}
                                                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                                                            title="Reject permission"
                                                            aria-label="Reject permission request"
                                                        >
                                                            {actionLoading === perm._id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                                                            perm.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                        )}>
                                                            {perm.status}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegularizationManagement;

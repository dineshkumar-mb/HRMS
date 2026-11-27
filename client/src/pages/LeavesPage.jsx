import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
    CalendarDays,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Plus,
    ThumbsUp,
    ThumbsDown,
    X
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { toast, confirmAction } from '../store/useUIStore';

const LeavesPage = () => {
    const { user, getProfile } = useAuthStore();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [btnLoading, setBtnLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const watchLeaveType = watch('leaveType');
    const watchStartDate = watch('startDate');
    const watchEndDate = watch('endDate');

    const calculatedDays = (() => {
        if (!watchStartDate || !watchEndDate) return 0;
        const start = new Date(watchStartDate);
        const end = new Date(watchEndDate);
        if (end < start) return -1;
        return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const canApprove = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

    useEffect(() => {
        fetchLeaves();
        getProfile(); // Refresh profile to get latest balances
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leave');
            setLeaves(data.data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        if (new Date(data.endDate) < new Date(data.startDate)) {
            toast.error('End date cannot be earlier than start date');
            return;
        }
        setBtnLoading(true);
        try {
            await api.post('/leave', data);
            toast.success('Leave application submitted');
            reset();
            fetchLeaves();
            getProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply for leave');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleApprove = async (leave) => {
        const leaveId = leave._id;
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const dept = leave.employee?.department;

        const overlapping = leaves.filter((other) => {
            if (other._id === leaveId || other.status !== 'approved') return false;
            if (dept && other.employee?.department !== dept) return false;
            return new Date(other.startDate) <= end && new Date(other.endDate) >= start;
        });

        const overlapWarning = overlapping.length > 0
            ? ` Warning: ${overlapping.map(o => `${o.employee?.firstName} ${o.employee?.lastName}`).join(', ')} in ${dept || 'this team'} already has approved leave during these dates.`
            : '';

        const confirmed = await confirmAction({
            title: 'Approve Leave',
            message: `Are you sure you want to approve this leave request?${overlapWarning}`,
            confirmText: 'Approve',
            variant: overlapping.length > 0 ? 'danger' : 'primary'
        });
        if (!confirmed) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'approved' });
            toast.success('Leave request approved');
            fetchLeaves();
            getProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleReject = async (leaveId) => {
        const confirmed = await confirmAction({
            title: 'Reject Leave',
            message: 'Are you sure you want to reject this leave request?',
            confirmText: 'Reject',
            variant: 'danger'
        });
        if (!confirmed) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'rejected' });
            toast.success('Leave request rejected');
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleCancel = async (leaveId) => {
        const confirmed = await confirmAction({
            title: 'Cancel Leave Request',
            message: 'Are you sure you want to cancel this leave request? Leave balance will be restored if previously approved.',
            confirmText: 'Cancel Leave',
            variant: 'danger'
        });
        if (!confirmed) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'cancelled' });
            toast.info('Leave request cancelled');
            fetchLeaves();
            getProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel');
        } finally {
            setBtnLoading(false);
        }
    };

    const balances = user?.employee?.leaveBalances || {
        casual: 0,
        sick: 0,
        earned: 0,
        unpaid: 0,
        paternity: 0,
        bereavement: 0
    };

    return (
        <div className="space-y-6">
            {/* Navigation / Breadcrumbs */}
            <div className="bg-slate-100 px-4 py-2 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-slate-500">
                    <Link to="/" className="hover:text-primary-600 transition-colors opacity-70">Dashboard</Link>
                    <span className="mx-2 text-primary-500 font-bold">&gt;</span>
                    <Link to="/leaves" className="hover:text-primary-600 transition-colors opacity-70">Leave Management</Link>
                    <span className="mx-2 text-primary-500 font-bold">&gt;</span>
                    <span className="text-slate-800 font-bold">New Leave Application</span>
                </p>
            </div>

            {/* Leave Balance Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-slate-900 font-bold text-base">Leave Balance</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'Casual Leave (CL)', count: balances.casual, bg: 'bg-primary-600' },
                            { label: 'Sick Leave (SL)', count: balances.sick, bg: 'bg-emerald-600' },
                            { label: 'Earned Leave (EL)', count: balances.earned, bg: 'bg-purple-600' },
                            { label: 'Unpaid Leave (UL)', count: balances.unpaid, bg: 'bg-teal-600' },
                            { label: 'Paternity Leave', count: balances.paternity, bg: 'bg-orange-600' },
                            { label: 'Bereavement Leave', count: balances.bereavement, bg: 'bg-sky-600' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className={`${item.bg} px-4 py-3.5 rounded-xl flex justify-between items-center text-white shadow-sm`}
                            >
                                <span className="font-semibold text-sm">{item.label}</span>
                                <span className="font-bold border-l border-white/30 pl-3 ml-3 font-mono">{parseFloat(item.count || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold text-purple-900">Earned Leave (EL) Auto-Generation Progress</p>
                            <p className="text-[11px] text-purple-700 mt-0.5">
                                +1 EL is credited automatically after 20 consecutive working days without taking leave.
                            </p>
                        </div>
                        <div className="sm:w-56 shrink-0">
                            <div className="flex justify-between text-xs font-bold text-purple-900 mb-1">
                                <span>{user?.employee?.earnedLeaveProgress?.consecutiveWorkingDays || 0} / 20 days</span>
                                <span>+{user?.employee?.earnedLeaveProgress?.totalElEarned || 0} earned</span>
                            </div>
                            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-600 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, ((user?.employee?.earnedLeaveProgress?.consecutiveWorkingDays || 0) / 20) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Leave Form Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-slate-900 font-bold text-base">Apply for Leave</h3>
                </div>
                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="leave-type" className="block text-sm font-bold text-slate-700">Leave Category <span className="text-red-500">*</span></label>
                            <select
                                id="leave-type"
                                {...register('leaveType', { required: true })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-700 text-sm"
                            >
                                <option value="">Select Leave</option>
                                <option value="casual">Casual Leave (CL)</option>
                                <option value="sick">Sick Leave (SL)</option>
                                <option value="earned">Earned Leave (EL)</option>
                                <option value="unpaid">Unpaid Leave (UL)</option>
                                <option value="paternity">Paternity Leave</option>
                                <option value="bereavement">Bereavement Leave</option>
                            </select>
                            {errors.leaveType && <p className="text-red-500 text-xs">Category is required</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Start Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-gray-300 pr-3">
                                        <CalendarDays className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        {...register('startDate', { required: true })}
                                        className="w-full pl-14 pr-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                {errors.startDate && <p className="text-red-500 text-xs">Start date is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">End Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-gray-300 pr-3">
                                        <CalendarDays className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        {...register('endDate', { required: true })}
                                        className="w-full pl-14 pr-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                {errors.endDate && <p className="text-red-500 text-xs">End date is required</p>}
                            </div>
                        </div>

                        {watchStartDate && watchEndDate && (
                            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${calculatedDays < 0
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-primary-50/70 border-primary-100 text-primary-800'
                                }`}>
                                {calculatedDays < 0 ? (
                                    <span>End date must be on or after the start date.</span>
                                ) : (
                                    <>
                                        <span>Requested Duration: <strong>{calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}</strong></span>
                                        {watchLeaveType && (
                                            <span>
                                                Available Balance: <strong>{parseFloat(balances[watchLeaveType] || 0).toFixed(2)} days</strong>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Reason <span className="text-red-500">*</span></label>
                            <textarea
                                {...register('reason', { required: true })}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg h-32 resize-none outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                placeholder="Enter reason here....."
                            ></textarea>
                            {errors.reason && <p className="text-red-500 text-xs">Reason is required</p>}
                        </div>

                        <div className="pt-2">
                            <button
                                disabled={btnLoading}
                                type="submit"
                                className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-100 disabled:opacity-50 flex items-center gap-2 text-sm"
                            >
                                {btnLoading ? <Loader2 className="animate-spin" size={18} /> : 'Apply Leave'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                            {canApprove ? 'Manage All Leave Requests' : 'Your Leave Requests History'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{leaves.length} Total Records</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === status
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100/50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                {canApprove && <th className="px-6 py-4">Employee</th>}
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4 text-center">Days</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={canApprove ? 7 : 6} className="px-6 py-12"><Loader2 className="animate-spin text-primary-600 mx-auto" size={32} /></td></tr>
                            ) : leaves.filter(l => statusFilter === 'all' || l.status === statusFilter).length === 0 ? (
                                <tr><td colSpan={canApprove ? 7 : 6} className="px-6 py-16 text-center text-gray-400 font-medium">No leave requests found for this filter.</td></tr>
                            ) : (
                                leaves.filter(l => statusFilter === 'all' || l.status === statusFilter).map((leave) => (
                                    <tr key={leave._id} className="text-sm hover:bg-gray-50/80 transition-colors">
                                        {canApprove && (
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">
                                                    {leave.employee?.firstName} {leave.employee?.lastName}
                                                </div>
                                                <div className="text-[10px] font-semibold text-gray-400 uppercase">{leave.employee?.department}</div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${leave.leaveType === 'casual' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                leave.leaveType === 'sick' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    leave.leaveType === 'earned' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        leave.leaveType === 'unpaid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            leave.leaveType === 'paternity' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                leave.leaveType === 'bereavement' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                                                    'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-600">
                                            <div className="flex flex-col">
                                                <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-400">to {new Date(leave.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">{leave.days}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase ${leave.status === 'pending' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
                                                    leave.status === 'approved' ? 'text-green-700 bg-green-50 border border-green-100' :
                                                        leave.status === 'cancelled' ? 'text-gray-700 bg-gray-50 border border-gray-100' :
                                                            'text-red-700 bg-red-50 border border-red-100'
                                                    }`}>
                                                    {leave.status === 'pending' && <Clock size={12} />}
                                                    {leave.status === 'approved' && <ThumbsUp size={12} />}
                                                    {leave.status === 'cancelled' && <XCircle size={12} />}
                                                    {leave.status === 'rejected' && <ThumbsDown size={12} />}
                                                    {leave.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs transition-all hover:max-w-none group relative">
                                            <span className="truncate block group-hover:block">{leave.reason}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {leave.status === 'pending' || leave.status === 'approved' ? (
                                                <div className="flex items-center gap-2">
                                                    {canApprove && leave.status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApprove(leave)}
                                                                disabled={btnLoading}
                                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                                title="Approve"
                                                                aria-label="Approve leave request"
                                                            >
                                                                <ThumbsUp size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReject(leave._id)}
                                                                disabled={btnLoading}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                                title="Reject"
                                                                aria-label="Reject leave request"
                                                            >
                                                                <ThumbsDown size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(canApprove || leave.employee?._id === user?.employee?._id) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancel(leave._id)}
                                                            disabled={btnLoading}
                                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition-all shadow-sm"
                                                            title="Cancel"
                                                            aria-label="Cancel leave request"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeavesPage;

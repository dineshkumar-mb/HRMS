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

const LeavesPage = () => {
    const { user, getProfile } = useAuthStore();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
        setBtnLoading(true);
        try {
            await api.post('/leave', data);
            setShowModal(false);
            reset();
            fetchLeaves();
            getProfile(); // Refresh balances after application
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to apply');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleApprove = async (leaveId) => {
        if (!window.confirm('Are you sure you want to approve this leave request?')) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'approved' });
            fetchLeaves();
            getProfile(); // Refresh balances if self-approving or for context
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleReject = async (leaveId) => {
        if (!window.confirm('Are you sure you want to reject this leave request?')) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'rejected' });
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleCancel = async (leaveId) => {
        if (!window.confirm('Are you sure you want to cancel this leave request? Leave balance will be restored if previously approved.')) return;

        setBtnLoading(true);
        try {
            await api.put(`/leave/${leaveId}`, { status: 'cancelled' });
            fetchLeaves();
            getProfile(); // Refresh balances
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel');
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-500 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-white font-bold text-lg">Leave Balance</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'Casual Leave (CL)', count: balances.casual, bg: 'bg-blue-600' },
                            { label: 'Sick Leave (SL)', count: balances.sick, bg: 'bg-green-700' },
                            { label: 'Earned Leave (EL)', count: balances.earned, bg: 'bg-purple-600' },
                            { label: 'Unpaid Leave(UL)', count: balances.unpaid, bg: 'bg-emerald-500' },
                            { label: 'Paternity Leave', count: balances.paternity, bg: 'bg-orange-600' },
                            { label: 'Bereavement Leave', count: balances.bereavement, bg: 'bg-sky-400' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className={`${item.bg} px-4 py-3 rounded-lg flex justify-between items-center text-white shadow-sm hover:opacity-90 transition-all cursor-default`}
                            >
                                <span className="font-semibold text-sm">{item.label}</span>
                                <span className="font-bold border-l border-white/30 pl-3 ml-3">{parseFloat(item.count || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Apply Leave Form Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-500 px-6 py-4 border-b border-gray-200 border-t-4 border-t-red-500">
                    <h3 className="text-white font-bold text-lg">Apply Leave</h3>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Leave Category <span className="text-red-500">*</span></label>
                            <select
                                {...register('leaveType', { required: true })}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-700"
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

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Reason <span className="text-red-500">*</span></label>
                            <textarea
                                {...register('reason', { required: true })}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg h-32 resize-none outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                placeholder="Enter reason here....."
                            ></textarea>
                            {errors.reason && <p className="text-red-500 text-xs">Reason is required</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                disabled={btnLoading}
                                type="submit"
                                className="px-8 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {btnLoading ? <Loader2 className="animate-spin" size={20} /> : 'Apply Leave'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg">
                        {canApprove ? 'Manage All Leave Requests' : 'Your Leave Requests History'}
                    </h3>
                    <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        {leaves.length} Total Records
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
                            ) : leaves.length === 0 ? (
                                <tr><td colSpan={canApprove ? 7 : 6} className="px-6 py-16 text-center text-gray-400 font-medium">No leave requests found in history.</td></tr>
                            ) : (
                                leaves.map((leave) => (
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
                                                                onClick={() => handleApprove(leave._id)}
                                                                disabled={btnLoading}
                                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                                title="Approve"
                                                            >
                                                                <ThumbsUp size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(leave._id)}
                                                                disabled={btnLoading}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                                title="Reject"
                                                            >
                                                                <ThumbsDown size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(canApprove || leave.employee?._id === user?.employee?._id) && (
                                                        <button
                                                            onClick={() => handleCancel(leave._id)}
                                                            disabled={btnLoading}
                                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition-all shadow-sm"
                                                            title="Cancel"
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

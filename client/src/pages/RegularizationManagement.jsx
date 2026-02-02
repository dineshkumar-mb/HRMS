import { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    AlertCircle,
    Loader2,
    Search
} from 'lucide-react';
import api from '../services/api';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const RegularizationManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/regularization');
            setRequests(data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setActionLoading(id);
            await api.put(`/regularization/${id}`, { status });
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-[#5bc0de]" size={40} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">Attendance Requests</h1>
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Home &gt; Attendance Requests</span>
                </div>
            </div>

            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#5bc0de]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Employee</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date & Type</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Requested Times</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <AlertCircle className="mx-auto mb-2 opacity-20" size={40} />
                                        No pending requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#5bc0de]/10 text-[#5bc0de] flex items-center justify-center font-bold">
                                                    {req.employee?.firstName?.[0]}{req.employee?.lastName?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{req.employee?.firstName} {req.employee?.lastName}</p>
                                                    <p className="text-xs text-gray-500 uppercase">ID: {req.employee?.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Calendar size={14} className="text-[#5bc0de]" />
                                                {new Date(req.attendanceDate).toLocaleDateString()}
                                            </div>
                                            <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-sm text-[10px] font-bold uppercase">
                                                {req.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {req.startTime && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                                                        <CheckCircle size={12} />
                                                        In: {req.startTime}
                                                    </div>
                                                )}
                                                {req.endTime && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                                                        <Clock size={12} />
                                                        Out: {req.endTime}
                                                    </div>
                                                )}
                                                {!req.startTime && !req.endTime && (
                                                    <span className="text-xs text-gray-400 italic">Status only</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-gray-600 line-clamp-2" title={req.reason}>
                                                {req.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'pending' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(req._id, 'accepted')}
                                                        disabled={actionLoading === req._id}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        {actionLoading === req._id ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(req._id, 'rejected')}
                                                        disabled={actionLoading === req._id}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        {actionLoading === req._id ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-sm text-xs font-bold uppercase text-white shadow-sm",
                                                        req.status === 'accepted' ? 'bg-[#5cb85c]' : 'bg-[#d9534f]'
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
                </div>
            </div>
        </div>
    );
};

export default RegularizationManagement;

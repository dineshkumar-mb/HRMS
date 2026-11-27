import { useState, useEffect } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import api from '../services/api';

const MyAttendanceLog = () => {
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMyAttendance();
    }, []);

    const fetchMyAttendance = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/attendance/me');
            setAttendance(data.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = attendance.filter(log => {
        const date = new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formatted = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toLowerCase();
        return date.includes(searchTerm) || formatted.includes(searchTerm.toLowerCase());
    });

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[320px]">
            <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance Log</h1>
                <p className="text-sm text-slate-500 mt-0.5">Detailed history of your daily check-in and check-out punches.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by date (e.g. Nov 27)..."
                            aria-label="Search attendance logs by date"
                            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Log In</th>
                                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Log Out</th>
                                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No attendance logs found</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.checkIn?.time ? (
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-primary-600">{new Date(log.checkIn.time).toLocaleTimeString()}</p>
                                                    {log.checkIn.location?.lat && (
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                            <MapPin size={11} /> Verified
                                                        </p>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.checkOut?.time ? (
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-rose-600">{new Date(log.checkOut.time).toLocaleTimeString()}</p>
                                                    {log.checkOut.location?.lat && (
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                            <MapPin size={11} /> Verified
                                                        </p>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {log.workHours ? `${log.workHours.toFixed(2)} hrs` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] ${log.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                log.status === 'late' || log.status === 'P/2' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                    'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {log.status === 'P/2' ? 'Half Day' : log.status}
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
    );
};

export default MyAttendanceLog;

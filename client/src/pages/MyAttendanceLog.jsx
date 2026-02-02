import { useState, useEffect } from 'react';
import { Clock, MapPin, Search, Calendar, Loader2 } from 'lucide-react';
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
        return date.includes(searchTerm);
    });

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-[#5bc0de]" size={40} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">My Attendance Log</h1>
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Home &gt; Attendance &gt; My Log</span>
                </div>
            </div>

            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search date..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-sm outline-none focus:ring-1 focus:ring-[#5bc0de]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-bold text-gray-600">Date</th>
                                <th className="px-6 py-3 font-bold text-gray-600">Log In</th>
                                <th className="px-6 py-3 font-bold text-gray-600">Log Out</th>
                                <th className="px-6 py-3 font-bold text-gray-600">Total Hours</th>
                                <th className="px-6 py-3 font-bold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No logs found</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.checkIn?.time ? (
                                                <div className="space-y-1">
                                                    <p className="font-bold text-[#5bc0de]">{new Date(log.checkIn.time).toLocaleTimeString()}</p>
                                                    {log.checkIn.location?.lat && (
                                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <MapPin size={10} /> Verified
                                                        </p>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.checkOut?.time ? (
                                                <div className="space-y-1">
                                                    <p className="font-bold text-[#d9534f]">{new Date(log.checkOut.time).toLocaleTimeString()}</p>
                                                    {log.checkOut.location?.lat && (
                                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <MapPin size={10} /> Verified
                                                        </p>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">
                                            {log.workHours ? `${log.workHours.toFixed(2)} hrs` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-sm font-bold uppercase text-[10px] text-white ${log.status === 'present' ? 'bg-green-500' :
                                                log.status === 'late' || log.status === 'P/2' ? 'bg-orange-500' :
                                                    'bg-red-500'
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

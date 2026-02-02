import { useState, useEffect } from 'react';
import { Search, Loader2, Calendar } from 'lucide-react';
import api from '../services/api';

const AttendanceReportGrid = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDesig, setSelectedDesig] = useState('');
    const [allDepts, setAllDepts] = useState([]);
    const [allDesigs, setAllDesigs] = useState([]);

    useEffect(() => {
        fetchReportData();
    }, [month, selectedDept, selectedDesig]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams({ month });
            if (selectedDept) query.append('department', selectedDept);
            if (selectedDesig) query.append('designation', selectedDesig);

            const { data } = await api.get(`/reports/attendance-grid?${query.toString()}`);
            setData(data.data);

            // Populate filters if not yet done
            if (allDepts.length === 0) {
                const depts = [...new Set(data.data.map(e => e.department))].filter(Boolean);
                const desigs = [...new Set(data.data.map(e => e.designation))].filter(Boolean);
                setAllDepts(depts);
                setAllDesigs(desigs);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (dateStr) => {
        const [year, monthNum] = dateStr.split('-').map(Number);
        return new Date(year, monthNum, 0).getDate();
    };

    const getMonthName = (dateStr) => {
        const [year, monthNum] = dateStr.split('-').map(Number);
        const date = new Date(year, monthNum - 1, 1);
        return date.toLocaleString('default', { month: 'short' });
    };

    const getDayAbbr = (dateStr, day) => {
        const [year, monthNum] = dateStr.split('-').map(Number);
        const date = new Date(year, monthNum - 1, day);
        return date.toLocaleString('default', { weekday: 'short' });
    };

    const days = Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1);

    const getStatusColor = (status) => {
        switch (status) {
            case 'P': return 'text-green-600';
            case 'P/2': return 'text-orange-600';
            case 'W': return 'text-amber-500';
            case 'H': return 'text-blue-500';
            case 'L': return 'text-purple-600';
            case 'A': return 'text-red-600';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">Attendance Report</h1>
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Home &gt; Attendance &gt; Report</span>
                </div>
            </div>

            <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-6 overflow-hidden">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center border border-gray-300 rounded-sm">
                        <input
                            type="month"
                            className="px-3 py-1.5 text-sm outline-none"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                        <button className="bg-[#5bc0de] text-white px-4 py-1.5 text-sm font-bold border-l border-[#46b8da]">Go</button>
                    </div>

                    <select
                        className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm text-gray-500 min-w-[200px]"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm text-gray-500 min-w-[200px]"
                        value={selectedDesig}
                        onChange={(e) => setSelectedDesig(e.target.value)}
                    >
                        <option value="">All Designations</option>
                        {allDesigs.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select className="border border-gray-300 rounded-sm px-3 py-1.5 text-sm text-gray-500 min-w-[200px]">
                        <option>Select Employee</option>
                        {data.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>

                <div className="mb-4 text-xs text-gray-600">
                    Showing {data.length} entries
                </div>

                {/* The Horizontal Grid */}
                <div className="overflow-x-auto border border-gray-100">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="animate-spin text-[#5bc0de]" size={40} />
                            <p className="text-sm text-gray-500">Generating report matrix...</p>
                        </div>
                    ) : (
                        <table className="w-full text-[10px] border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th className="border-r border-b border-gray-200 px-4 py-4 text-left w-64 bg-gray-100 sticky left-0 z-10">Employee Name</th>
                                    {days.map(day => (
                                        <th key={day} className="border-r border-b border-gray-200 text-center py-2 min-w-[32px]">
                                            <div className="font-bold">{day}-</div>
                                            <div className="text-[9px] font-normal">{getMonthName(month)}</div>
                                            <div className="text-[9px] font-normal uppercase">{getDayAbbr(month, day)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="border-r border-b border-gray-200 px-4 py-4 font-bold text-gray-700 sticky left-0 bg-white z-10 group-hover:bg-gray-50">
                                            {emp.name}
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase">ID: {emp.employeeId}</div>
                                        </td>
                                        {days.map(day => {
                                            const status = emp.attendance?.[day] || '-';
                                            const color = getStatusColor(status);
                                            return (
                                                <td
                                                    key={day}
                                                    className={`border-r border-b border-gray-200 text-center py-4 group/cell relative ${status === 'W' || status === 'H' ? 'bg-orange-50/20' : ''}`}
                                                >
                                                    <div className={`font-bold mb-1 ${color}`}>{status}</div>

                                                    {/* Punch Details Hover */}
                                                    {status !== '-' && status !== 'W' && status !== 'H' && (
                                                        <div className="hidden group-hover/cell:block absolute z-20 top-full left-1/2 -translate-x-1/2 bg-gray-900 text-white p-2 rounded shadow-xl min-w-[120px] pointer-events-none">
                                                            <div className="text-[9px] whitespace-nowrap">
                                                                <p>In: {emp.punchData?.[day]?.in || 'N/A'}</p>
                                                                <p>Out: {emp.punchData?.[day]?.out || 'N/A'}</p>
                                                                {emp.punchData?.[day]?.location && (
                                                                    <p className="text-[#5bc0de] mt-1 border-t border-gray-700 pt-1 flex items-center gap-1 justify-center">
                                                                        <svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                                                                        Verified
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`${color} flex justify-center opacity-80`}>
                                                        {status !== 'A' && status !== '-' && (
                                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <div>Showing 1 to 1 of 1 entries</div>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 border border-gray-200 rounded-sm">Previous</button>
                        <button className="px-3 py-1 bg-[#222222] text-white rounded-sm">1</button>
                        <button className="px-3 py-1 border border-gray-200 rounded-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReportGrid;

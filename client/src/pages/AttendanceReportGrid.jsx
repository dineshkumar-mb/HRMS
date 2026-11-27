import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const AttendanceReportGrid = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDesig, setSelectedDesig] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [allDepts, setAllDepts] = useState([]);
    const [allDesigs, setAllDesigs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;

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
            setCurrentPage(1);

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
            case 'P': return 'text-emerald-600';
            case 'P/2': return 'text-amber-600';
            case 'W': return 'text-amber-500';
            case 'H': return 'text-primary-600';
            case 'L': return 'text-purple-600';
            case 'A': return 'text-red-600';
            default: return 'text-slate-400';
        }
    };

    const filteredData = selectedEmployee
        ? data.filter(emp => String(emp.id) === String(selectedEmployee))
        : data;

    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const indexOfFirst = (currentPage - 1) * entriesPerPage;
    const indexOfLast = indexOfFirst + entriesPerPage;
    const paginatedData = filteredData.slice(indexOfFirst, indexOfLast);

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Report</h1>
                <p className="text-sm text-slate-500 mt-0.5">Monthly attendance matrix across departments and employees.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 overflow-hidden">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
                    <input
                        type="month"
                        aria-label="Select month"
                        className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />

                    <select
                        aria-label="Filter by department"
                        className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 w-full sm:w-auto min-w-0 sm:min-w-[180px] outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        aria-label="Filter by designation"
                        className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 w-full sm:w-auto min-w-0 sm:min-w-[180px] outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedDesig}
                        onChange={(e) => setSelectedDesig(e.target.value)}
                    >
                        <option value="">All Designations</option>
                        {allDesigs.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        aria-label="Filter by employee"
                        className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 w-full sm:w-auto min-w-0 sm:min-w-[180px] outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedEmployee}
                        onChange={(e) => {
                            setSelectedEmployee(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Employees</option>
                        {data.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>

                {/* The Horizontal Grid */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="animate-spin text-primary-600" size={36} />
                            <p className="text-sm text-slate-500">Generating report matrix...</p>
                        </div>
                    ) : (
                        <table className="w-full text-[11px] border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700">
                                    <th className="border-r border-b border-slate-200 px-4 py-3 text-left w-64 bg-slate-50 sticky left-0 z-10 font-bold">Employee Name</th>
                                    {days.map(day => (
                                        <th key={day} className="border-r border-b border-slate-200 text-center py-2 min-w-[34px]">
                                            <div className="font-bold">{day}</div>
                                            <div className="text-[9px] font-normal text-slate-500">{getMonthName(month)}</div>
                                            <div className="text-[9px] font-normal uppercase text-slate-400">{getDayAbbr(month, day)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={days.length + 1} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No attendance records match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="border-r border-b border-slate-200 px-4 py-3.5 font-bold text-slate-800 sticky left-0 bg-white z-10">
                                                {emp.name}
                                                <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">ID: {emp.employeeId}</div>
                                            </td>
                                            {days.map(day => {
                                                const status = emp.attendance?.[day] || '-';
                                                const color = getStatusColor(status);
                                                return (
                                                    <td
                                                        key={day}
                                                        className={`border-r border-b border-slate-200 text-center py-3 group/cell relative ${status === 'W' || status === 'H' ? 'bg-amber-50/30' : ''}`}
                                                    >
                                                        <div className={`font-bold ${color}`}>{status}</div>

                                                        {status !== '-' && status !== 'W' && status !== 'H' && (
                                                            <div className="hidden group-hover/cell:block absolute z-20 top-full left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg shadow-xl min-w-[120px] pointer-events-none">
                                                                <div className="text-[10px] whitespace-nowrap">
                                                                    <p>In: {emp.punchData?.[day]?.in || 'N/A'}</p>
                                                                    <p>Out: {emp.punchData?.[day]?.out || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                    <div>
                        Showing {filteredData.length === 0 ? 0 : indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 bg-primary-600 text-white rounded-lg font-bold">{currentPage}</span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReportGrid;

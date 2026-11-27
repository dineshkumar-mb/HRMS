import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const AttendanceCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMonthlyAttendance();
    }, [currentDate]);

    const fetchMonthlyAttendance = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/attendance/me');
            setAttendanceData(data.data);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const todayStr = new Date().toLocaleDateString('en-CA');

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`blank-${i}`} className="h-32 border border-slate-100 bg-slate-50/40" />);
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const record = attendanceData.find(r => {
                const localDate = new Date(r.date).toLocaleDateString('en-CA');
                return localDate === dateStr;
            });
            const dayOfWeek = new Date(year, month, d).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = dateStr === todayStr;

            days.push(
                <div
                    key={d}
                    className={`h-32 border border-slate-100 p-2.5 text-xs relative flex flex-col justify-between transition-colors ${isToday ? 'bg-primary-50/40 ring-1 ring-inset ring-primary-300' :
                        isWeekend ? 'bg-amber-50/25' : 'bg-white'
                        }`}
                >
                    <div className="flex justify-between items-start gap-1">
                        <span className={`font-bold px-1.5 py-0.5 rounded-md ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700'}`}>
                            {d}
                        </span>
                        {isWeekend && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">WO</span>
                        )}
                    </div>

                    {record?.checkIn && (
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">In:</span>
                                <span className="font-semibold text-slate-700">
                                    {new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {record.checkOut && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Out:</span>
                                    <span className="font-semibold text-slate-700">
                                        {new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <span className="font-bold text-slate-700">
                                    {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${record.status === 'present'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {record.status === 'present' ? 'P' : record.status === 'P/2' ? 'P/2' : record.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Calendar</h1>
                <p className="text-sm text-slate-500 mt-0.5">Monthly view of your daily check-in, check-out, and work hours.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="bg-slate-100 text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 min-w-[160px] text-center">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="bg-slate-100 text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <div className="min-w-[640px] grid grid-cols-7">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-slate-900 text-white text-center py-2.5 text-xs font-bold uppercase tracking-wider border-r border-slate-800 last:border-r-0">
                                {day}
                            </div>
                        ))}
                        {loading ? (
                            <div className="col-span-7 h-96 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary-600" size={32} />
                            </div>
                        ) : renderCalendar()}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">Present (P)</span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">Half Day (P/2)</span>
                    <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg">Absent (A)</span>
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">Weekly Off (WO)</span>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;

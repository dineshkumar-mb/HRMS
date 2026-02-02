import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
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

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        // Blank spaces for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`blank-${i}`} className="h-32 border border-gray-100 bg-gray-50/30"></div>);
        }

        // Actual days
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const record = attendanceData.find(r => {
                const localDate = new Date(r.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
                return localDate === dateStr;
            });
            const isWeekend = new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6;

            days.push(
                <div key={d} className={`h-32 border border-gray-100 p-2 text-xs relative ${isWeekend ? 'bg-orange-50/20' : 'bg-white'}`}>
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-700">{d}</span>
                        {isWeekend && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">WO</span>}
                    </div>

                    {record?.checkIn && (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-400">In:</span>
                                <span className="font-medium">{new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {record.checkOut && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Out:</span>
                                        <span className="font-medium">{new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-50 pt-1 mt-1 font-bold">
                                        <span className="text-gray-400">Total:</span>
                                        <span>{record.workHours?.toFixed(1)}h</span>
                                    </div>
                                </>
                            )}
                            <div className="absolute bottom-2 right-2">
                                <span className={`w-3 h-3 rounded-full block ${record.status === 'present' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
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
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">Attendance Calendar</h1>
                <div className="flex items-center gap-1">
                    <CalendarIcon size={12} />
                    <span>Home &gt; Attendance &gt; Calendar</span>
                </div>
            </div>

            <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="bg-[#5bc0de] text-white p-1 rounded-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-700 capitalize">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="bg-[#5bc0de] text-white p-1 rounded-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-t border-l border-gray-100">
                    {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                        <div key={day} className="bg-[#5bc0de] text-white text-center py-2 text-xs font-bold border-r border-b border-[#46b8da]">
                            {day}
                        </div>
                    ))}
                    {loading ? (
                        <div className="col-span-7 h-96 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#5bc0de]" size={30} />
                        </div>
                    ) : renderCalendar()}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#5cb85c] text-white px-2 py-1 rounded">Present (P)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#f0ad4e] text-white px-2 py-1 rounded">Half Day (P/2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#d9534f] text-white px-2 py-1 rounded">Absent (A)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#f0ad4e] text-white px-2 py-1 rounded">Weekly Off (WO)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;

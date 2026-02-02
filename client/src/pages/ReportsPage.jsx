import { useState, useEffect } from 'react';
import {
    Users,
    CalendarCheck,
    Clock,
    TrendingUp,
    Download,
    Building2,
    UserCheck,
    FileText,
    Calendar,
    Loader2,
    BarChart3,
    PieChart,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={color.replace('bg-', 'text-')} size={24} />
            </div>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
);

const ReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [employeeReports, setEmployeeReports] = useState(null);
    const [attendanceReports, setAttendanceReports] = useState(null);
    const [leaveReports, setLeaveReports] = useState(null);
    const [departmentReports, setDepartmentReports] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [overviewRes, employeeRes, attendanceRes, leaveRes, departmentRes] = await Promise.all([
                api.get('/reports/overview'),
                api.get('/reports/employees'),
                api.get(`/reports/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
                api.get('/reports/leaves'),
                api.get('/reports/departments')
            ]);

            setOverview(overviewRes.data.data);
            setEmployeeReports(employeeRes.data.data);
            setAttendanceReports(attendanceRes.data.data);
            setLeaveReports(leaveRes.data.data);
            setDepartmentReports(departmentRes.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">Comprehensive insights into your organization</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl px-4 py-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="text-sm border-none outline-none"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="text-sm border-none outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Employees"
                        value={overview.employees.total}
                        icon={Users}
                        color="bg-primary-600"
                        subtitle={`${overview.employees.active} active`}
                    />
                    <StatCard
                        title="Attendance Rate"
                        value={`${overview.attendance.rate}%`}
                        icon={CalendarCheck}
                        color="bg-green-600"
                        subtitle={`${overview.attendance.today} present today`}
                    />
                    <StatCard
                        title="Pending Leaves"
                        value={overview.leaves.pending}
                        icon={Clock}
                        color="bg-orange-600"
                        subtitle={`${overview.leaves.approved} approved`}
                    />
                    <StatCard
                        title="Monthly Attendance"
                        value={overview.attendance.monthly}
                        icon={TrendingUp}
                        color="bg-purple-600"
                        subtitle="This month"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employee Reports */}
                {employeeReports && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 rounded-lg">
                                    <Users className="text-primary-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Employee Distribution</h3>
                                    <p className="text-xs text-gray-500">By department and status</p>
                                </div>
                            </div>
                            <button
                                onClick={() => exportToCSV(employeeReports.employees, 'employee_report')}
                                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Export to CSV"
                            >
                                <Download size={18} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">By Department</h4>
                                    <div className="space-y-2">
                                        {Object.entries(employeeReports.byDepartment).map(([dept, count]) => (
                                            <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">{dept}</span>
                                                <span className="text-sm font-bold text-primary-600">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">By Status</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(employeeReports.byStatus).map(([status, count]) => (
                                            <div key={status} className="p-3 bg-gray-50 rounded-lg text-center">
                                                <p className="text-xs text-gray-500 capitalize">{status}</p>
                                                <p className="text-lg font-bold text-gray-900">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {employeeReports.recentHires.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Hires (Last 30 days)</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {employeeReports.recentHires.map((hire) => (
                                                <div key={hire._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {hire.firstName} {hire.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{hire.designation}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(hire.dateOfJoining).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Reports */}
                {attendanceReports && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <CalendarCheck className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Attendance Analytics</h3>
                                    <p className="text-xs text-gray-500">For selected date range</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const data = Object.entries(attendanceReports.dailyAttendance).map(([date, count]) => ({
                                        date,
                                        count
                                    }));
                                    exportToCSV(data, 'attendance_report');
                                }}
                                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Export to CSV"
                            >
                                <Download size={18} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-green-50 rounded-xl">
                                        <p className="text-xs text-green-700 font-medium">Attendance Rate</p>
                                        <p className="text-2xl font-bold text-green-600">{attendanceReports.attendanceRate}%</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <p className="text-xs text-blue-700 font-medium">Avg Work Hours</p>
                                        <p className="text-2xl font-bold text-blue-600">{attendanceReports.avgWorkHours}h</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Status Breakdown</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(attendanceReports.statusBreakdown).map(([status, count]) => (
                                            <div key={status} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 capitalize">{status}</p>
                                                <p className="text-lg font-bold text-gray-900">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {attendanceReports.lateArrivals.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <AlertCircle size={16} className="text-orange-500" />
                                            Late Arrivals
                                        </h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {attendanceReports.lateArrivals.slice(0, 10).map((late, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{late.employee}</p>
                                                        <p className="text-xs text-gray-500">{late.department}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(late.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Reports */}
                {leaveReports && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <FileText className="text-orange-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Leave Statistics</h3>
                                    <p className="text-xs text-gray-500">All time data</p>
                                </div>
                            </div>
                            <button
                                onClick={() => exportToCSV(leaveReports.recentLeaves, 'leave_report')}
                                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Export to CSV"
                            >
                                <Download size={18} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                                        <p className="text-xs text-amber-700">Pending</p>
                                        <p className="text-xl font-bold text-amber-600">{leaveReports.statusBreakdown.pending}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg text-center">
                                        <p className="text-xs text-green-700">Approved</p>
                                        <p className="text-xl font-bold text-green-600">{leaveReports.statusBreakdown.approved}</p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg text-center">
                                        <p className="text-xs text-red-700">Rejected</p>
                                        <p className="text-xl font-bold text-red-600">{leaveReports.statusBreakdown.rejected}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">By Leave Type</h4>
                                    <div className="space-y-2">
                                        {Object.entries(leaveReports.typeBreakdown).map(([type, count]) => (
                                            <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                                                <span className="text-sm font-bold text-primary-600">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {leaveReports.topRequesters.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Top Leave Requesters</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {leaveReports.topRequesters.slice(0, 5).map((requester, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{requester.name}</p>
                                                        <p className="text-xs text-gray-500">{requester.department}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900">{requester.days} days</p>
                                                        <p className="text-xs text-gray-500">{requester.count} requests</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Department Reports */}
                {departmentReports && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Building2 className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Department Overview</h3>
                                    <p className="text-xs text-gray-500">Organizational breakdown</p>
                                </div>
                            </div>
                            <button
                                onClick={() => exportToCSV(departmentReports, 'department_report')}
                                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Export to CSV"
                            >
                                <Download size={18} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {departmentReports.map((dept, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900">{dept.name}</h4>
                                            <span className="text-sm font-bold text-primary-600">{dept.totalEmployees} employees</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Active:</span>
                                                <span className="font-bold text-green-600">{dept.activeEmployees}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Avg Salary:</span>
                                                <span className="font-bold text-gray-900">₹{dept.avgSalary.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Attendance:</span>
                                                <span className="font-bold text-blue-600">{dept.monthlyAttendance}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Pending Leaves:</span>
                                                <span className="font-bold text-orange-600">{dept.pendingLeaves}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;

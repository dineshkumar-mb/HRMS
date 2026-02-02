const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');

// @desc    Get overall statistics
// @route   GET /api/reports/overview
// @access  Private (Admin/HR)
const getOverallStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Employee stats
        const totalEmployees = await Employee.countDocuments();
        const activeEmployees = await Employee.countDocuments({ status: 'active' });
        const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });

        // Today's attendance
        const todayAttendance = await Attendance.countDocuments({ date: today });
        const attendanceRate = totalEmployees > 0
            ? ((todayAttendance / activeEmployees) * 100).toFixed(1)
            : 0;

        // Leave stats
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
        const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
        const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });

        // This month's stats
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyAttendance = await Attendance.countDocuments({
            date: { $gte: firstDayOfMonth }
        });
        const monthlyLeaves = await Leave.countDocuments({
            createdAt: { $gte: firstDayOfMonth }
        });

        res.json({
            success: true,
            data: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees
                },
                attendance: {
                    today: todayAttendance,
                    rate: attendanceRate,
                    monthly: monthlyAttendance
                },
                leaves: {
                    pending: pendingLeaves,
                    approved: approvedLeaves,
                    rejected: rejectedLeaves,
                    monthly: monthlyLeaves
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get employee reports
// @route   GET /api/reports/employees
// @access  Private (Admin/HR)
const getEmployeeReports = async (req, res, next) => {
    try {
        const employees = await Employee.find().populate('reportingManager', 'firstName lastName');

        // Group by department
        const byDepartment = {};
        const byDesignation = {};
        const byStatus = {};

        employees.forEach(emp => {
            // Department grouping
            if (!byDepartment[emp.department]) {
                byDepartment[emp.department] = 0;
            }
            byDepartment[emp.department]++;

            // Designation grouping
            if (!byDesignation[emp.designation]) {
                byDesignation[emp.designation] = 0;
            }
            byDesignation[emp.designation]++;

            // Status grouping
            if (!byStatus[emp.status]) {
                byStatus[emp.status] = 0;
            }
            byStatus[emp.status]++;
        });

        // Recent hires (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentHires = await Employee.find({
            dateOfJoining: { $gte: thirtyDaysAgo }
        }).select('firstName lastName department designation dateOfJoining').sort('-dateOfJoining');

        res.json({
            success: true,
            data: {
                total: employees.length,
                byDepartment,
                byDesignation,
                byStatus,
                recentHires,
                employees: employees.map(emp => ({
                    id: emp._id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    employeeId: emp.employeeId,
                    department: emp.department,
                    designation: emp.designation,
                    status: emp.status,
                    dateOfJoining: emp.dateOfJoining,
                    reportingManager: emp.reportingManager
                        ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`
                        : 'N/A',
                    // Include attendance and punch data for the last 7 days
                    attendance: attendanceMap.has(emp._id.toString()) ? Object.fromEntries(attendanceMap.get(emp._id.toString())) : {},
                    punchData: punchDataMap.has(emp._id.toString()) ? Object.fromEntries(punchDataMap.get(emp._id.toString())) : {}
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance reports
// @route   GET /api/reports/attendance
// @access  Private (Admin/HR)
const getAttendanceReports = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const today = new Date();
        const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
        const end = endDate ? new Date(endDate) : today;

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const attendanceRecords = await Attendance.find({
            date: { $gte: start, $lte: end }
        }).populate('employee', 'firstName lastName department');

        // Status breakdown
        const statusBreakdown = {
            present: 0,
            absent: 0,
            late: 0,
            'half-day': 0,
            'P/2': 0
        };

        // Daily attendance count
        const dailyAttendance = {};

        // Late arrivals
        const lateArrivals = [];

        // Average work hours
        let totalWorkHours = 0;
        let workHoursCount = 0;

        attendanceRecords.forEach(record => {
            // Status breakdown
            statusBreakdown[record.status]++;

            // Daily attendance
            const dateKey = record.date.toISOString().split('T')[0];
            if (!dailyAttendance[dateKey]) {
                dailyAttendance[dateKey] = 0;
            }
            dailyAttendance[dateKey]++;

            // Late arrivals
            if (record.status === 'late' || record.status === 'P/2') {
                lateArrivals.push({
                    employee: record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown',
                    department: record.employee?.department || 'N/A',
                    date: record.date,
                    checkInTime: record.checkIn?.time
                });
            }

            // Work hours
            if (record.workHours > 0) {
                totalWorkHours += record.workHours;
                workHoursCount++;
            }
        });

        const avgWorkHours = workHoursCount > 0 ? (totalWorkHours / workHoursCount).toFixed(2) : 0;

        // Get total active employees for attendance rate
        const activeEmployees = await Employee.countDocuments({ status: 'active' });
        const workingDays = Object.keys(dailyAttendance).length;
        const attendanceRate = workingDays > 0 && activeEmployees > 0
            ? ((attendanceRecords.length / (activeEmployees * workingDays)) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                dateRange: { start, end },
                totalRecords: attendanceRecords.length,
                statusBreakdown,
                dailyAttendance,
                lateArrivals: lateArrivals.slice(0, 20), // Top 20 late arrivals
                avgWorkHours,
                attendanceRate
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leave reports
// @route   GET /api/reports/leaves
// @access  Private (Admin/HR)
const getLeaveReports = async (req, res, next) => {
    try {
        const leaves = await Leave.find().populate('employee', 'firstName lastName department');

        // Status breakdown
        const statusBreakdown = {
            pending: 0,
            approved: 0,
            rejected: 0
        };

        // Leave type breakdown
        const typeBreakdown = {
            casual: 0,
            sick: 0,
            paid: 0,
            unpaid: 0
        };

        // Monthly trends (last 6 months)
        const monthlyTrends = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Top leave requesters
        const employeeLeaveCount = {};

        leaves.forEach(leave => {
            // Status breakdown
            statusBreakdown[leave.status]++;

            // Type breakdown
            typeBreakdown[leave.leaveType]++;

            // Monthly trends
            if (leave.createdAt >= sixMonthsAgo) {
                const monthKey = leave.createdAt.toISOString().substring(0, 7); // YYYY-MM
                if (!monthlyTrends[monthKey]) {
                    monthlyTrends[monthKey] = 0;
                }
                monthlyTrends[monthKey]++;
            }

            // Employee leave count
            if (leave.employee) {
                const empName = `${leave.employee.firstName} ${leave.employee.lastName}`;
                if (!employeeLeaveCount[empName]) {
                    employeeLeaveCount[empName] = {
                        name: empName,
                        department: leave.employee.department,
                        count: 0,
                        days: 0
                    };
                }
                employeeLeaveCount[empName].count++;
                employeeLeaveCount[empName].days += leave.days;
            }
        });

        // Sort top leave requesters
        const topRequesters = Object.values(employeeLeaveCount)
            .sort((a, b) => b.days - a.days)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                total: leaves.length,
                statusBreakdown,
                typeBreakdown,
                monthlyTrends,
                topRequesters,
                recentLeaves: leaves
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 20)
                    .map(leave => ({
                        id: leave._id,
                        employee: leave.employee
                            ? `${leave.employee.firstName} ${leave.employee.lastName}`
                            : 'Unknown',
                        department: leave.employee?.department || 'N/A',
                        leaveType: leave.leaveType,
                        startDate: leave.startDate,
                        endDate: leave.endDate,
                        days: leave.days,
                        status: leave.status,
                        createdAt: leave.createdAt
                    }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get department reports
// @route   GET /api/reports/departments
// @access  Private (Admin/HR)
const getDepartmentReports = async (req, res, next) => {
    try {
        const employees = await Employee.find();
        const departments = {};

        // Aggregate data by department
        for (const emp of employees) {
            if (!departments[emp.department]) {
                departments[emp.department] = {
                    name: emp.department,
                    totalEmployees: 0,
                    activeEmployees: 0,
                    avgSalary: 0,
                    totalSalary: 0,
                    designations: {}
                };
            }

            const dept = departments[emp.department];
            dept.totalEmployees++;

            if (emp.status === 'active') {
                dept.activeEmployees++;
            }

            // Calculate salary (basic + hra + allowances - deductions)
            if (emp.salary) {
                const totalSalary = (emp.salary.basic || 0) +
                    (emp.salary.hra || 0) +
                    (emp.salary.allowances || 0) -
                    (emp.salary.deductions || 0);
                dept.totalSalary += totalSalary;
            }

            // Designation breakdown
            if (!dept.designations[emp.designation]) {
                dept.designations[emp.designation] = 0;
            }
            dept.designations[emp.designation]++;
        }

        // Calculate average salary
        Object.values(departments).forEach(dept => {
            dept.avgSalary = dept.totalEmployees > 0
                ? Math.round(dept.totalSalary / dept.totalEmployees)
                : 0;
        });

        // Get attendance and leave stats by department
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        for (const deptName in departments) {
            const deptEmployees = employees
                .filter(e => e.department === deptName)
                .map(e => e._id);

            // Monthly attendance
            const monthlyAttendance = await Attendance.countDocuments({
                employee: { $in: deptEmployees },
                date: { $gte: firstDayOfMonth }
            });

            // Pending leaves
            const pendingLeaves = await Leave.countDocuments({
                employee: { $in: deptEmployees },
                status: 'pending'
            });

            departments[deptName].monthlyAttendance = monthlyAttendance;
            departments[deptName].pendingLeaves = pendingLeaves;
        }

        res.json({
            success: true,
            data: Object.values(departments)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get monthly attendance grid for all employees
// @route   GET /api/reports/attendance-grid
// @access  Private (Admin/HR)
const getAttendanceMonthlyGrid = async (req, res, next) => {
    try {
        const { month, department, designation } = req.query; // format: YYYY-MM
        if (!month) {
            res.status(400);
            return next(new Error('Please provide month (YYYY-MM)'));
        }

        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        const filter = { status: 'active' };
        if (department && department !== 'Select Department') filter.department = department;
        if (designation && designation !== 'Select Designation') filter.designation = designation;

        // If regular employee, only show their own record
        if (req.user.role === 'employee') {
            filter._id = req.user.employee;
        }

        const employees = await Employee.find(filter).select('firstName lastName employeeId department designation');
        const attendance = await Attendance.find({
            date: { $gte: startDate, $lte: endDate }
        });
        const leaves = await Leave.find({
            status: 'approved',
            $or: [
                { startDate: { $gte: startDate, $lte: endDate } },
                { endDate: { $gte: startDate, $lte: endDate } },
                { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
            ]
        });
        const holidays = await Holiday.find({
            date: { $gte: startDate, $lte: endDate }
        });

        const grid = employees.map(emp => {
            const empAttendance = attendance.filter(a => a.employee.toString() === emp._id.toString());
            const empLeaves = leaves.filter(l => l.employee.toString() === emp._id.toString());

            const stats = {};
            const punchData = {};
            const numDays = endDate.getDate();

            for (let day = 1; day <= numDays; day++) {
                const currentDate = new Date(year, monthNum - 1, day);
                const dateKey = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())).toISOString();

                // Default: Absent (A)
                let status = 'A';

                // Check Weekend (W)
                if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                    status = 'W';
                }

                // Check Holiday (H)
                const targetDateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
                const isHoliday = holidays.find(h => new Date(h.date).toLocaleDateString('en-CA') === targetDateStr);
                if (isHoliday) status = 'H';

                // Check Leave (EL/SL etc)
                const onLeave = empLeaves.find(l => {
                    const lStart = new Date(l.startDate);
                    const lEnd = new Date(l.endDate);
                    lStart.setHours(0, 0, 0, 0);
                    lEnd.setHours(23, 59, 59, 999);
                    return currentDate >= lStart && currentDate <= lEnd;
                });
                if (onLeave) status = 'L'; // General "L" for leave

                // Check Attendance (P / P/2)
                const record = empAttendance.find(a => new Date(a.date).toLocaleDateString('en-CA') === targetDateStr);
                let punchInfo = null;
                if (record) {
                    if (record.status === 'present') status = 'P';
                    else if (record.status === 'P/2') status = 'P/2';
                    else if (record.status === 'late') status = 'LT';
                    else if (record.status === 'absent') status = 'A';
                    else status = 'P'; // Default for any log exists

                    punchInfo = {
                        in: record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : null,
                        out: record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : null,
                        location: !!(record.checkIn?.location?.lat || record.checkOut?.location?.lat)
                    };
                }

                stats[day] = status;
                punchData[day] = punchInfo;
            }

            return {
                id: emp._id,
                name: `${emp.firstName} ${emp.lastName}`,
                employeeId: emp.employeeId,
                department: emp.department,
                designation: emp.designation,
                attendance: stats,
                punchData: punchData
            };
        });

        res.json({
            success: true,
            data: grid
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverallStats,
    getEmployeeReports,
    getAttendanceReports,
    getLeaveReports,
    getDepartmentReports,
    getAttendanceMonthlyGrid
};

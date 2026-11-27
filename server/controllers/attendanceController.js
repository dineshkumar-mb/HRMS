const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Check-in
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
    try {
        const { location } = req.body;
        const employee = await Employee.findOne({ _id: req.user.employee });

        if (!employee) {
            res.status(404);
            return next(new Error('Employee profile not found for this user'));
        }

        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        const attendanceExists = await Attendance.findOne({
            employee: employee._id,
            date: today
        });

        if (attendanceExists) {
            res.status(400);
            return next(new Error('Already checked in for today'));
        }

        const checkInTime = new Date();
        const hours = checkInTime.getHours();
        const minutes = checkInTime.getMinutes();

        let status = 'present';

        // Check for approved permission today
        const Permission = require('../models/Permission');
        const permission = await Permission.findOne({
            employee: employee._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
            status: 'approved'
        });

        const isMorningPermission = permission && permission.type === 'morning';
        const lateThresholdHours = isMorningPermission ? 11 : 9;
        const lateThresholdMins = 15;

        if (hours > lateThresholdHours || (hours === lateThresholdHours && minutes > lateThresholdMins)) {
            status = 'P/2';
        }

        // Check for Holiday
        const isHoliday = await Holiday.findOne({ date: today });
        if (isHoliday) {
            status = 'present';
        }

        // Saturday/Sunday handling: "weekly half"
        const day = today.getDay(); // 0 = Sunday, 6 = Saturday
        if (day === 0 || day === 6) {
            if (status === 'present') status = 'half-day';
        }

        const attendance = await Attendance.create({
            employee: employee._id,
            date: today,
            checkIn: {
                time: checkInTime,
                location,
                ip: req.ip
            },
            status: status
        });

        // Earned Leave (EL) generation: +1 EL for every 20 working days without taking leave
        const isWorkingDay = day !== 0 && day !== 6 && !isHoliday;
        if (isWorkingDay) {
            const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const onApprovedLeave = await Leave.findOne({
                employee: employee._id,
                status: 'approved',
                startDate: { $lt: endOfToday },
                endDate: { $gte: today }
            });

            if (!employee.earnedLeaveProgress) {
                employee.earnedLeaveProgress = { consecutiveWorkingDays: 0, totalElEarned: 0 };
            }

            const alreadyProcessedToday = employee.earnedLeaveProgress.lastProcessedDate &&
                new Date(employee.earnedLeaveProgress.lastProcessedDate).getTime() === today.getTime();

            if (!onApprovedLeave && !alreadyProcessedToday) {
                employee.earnedLeaveProgress.consecutiveWorkingDays += 1;
                employee.earnedLeaveProgress.lastProcessedDate = today;

                if (employee.earnedLeaveProgress.consecutiveWorkingDays >= 20) {
                    const earnedCount = Math.floor(employee.earnedLeaveProgress.consecutiveWorkingDays / 20);
                    employee.leaveBalances.earned = (employee.leaveBalances.earned || 0) + earnedCount;
                    employee.earnedLeaveProgress.consecutiveWorkingDays =
                        employee.earnedLeaveProgress.consecutiveWorkingDays % 20;
                    employee.earnedLeaveProgress.totalElEarned =
                        (employee.earnedLeaveProgress.totalElEarned || 0) + earnedCount;
                    employee.earnedLeaveProgress.lastEarnedAt = new Date();

                    const linkedUser = await User.findOne({ employee: employee._id });
                    if (linkedUser) {
                        await Notification.create({
                            user: linkedUser._id,
                            title: 'Earned Leave Credited',
                            message: `You completed 20 working days without taking leave and earned +${earnedCount} Earned Leave (EL).`,
                            type: 'success'
                        });
                    }
                }

                await employee.save();
            }
        }

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Check-out
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
    try {
        const { location } = req.body;
        const employee = await Employee.findOne({ _id: req.user.employee });

        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        const attendance = await Attendance.findOne({
            employee: employee._id,
            date: today
        });

        if (!attendance) {
            res.status(400);
            return next(new Error('No check-in record found for today'));
        }

        if (attendance.checkOut && attendance.checkOut.time) {
            res.status(400);
            return next(new Error('Already checked out for today'));
        }

        attendance.checkOut = {
            time: new Date(),
            location,
            ip: req.ip
        };

        // Calculate work hours
        const diff = attendance.checkOut.time - attendance.checkIn.time;
        attendance.workHours = diff / (1000 * 60 * 60); // Convert to hours

        await attendance.save();

        res.json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my attendance
// @route   GET /api/attendance/me
// @access  Private
const getMyAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.find({ employee: req.user.employee }).sort('-date');
        res.json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Raise correction query for missing log
// @route   POST /api/attendance/query
// @access  Private
const raiseCorrectionQuery = async (req, res, next) => {
    try {
        const { date, reason, type } = req.body; // type: 'login' or 'logout'
        const employee = await Employee.findOne({ _id: req.user.employee });

        const dateObj = new Date(date);
        const queryDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));

        let attendance = await Attendance.findOne({
            employee: employee._id,
            date: queryDate
        });

        if (!attendance) {
            // Create a skeleton record if it doesn't exist
            attendance = await Attendance.create({
                employee: employee._id,
                date: queryDate,
                status: 'absent'
            });
        }

        attendance.isCorrectionRequested = true;
        attendance.correctionReason = reason;
        await attendance.save();

        res.json({ success: true, message: 'Correction query raised successfully', data: attendance });
    } catch (error) {
        next(error);
    }
};

module.exports = { checkIn, checkOut, getMyAttendance, raiseCorrectionQuery };

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        // Calculate days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const leave = await Leave.create({
            employee: req.user.employee,
            leaveType,
            startDate,
            endDate,
            days,
            reason
        });

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all leaves (for HR/Admin) or filtered by status
// @route   GET /api/leaves
// @access  Private (HR/Admin/Manager)
const getLeaves = async (req, res, next) => {
    try {
        let query;
        if (req.user.role === 'manager') {
            // Find employees reporting to this manager
            const subordinates = await Employee.find({ reportingManager: req.user.employee }).select('_id');
            const subIds = subordinates.map(s => s._id);
            query = Leave.find({ employee: { $in: subIds } });
        } else if (req.user.role === 'employee') {
            // Only show leaves for the logged in employee
            query = Leave.find({ employee: req.user.employee });
        } else {
            query = Leave.find();
        }

        const leaves = await query.populate('employee', 'firstName lastName department');
        res.json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        next(error);
    }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leaves/:id
// @access  Private (HR/Admin/Manager)
const updateLeaveStatus = async (req, res, next) => {
    try {
        const { status, comments } = req.body;
        let leave = await Leave.findById(req.params.id);

        if (!leave) {
            res.status(404);
            return next(new Error('Leave request not found'));
        }

        // Ownership check: Employees can only cancel their own leaves
        if (req.user.role === 'employee') {
            if (leave.employee.toString() !== req.user.employee.toString()) {
                res.status(403);
                return next(new Error('Not authorized to update this leave request'));
            }
            if (status !== 'cancelled') {
                res.status(400);
                return next(new Error('Employees can only cancel their leave requests'));
            }
        }

        const prevStatus = leave.status;

        if (status === 'approved' && prevStatus !== 'approved') {
            const employee = await Employee.findById(leave.employee);
            if (employee && employee.leaveBalances) {
                const leaveType = leave.leaveType;
                const daysToDeduct = leave.days;

                if (employee.leaveBalances[leaveType] < daysToDeduct && leaveType !== 'unpaid') {
                    res.status(400);
                    return next(new Error(`Insufficient ${leaveType} leave balance`));
                }

                employee.leaveBalances[leaveType] -= daysToDeduct;
                await employee.save();
            }
        } else if ((status === 'cancelled' || status === 'rejected') && prevStatus === 'approved') {
            const employee = await Employee.findById(leave.employee);
            if (employee && employee.leaveBalances) {
                const leaveType = leave.leaveType;
                const daysToRestore = leave.days;

                employee.leaveBalances[leaveType] += daysToRestore;
                await employee.save();
            }
        }

        leave.status = status;
        leave.comments = comments;
        leave.approvedBy = req.user.employee;

        await leave.save();

        res.json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

module.exports = { applyLeave, getLeaves, updateLeaveStatus };

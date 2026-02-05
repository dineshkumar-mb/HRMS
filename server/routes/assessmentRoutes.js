const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middlewares/authMiddleware');

// @desc    Get all assessments (or generate placeholders)
// @route   GET /api/assessments
// @access  Private (Admin/HR/Manager can view all, Employee can view own)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // If employee, only show their own
        if (req.user.role === 'employee') {
            const employee = await Employee.findOne({ email: req.user.email });
            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            query = { employee: employee._id };
        }

        // For Admin/HR, we might want to see a list of ALL employees with their current assessment status
        // So we first fetch all employees, then find assessments for them
        // This is simplified for the list view

        if (req.user.role === 'admin' || req.user.role === 'hr') {
            // Fetch all employees first and populate reporting manager
            const employees = await Employee.find({ status: 'active' })
                .select('firstName lastName department designation reportingManager status employeeId dateOfJoining')
                .populate('reportingManager', 'firstName lastName');

            // Fetch assessments for the current period (e.g., current quarter)
            const date = new Date();
            const quarter = Math.floor((date.getMonth() + 3) / 3);
            const currentPeriod = `Q${quarter} ${date.getFullYear()}`;

            const assessments = await Assessment.find({ period: currentPeriod });

            // Map assessments to employees
            const results = employees.map(emp => {
                const assessment = assessments.find(a => a.employee.toString() === emp._id.toString());
                return {
                    _id: assessment ? assessment._id : `temp_${emp._id}`, // Temp ID if no assessment yet
                    employeeId: emp._id,
                    employeeDetails: emp,
                    period: currentPeriod,
                    status: assessment ? assessment.status : 'Pending', // Default to Pending
                    lastUpdated: assessment ? assessment.updatedAt : null
                };
            });

            return res.status(200).json({
                success: true,
                count: results.length,
                data: results
            });
        }

        // Fallback for strict filtering or specific queries if needed later
        const assessments = await Assessment.find(query).populate('employee', 'firstName lastName department designation employeeId');

        res.status(200).json({
            success: true,
            count: assessments.length,
            data: assessments
        });

    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Create or Update Assessment
// @route   POST /api/assessments
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { employeeId, period, status, selfRating, selfComments, managerRating, managerComments } = req.body;

        // Determine employee ID (if admin/hr is setting it, or use logged in user's employee ID)
        let targetEmployeeId = employeeId;
        if (!targetEmployeeId && req.user.role === 'employee') {
            const employee = await Employee.findOne({ email: req.user.email });
            if (employee) targetEmployeeId = employee._id;
        }

        if (!targetEmployeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID required' });
        }

        let assessment = await Assessment.findOne({
            employee: targetEmployeeId,
            period: period || { $exists: true } // Simplified for now, usually fixed period
        });

        if (assessment) {
            // Update
            assessment.status = status || assessment.status;
            assessment.selfRating = selfRating || assessment.selfRating;
            assessment.selfComments = selfComments || assessment.selfComments;
            assessment.managerRating = managerRating || assessment.managerRating;
            assessment.managerComments = managerComments || assessment.managerComments;
            if (status === 'Submitted') assessment.submittedAt = Date.now();
            if (status === 'Reviewed') assessment.reviewedAt = Date.now();

            await assessment.save();
        } else {
            // Create
            assessment = await Assessment.create({
                employee: targetEmployeeId,
                period,
                status: status || 'Pending',
                selfRating,
                selfComments,
                managerRating,
                managerComments
            });
        }

        res.status(201).json({
            success: true,
            data: assessment
        });

    } catch (error) {
        console.error('Error saving assessment:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;

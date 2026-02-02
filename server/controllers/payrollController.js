const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Generate payroll for a month
// @route   POST /api/payroll/generate
// @access  Private (Admin/HR)
const generatePayroll = async (req, res, next) => {
    try {
        const { month, year } = req.body;
        const employees = await Employee.find({ status: 'active' });

        const results = [];
        for (const emp of employees) {
            if (!emp.salary?.basic) continue;

            const basic = emp.salary.basic;
            const hra = emp.salary.hra || 0;
            const allowances = emp.salary.allowances || 0;
            const deductions = emp.salary.deductions || 0;

            const pf = basic * 0.12; // Standard 12% PF
            const tds = (basic + hra + allowances) * 0.10; // Simplified 10% TDS

            const netSalary = (basic + hra + allowances) - (deductions + pf + tds);

            const payroll = await Payroll.findOneAndUpdate(
                { employee: emp._id, month, year },
                {
                    salaryComponents: { basic, hra, allowances, deductions, tds, pf },
                    netSalary,
                    status: 'processed'
                },
                { upsert: true, new: true }
            );
            results.push(payroll);
        }

        res.status(201).json({ success: true, count: results.length, data: results });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my payroll history
// @route   GET /api/payroll/me
// @access  Private
const getMyPayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.find({ employee: req.user.employee }).sort('-year -month');
        res.json({ success: true, data: payroll });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payroll for a period
// @route   GET /api/payroll
// @access  Private (Admin/HR)
const getAllPayroll = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const payroll = await Payroll.find({ month, year }).populate('employee', 'firstName lastName department employeeId');
        res.json({ success: true, data: payroll });
    } catch (error) {
        next(error);
    }
};

module.exports = { generatePayroll, getMyPayroll, getAllPayroll };

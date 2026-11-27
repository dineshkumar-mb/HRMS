const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (HR/Admin/Manager)
const getEmployees = async (req, res, next) => {
    try {
        const employees = await Employee.find().populate('reportingManager', 'firstName lastName');
        res.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id).populate('reportingManager', 'firstName lastName');
        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (HR/Admin)
const createEmployee = async (req, res, next) => {
    try {
        const { email, password, role, ...employeeData } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            return next(new Error('User with this email already exists'));
        }

        // Create Employee
        const employee = await Employee.create({
            ...employeeData,
            email // Ensure email is saved in Employee model
        });

        // Create linked User account
        const user = await User.create({
            email,
            password: password || 'Welcome@123', // Default password if not provided
            role: role || 'employee',
            employee: employee._id
        });

        res.status(201).json({
            success: true,
            data: {
                employee,
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (HR/Admin/Manager)
const updateEmployee = async (req, res, next) => {
    try {
        let employee = await Employee.findById(req.params.id);
        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        const isPrivileged = ['admin', 'hr', 'manager'].includes(req.user.role);
        const isOwnEmployee = req.user.employee && req.user.employee.toString() === req.params.id;
        if (!isPrivileged) {
            if (!isOwnEmployee) {
                res.status(403);
                return next(new Error('Not authorized to update this employee'));
            }
            // Regular employees may only update their own profile photo
            if (req.body.profilePhoto === undefined) {
                res.status(403);
                return next(new Error('Not authorized to update employee details'));
            }
            employee = await Employee.findByIdAndUpdate(
                req.params.id,
                { profilePhoto: req.body.profilePhoto },
                { new: true, runValidators: true }
            );
            return res.json({ success: true, data: employee });
        }

        const oldEmail = employee.email;
        const { email, role, ...updateData } = req.body;

        // Update Employee
        employee = await Employee.findByIdAndUpdate(req.params.id, {
            ...updateData,
            email: email || oldEmail
        }, {
            new: true,
            runValidators: true
        });

        // Sync with User account if email or role changed
        if (email || role) {
            let user = await User.findOne({ employee: employee._id });

            if (user) {
                // Update existing user
                if (email) user.email = email;
                if (role) user.role = role;
                await user.save();
            } else if (email) {
                // Create user if not exists but email is provided
                await User.create({
                    email,
                    password: 'Welcome@123', // Default password
                    role: role || 'employee',
                    employee: employee._id
                });
            }
        }

        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard highlights (Birthdays, Anniversaries, New Joiners)
// @route   GET /api/employees/highlights
// @access  Private
const getDashboardHighlights = async (req, res, next) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        // 1. New Joiners (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const newJoiners = await Employee.find({
            dateOfJoining: { $gte: thirtyDaysAgo },
            status: 'active'
        }).select('firstName lastName designation department profilePhoto dateOfJoining');

        // Helper to get month/day pair
        const getMD = (d) => ({ m: d.getMonth() + 1, d: d.getDate() });
        const targets = [
            getMD(today),
            getMD(new Date(today.getTime() - 86400000)), // yesterday
            getMD(new Date(today.getTime() + 86400000))  // tomorrow
        ];

        // 2. Birthdays
        const birthdays = await Employee.find({
            status: 'active',
            $expr: {
                $or: targets.map(t => ({
                    $and: [
                        { $eq: [{ $month: '$dob' }, t.m] },
                        { $eq: [{ $dayOfMonth: '$dob' }, t.d] }
                    ]
                }))
            }
        }).select('_id firstName lastName designation department profilePhoto dob');

        const uniqueBirthdays = Array.from(new Set(birthdays.map(a => a._id.toString())))
            .map(id => birthdays.find(a => a._id.toString() === id));

        console.log('Dashboard Highlights Debug:');
        console.log('- Targets:', JSON.stringify(targets));
        console.log('- Birthday Matches Found:', birthdays.length);
        console.log('- Unique Birthdays:', uniqueBirthdays.map(b => `${b.firstName} ${b.lastName} (${b.dob})`));

        // 3. Anniversaries
        const anniversaries = await Employee.find({
            status: 'active',
            $expr: {
                $or: targets.map(t => ({
                    $and: [
                        { $eq: [{ $month: '$dateOfJoining' }, t.m] },
                        { $eq: [{ $dayOfMonth: '$dateOfJoining' }, t.d] },
                        { $ne: [{ $year: '$dateOfJoining' }, today.getFullYear()] }
                    ]
                }))
            }
        }).select('firstName lastName designation department profilePhoto dateOfJoining');

        res.json({
            success: true,
            data: {
                newJoiners,
                birthdays: uniqueBirthdays,
                anniversaries
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
const deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        // Delete associated User account
        await User.findOneAndDelete({ employee: employee._id });

        // Delete Employee
        await employee.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add document to employee
// @route   POST /api/employees/:id/documents
// @access  Private (Admin/HR/Manager or self)
const addEmployeeDocument = async (req, res, next) => {
    try {
        const isPrivileged = ['admin', 'hr', 'manager'].includes(req.user.role);
        const isOwn = req.user.employee && req.user.employee.toString() === req.params.id;
        if (!isPrivileged && !isOwn) {
            res.status(403);
            return next(new Error('Not authorized to add documents for this employee'));
        }

        const { name, url, type } = req.body;
        if (!name || !url) {
            res.status(400);
            return next(new Error('Document name and file/URL are required'));
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        employee.documents.push({ name, url, type: type || 'other' });
        await employee.save();

        res.status(201).json({ success: true, data: employee.documents });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document from employee
// @route   DELETE /api/employees/:id/documents/:docId
// @access  Private (Admin/HR/Manager or self)
const deleteEmployeeDocument = async (req, res, next) => {
    try {
        const isPrivileged = ['admin', 'hr', 'manager'].includes(req.user.role);
        const isOwn = req.user.employee && req.user.employee.toString() === req.params.id;
        if (!isPrivileged && !isOwn) {
            res.status(403);
            return next(new Error('Not authorized to delete documents for this employee'));
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        employee.documents = employee.documents.filter(d => d._id.toString() !== req.params.docId);
        await employee.save();

        res.json({ success: true, data: employee.documents });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDashboardHighlights,
    addEmployeeDocument,
    deleteEmployeeDocument
};

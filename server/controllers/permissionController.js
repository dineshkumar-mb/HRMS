const Permission = require('../models/Permission');
const Employee = require('../models/Employee');

// @desc    Get my permissions
// @route   GET /api/permissions/me
// @access  Private
exports.getMyPermissions = async (req, res, next) => {
    try {
        const permissions = await Permission.find({ employee: req.user.employee }).sort('-createdAt');
        res.json({ success: true, count: permissions.length, data: permissions });
    } catch (error) {
        next(error);
    }
};

// @desc    Apply for permission
// @route   POST /api/permissions
// @access  Private
exports.applyPermission = async (req, res, next) => {
    try {
        const { date, type, reason } = req.body;
        const employeeId = req.user.employee;

        const permissionDate = new Date(date);
        const startOfMonth = new Date(permissionDate.getFullYear(), permissionDate.getMonth(), 1);
        const endOfMonth = new Date(permissionDate.getFullYear(), permissionDate.getMonth() + 1, 0, 23, 59, 59);

        // Rule: Only one approved/pending permission per month
        const existingPermission = await Permission.findOne({
            employee: employeeId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: ['pending', 'approved'] }
        });

        if (existingPermission) {
            res.status(400);
            return next(new Error('You have already applied for/used your monthly permission.'));
        }

        const permission = await Permission.create({
            employee: employeeId,
            date: permissionDate,
            type,
            reason
        });

        res.status(201).json({ success: true, data: permission });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all permissions (Admin/HR)
// @route   GET /api/permissions
// @access  Private/Admin/HR
exports.getAllPermissions = async (req, res, next) => {
    try {
        const permissions = await Permission.find()
            .populate('employee', 'firstName lastName employeeId department')
            .sort('-createdAt');
        res.json({ success: true, count: permissions.length, data: permissions });
    } catch (error) {
        next(error);
    }
};

// @desc    Update permission status
// @route   PUT /api/permissions/:id
// @access  Private/Admin/HR
exports.updatePermissionStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const permission = await Permission.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

        if (!permission) {
            res.status(404);
            return next(new Error('Permission not found'));
        }

        res.json({ success: true, data: permission });
    } catch (error) {
        next(error);
    }
};

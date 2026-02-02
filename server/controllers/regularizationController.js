const Regularization = require('../models/Regularization');
const Employee = require('../models/Employee');

// @desc    Get all regularization requests for logged in employee
// @route   GET /api/regularization/me
// @access  Private
exports.getMyRegularizations = async (req, res, next) => {
    try {
        const regularizations = await Regularization.find({ employee: req.user.employee })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: regularizations.length,
            data: regularizations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a regularization request
// @route   POST /api/regularization
// @access  Private
exports.createRegularization = async (req, res, next) => {
    try {
        req.body.employee = req.user.employee;

        const regularization = await Regularization.create(req.body);

        res.status(201).json({
            success: true,
            data: regularization
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all regularization requests (Admin/HR)
// @route   GET /api/regularization
// @access  Private/Admin/HR
exports.getAllRegularizations = async (req, res, next) => {
    try {
        const regularizations = await Regularization.find()
            .populate({
                path: 'employee',
                select: 'firstName lastName employeeId department'
            })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: regularizations.length,
            data: regularizations
        });
    } catch (error) {
        next(error);
    }
};

const Attendance = require('../models/Attendance');

exports.updateRegularizationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        let regularization = await Regularization.findById(req.params.id);

        if (!regularization) {
            res.status(404);
            return next(new Error('Regularization request not found'));
        }

        regularization.status = status;
        await regularization.save();

        // If approved, update or create Attendance record
        if (status === 'accepted') {
            const rDate = new Date(regularization.attendanceDate);
            const date = new Date(Date.UTC(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()));

            let attendance = await Attendance.findOne({
                employee: regularization.employee,
                date: date
            });

            if (!attendance) {
                attendance = new Attendance({
                    employee: regularization.employee,
                    date: date,
                    status: 'present'
                });
            }

            // Simple logic: set standard times if provided in request, otherwise just mark present
            if (regularization.type === 'mis-punch') {
                if (regularization.startTime) {
                    const [h, m] = regularization.startTime.split(':');
                    const checkIn = new Date(date);
                    checkIn.setHours(h, m, 0, 0);
                    attendance.checkIn = { time: checkIn, address: 'Regularized' };
                }
                if (regularization.endTime) {
                    const [h, m] = regularization.endTime.split(':');
                    const checkOut = new Date(date);
                    checkOut.setHours(h, m, 0, 0);
                    attendance.checkOut = { time: checkOut, address: 'Regularized' };
                }
            }

            attendance.status = 'present';
            await attendance.save();
        }

        res.status(200).json({
            success: true,
            data: regularization
        });
    } catch (error) {
        next(error);
    }
};

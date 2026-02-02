const Holiday = require('../models/Holiday');

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Public
const getHolidays = async (req, res, next) => {
    try {
        const holidays = await Holiday.find().sort('date');
        res.json({ success: true, count: holidays.length, data: holidays });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a holiday
// @route   POST /api/holidays
// @access  Private (Admin/HR)
const createHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.create(req.body);
        res.status(201).json({ success: true, data: holiday });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a holiday
// @route   DELETE /api/holidays/:id
// @access  Private (Admin)
const deleteHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            res.status(404);
            return next(new Error('Holiday not found'));
        }
        await holiday.deleteOne();
        res.json({ success: true, message: 'Holiday removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHolidays, createHoliday, deleteHoliday };

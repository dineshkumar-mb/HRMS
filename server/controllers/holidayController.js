const Holiday = require('../models/Holiday');

const DEFAULT_HOLIDAYS = [
    { name: 'New Year Day', month: 0, day: 1, type: 'national' },
    { name: 'Republic Day', month: 0, day: 26, type: 'national' },
    { name: 'Holi', month: 2, day: 14, type: 'national' },
    { name: 'Independence Day', month: 7, day: 15, type: 'national' },
    { name: 'Gandhi Jayanti', month: 9, day: 2, type: 'national' },
    { name: 'Diwali', month: 9, day: 21, type: 'national' },
    { name: 'Christmas', month: 11, day: 25, type: 'national' },
];

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

// @desc    Update a holiday
// @route   PUT /api/holidays/:id
// @access  Private (Admin/HR)
const updateHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!holiday) {
            res.status(404);
            return next(new Error('Holiday not found'));
        }
        res.json({ success: true, data: holiday });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a holiday
// @route   DELETE /api/holidays/:id
// @access  Private (Admin/HR)
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

// @desc    Seed default holidays for current and next year
// @route   POST /api/holidays/seed-defaults
// @access  Private (Admin/HR)
const seedDefaultHolidays = async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();
        const years = [currentYear, currentYear + 1];
        const existing = await Holiday.find();
        const existingKeys = new Set(
            existing.map(h => `${h.name}|${new Date(h.date).toISOString().slice(0, 10)}`)
        );

        const toInsert = [];
        for (const year of years) {
            for (const h of DEFAULT_HOLIDAYS) {
                const date = new Date(Date.UTC(year, h.month, h.day));
                const key = `${h.name}|${date.toISOString().slice(0, 10)}`;
                if (!existingKeys.has(key)) {
                    toInsert.push({ name: h.name, date, type: h.type });
                }
            }
        }

        if (toInsert.length > 0) {
            await Holiday.insertMany(toInsert);
        }

        const holidays = await Holiday.find().sort('date');
        res.status(201).json({ success: true, count: holidays.length, data: holidays });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHolidays, createHoliday, updateHoliday, deleteHoliday, seedDefaultHolidays };

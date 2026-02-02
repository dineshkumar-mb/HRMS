const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        time: Date,
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        ip: String
    },
    checkOut: {
        time: Date,
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        ip: String
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day', 'P/2'],
        default: 'absent'
    },
    isCorrectionRequested: {
        type: Boolean,
        default: false
    },
    correctionReason: String,
    workHours: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

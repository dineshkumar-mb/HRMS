const mongoose = require('mongoose');

const regularizationSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    attendanceDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['mis-punch', 'late-entry', 'early-exit', 'other'],
        default: 'mis-punch'
    },
    reason: {
        type: String,
        required: [true, 'Please add a reason']
    },
    startTime: String, // For mis-punch/correction
    endTime: String,   // For mis-punch/correction
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Regularization', regularizationSchema);

const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    title: {
        type: String,
        default: 'Self-Assessment'
    },
    period: {
        type: String, // e.g., "Q1 2024", "Annual 2024"
        required: true,
        default: () => {
            const date = new Date();
            const quarter = Math.floor((date.getMonth() + 3) / 3);
            return `Q${quarter} ${date.getFullYear()}`;
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Submitted', 'Reviewed'],
        default: 'Pending'
    },
    selfRating: {
        type: Number,
        min: 1,
        max: 5
    },
    selfComments: String,
    managerRating: {
        type: Number,
        min: 1,
        max: 5
    },
    managerComments: String,
    submittedAt: Date,
    reviewedAt: Date
}, {
    timestamps: true
});

// Ensure one assessment per employee per period
assessmentSchema.index({ employee: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Assessment', assessmentSchema);

const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    salaryComponents: {
        basic: Number,
        hra: Number,
        allowances: Number,
        deductions: Number,
        tds: Number,
        pf: Number
    },
    netSalary: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processed', 'paid'],
        default: 'pending'
    },
    paidAt: Date,
    payslipUrl: String,
    isLocked: { type: Boolean, default: false }
}, {
    timestamps: true
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);

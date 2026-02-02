const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    // Personal Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: Date,
    phoneNumber: String,
    address: String,
    profilePhoto: String,

    // Job Info
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    reportingManager: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
    dateOfJoining: { type: Date, default: Date.now },
    salary: {
        basic: Number,
        hra: Number,
        allowances: Number,
        deductions: Number
    },
    status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },

    // Documents
    documents: [{
        name: String,
        url: String,
        type: String
    }],

    // Leave Balances
    leaveBalances: {
        casual: { type: Number, default: 24 },
        sick: { type: Number, default: 15 },
        earned: { type: Number, default: 20 },
        unpaid: { type: Number, default: 0 },
        paternity: { type: Number, default: 15 },
        bereavement: { type: Number, default: 10 }
    },
    faceDescriptor: {
        type: [Number],
        default: undefined
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);

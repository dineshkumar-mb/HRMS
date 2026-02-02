const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const totalEmployees = await Employee.countDocuments();
        const activeEmployees = await Employee.find({ status: 'active' });

        console.log('Total Employees:', totalEmployees);
        console.log('Active Employees Count:', activeEmployees.length);
        activeEmployees.forEach(emp => {
            console.log(`- ${emp.firstName} ${emp.lastName} (${emp.email}) - Status: ${emp.status}, Dept: ${emp.department}`);
        });

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const attendanceCount = await Attendance.countDocuments({
            date: { $gte: startOfMonth }
        });
        console.log('Attendance Records this month:', attendanceCount);

        const sampleAttendance = await Attendance.find().sort('-createdAt').limit(5);
        console.log('Latest 5 Attendance Records:');
        sampleAttendance.forEach(a => {
            console.log(`- Emp: ${a.employee}, Date: ${a.date.toISOString()}, Status: ${a.status}`);
        });

        process.exit();
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();

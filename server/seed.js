const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Employee = require('./models/Employee');

dotenv.config();

const employeesData = [
    {
        firstName: 'System',
        lastName: 'Admin',
        employeeId: 'EMP001',
        department: 'Management',
        designation: 'Administrator',
        status: 'active',
        email: 'admin@hrms.com',
        role: 'admin',
        password: 'password123'
    },
    {
        firstName: 'Sarah',
        lastName: 'Johnson',
        employeeId: 'EMP002',
        department: 'Human Resources',
        designation: 'HR Manager',
        status: 'active',
        email: 'sarah.hr@hrms.com',
        role: 'hr',
        password: 'password123'
    },
    {
        firstName: 'Michael',
        lastName: 'Chen',
        employeeId: 'EMP003',
        department: 'Engineering',
        designation: 'Senior Developer',
        status: 'active',
        email: 'michael.dev@hrms.com',
        role: 'employee',
        password: 'password123'
    },
    {
        firstName: 'Jessica',
        lastName: 'Williams',
        employeeId: 'EMP004',
        department: 'Marketing',
        designation: 'Marketing Lead',
        status: 'active',
        email: 'jessica.mkt@hrms.com',
        role: 'manager',
        password: 'password123'
    },
    {
        firstName: 'David',
        lastName: 'Miller',
        employeeId: 'EMP005',
        department: 'Engineering',
        designation: 'Frontend Developer',
        status: 'active',
        email: 'david.dev@hrms.com',
        role: 'employee',
        password: 'password123'
    },
    {
        firstName: 'Emily',
        lastName: 'Davis',
        employeeId: 'EMP006',
        department: 'Sales',
        designation: 'Account Manager',
        status: 'active',
        email: 'emily.sales@hrms.com',
        role: 'employee',
        password: 'password123'
    },
    {
        firstName: 'Robert',
        lastName: 'Wilson',
        employeeId: 'EMP007',
        department: 'Support',
        designation: 'Support Specialist',
        status: 'active',
        email: 'robert.support@hrms.com',
        role: 'employee',
        password: 'password123'
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany();
        await Employee.deleteMany();

        for (const data of employeesData) {
            // Create Employee Profile
            const employee = await Employee.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                employeeId: data.employeeId,
                department: data.department,
                designation: data.designation,
                status: data.status,
                salary: {
                    basic: 50000,
                    hra: 20000,
                    allowances: 10000,
                    deductions: 5000
                }
            });

            // Create User
            await User.create({
                email: data.email,
                password: data.password,
                role: data.role,
                employee: employee._id
            });
        }

        console.log('Seed data created successfully with 7 employees!');
        console.log('Login credentials:');
        employeesData.forEach(emp => {
            console.log(`- ${emp.role.toUpperCase()}: ${emp.email} / ${emp.password}`);
        });

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();

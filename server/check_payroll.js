require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');

async function checkAndPopulate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const empsWithSalary = await Employee.find({ 'salary.basic': { $exists: true } });
        console.log('Employees with salary data:', empsWithSalary.length);

        if (empsWithSalary.length === 0) {
            console.log('No salary data found. Populating dummy salary for all active employees...');
            const allActive = await Employee.find({ status: 'active' });
            for (const emp of allActive) {
                emp.salary = {
                    basic: 25000 + Math.floor(Math.random() * 50000),
                    hra: 10000,
                    allowances: 5000,
                    deductions: 2000
                };
                await emp.save();
                console.log(`Updated salary for ${emp.firstName} ${emp.lastName}`);
            }
        }

        const periods = [
            { month: 1, year: 2026 },
            { month: 2, year: 2026 }
        ];

        for (const period of periods) {
            const payrolls = await Payroll.find({ month: period.month, year: period.year });
            console.log(`Payrolls for ${period.month}/${period.year}:`, payrolls.length);

            if (payrolls.length === 0) {
                console.log(`Generating payroll for ${period.month}/${period.year}...`);
                const employees = await Employee.find({ status: 'active', 'salary.basic': { $exists: true } });
                for (const emp of employees) {
                    const { basic, hra, allowances, deductions } = emp.salary;
                    const pf = basic * 0.12;
                    const tds = (basic + hra + allowances) * 0.10;
                    const netSalary = (basic + hra + allowances) - (pf + tds + deductions);

                    await Payroll.create({
                        employee: emp._id,
                        month: period.month,
                        year: period.year,
                        salaryComponents: { basic, hra, allowances, deductions, pf, tds },
                        netSalary,
                        status: 'paid',
                        paidAt: new Date(period.year, period.month - 1, 28)
                    });
                    console.log(`Generated payroll for ${emp.firstName} for ${period.month}/${period.year}`);
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndPopulate();

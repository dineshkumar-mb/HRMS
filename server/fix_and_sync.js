const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');
const Leave = require('./models/Leave');

async function syncAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
        console.log('--- SYNC STARTED ---');

        const employees = await Employee.find({});
        console.log(`Found ${employees.length} employees to process.`);

        for (const emp of employees) {
            console.log(`\nProcessing: ${emp.firstName} ${emp.lastName} (${emp.email})`);

            // 1. Reset to NEW increased defaults
            const newBalances = {
                casual: 24,
                sick: 15,
                earned: 20,
                unpaid: 0,
                paternity: 15,
                bereavement: 10
            };

            // 2. Fetch all approved leaves for this employee
            const approvedLeaves = await Leave.find({
                employee: emp._id,
                status: 'approved'
            });

            console.log(`Found ${approvedLeaves.length} approved leaves.`);

            // 3. Deduct days for each approved leave
            for (const leave of approvedLeaves) {
                // Migrate 'paid' to 'earned' if found in old records
                let type = leave.leaveType;
                if (type === 'paid') type = 'earned';

                if (newBalances.hasOwnProperty(type) && type !== 'unpaid') {
                    newBalances[type] -= leave.days;
                    console.log(` - Deducted ${leave.days} from ${type}. Remaining: ${newBalances[type]}`);
                }
            }

            // 4. Save updated balances
            emp.leaveBalances = newBalances;
            await emp.save({ validateBeforeSave: false });
            console.log(`✓ Updated balances for ${emp.firstName}`);
        }

        console.log('\n--- SYNC COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

syncAll();

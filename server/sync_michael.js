const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');
const Leave = require('./models/Leave');
const User = require('./models/User');

async function syncMichael() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
        console.log('--- SYNC STARTED ---');

        // 1. Find Michael by his User email
        const user = await User.findOne({ email: 'michael.dev@hrms.com' }).populate('employee');
        if (!user || !user.employee) {
            console.log('User or Employee not found for michael.dev@hrms.com');
            process.exit(1);
        }

        const emp = user.employee;
        console.log(`Processing: ${emp.firstName} ${emp.lastName} (${user.email})`);
        console.log(`Employee ID: ${emp._id}`);

        // 2. Ensure Employee record has the email set (for future validation)
        if (!emp.email) {
            emp.email = user.email;
            console.log('- Fixed missing employee email');
        }

        // 3. Reset to NEW increased defaults
        const newBalances = {
            casual: 24,
            sick: 15,
            earned: 20,
            unpaid: 0,
            paternity: 15,
            bereavement: 10
        };

        // 4. Fetch all approved leaves for this employee
        // We use the ID that Step 496 showed exists in leaves
        const approvedLeaves = await Leave.find({
            employee: emp._id,
            status: 'approved'
        });

        console.log(`Found ${approvedLeaves.length} approved leaves.`);

        // 5. Deduct days
        for (const leave of approvedLeaves) {
            let type = leave.leaveType;
            if (type === 'paid') type = 'earned';

            if (newBalances.hasOwnProperty(type) && type !== 'unpaid') {
                newBalances[type] -= leave.days;
                console.log(` - Deducted ${leave.days} from ${type} (Leave ID: ${leave._id}). Remaining: ${newBalances[type]}`);
            }
        }

        // 6. Save
        emp.leaveBalances = newBalances;
        await emp.save({ validateBeforeSave: false });
        console.log(`✓ Updated balances for ${emp.firstName}`);

        console.log('\n--- SYNC COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

syncMichael();

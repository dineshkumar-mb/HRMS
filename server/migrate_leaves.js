const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
        console.log('Connected to MongoDB');

        const result = await Employee.updateMany(
            { leaveBalances: { $exists: false } },
            {
                $set: {
                    leaveBalances: {
                        casual: 15,
                        sick: 10,
                        earned: 20,
                        unpaid: 0,
                        paternity: 15,
                        bereavement: 5
                    }
                }
            }
        );

        console.log('Migration Complete!');
        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();

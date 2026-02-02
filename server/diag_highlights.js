const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function diag() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Employee = mongoose.model('Employee', new mongoose.Schema({
            firstName: String,
            lastName: String,
            email: String,
            dob: Date,
            status: String
        }));

        const today = new Date();
        const getMD = (d) => ({ m: d.getMonth() + 1, d: d.getDate() });
        const targets = [
            getMD(today),
            getMD(new Date(today.getTime() - 86400000)),
            getMD(new Date(today.getTime() + 86400000))
        ];

        console.log('Today (Server):', today.toISOString());
        console.log('Targets:', JSON.stringify(targets));

        const birthdays = await Employee.find({
            status: 'active',
            $expr: {
                $or: targets.map(t => ({
                    $and: [
                        { $eq: [{ $month: '$dob' }, t.m] },
                        { $eq: [{ $dayOfMonth: '$dob' }, t.d] }
                    ]
                }))
            }
        }).select('_id firstName lastName designation department profilePhoto dob');

        console.log('Matched Birthdays Count:', birthdays.length);
        birthdays.forEach(b => {
            console.log(` - ${b.firstName} ${b.lastName} (${b.email}) DOB: ${b.dob ? b.dob.toISOString() : 'MISSING'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag();

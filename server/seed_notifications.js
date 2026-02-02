const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
require('dotenv').config();

async function seedNotifications() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const adminUser = await User.findOne({ email: 'admin@hrms.com' });

        if (!adminUser) {
            console.log('Admin user not found');
            process.exit(1);
        }

        // Clear old notifications
        await Notification.deleteMany({ recipient: adminUser._id });

        const testNotifications = [
            {
                recipient: adminUser._id,
                title: 'Welcome to the Notification System',
                message: 'You can now receive real-time updates and alerts here.',
                type: 'info'
            },
            {
                recipient: adminUser._id,
                title: 'Leave Request Approved',
                message: 'Your leave request for February 5th has been approved.',
                type: 'success'
            },
            {
                recipient: adminUser._id,
                title: 'System Maintenance',
                message: 'The system will be down for maintenance tonight at 10 PM.',
                type: 'warning'
            }
        ];

        await Notification.insertMany(testNotifications);
        console.log('Test notifications seeded for admin@hrms.com');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedNotifications();

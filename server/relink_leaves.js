const mongoose = require('mongoose');
require('dotenv').config();
const Leave = require('./models/Leave');

async function fix() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
    const result = await Leave.updateMany(
        { employee: '679e0066d1eb20ca01fcc0be' },
        { $set: { employee: '697721646e5c3b4a01fcc0be' } }
    );
    console.log('Re-linked leaves:', result);
    process.exit(0);
}
fix();

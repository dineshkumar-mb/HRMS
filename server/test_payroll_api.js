require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testApi() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@hrms.com' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Testing /api/payroll/me with token...');
        const res = await axios.get('http://localhost:5000/api/payroll/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', res.status);
        console.log('Payroll Count:', res.data.data ? res.data.data.length : 0);
        if (res.data.data && res.data.data.length > 0) {
            console.log('First Record:', JSON.stringify(res.data.data[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testApi();

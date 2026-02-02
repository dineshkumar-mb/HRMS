const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

async function test() {
    try {
        const token = jwt.sign({ id: '697f7b7edf508d25d873025a', employee: '697f7b7edf508d25d8730257' }, process.env.JWT_SECRET || 'secret');
        const res = await axios.get('https://hrms-22ch.onrender.com/api/employees/highlights', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('HIGHLIGHTS RESPONSE:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.response ? err.response.data : err.message);
    }
}

test();

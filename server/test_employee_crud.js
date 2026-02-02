const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

const API_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'secret';

// Use matches from test_api.js if possible, or dummy admin
const token = jwt.sign({ id: '697f7b7edf508d25d873025a', role: 'admin' }, SECRET);

const headers = { Authorization: `Bearer ${token}` };

async function runTests() {
    let testEmployeeId;

    try {
        console.log('--- Testing Create Employee ---');
        const createRes = await axios.post(`${API_URL}/employees`, {
            firstName: 'Test',
            lastName: 'User',
            email: `testuser_${Date.now()}@example.com`,
            employeeId: `TEST_${Date.now()}`,
            department: 'IT',
            designation: 'Tester',
            dateOfJoining: new Date(),
            status: 'active'
        }, { headers });

        testEmployeeId = createRes.data.data.employee._id;
        console.log('Success: Employee Created', testEmployeeId);

        console.log('\n--- Testing Update Employee ---');
        const updateRes = await axios.put(`${API_URL}/employees/${testEmployeeId}`, {
            firstName: 'UpdatedTest',
            designation: 'Senior Tester'
        }, { headers });
        console.log('Success: Employee Updated', updateRes.data.data.firstName);

        console.log('\n--- Testing Delete Employee ---');
        const deleteRes = await axios.delete(`${API_URL}/employees/${testEmployeeId}`, { headers });
        console.log('Success: Employee Deleted', deleteRes.data.success);

        console.log('\n--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

runTests();

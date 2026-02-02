const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Holiday = require('./models/Holiday');

dotenv.config();

const holidays = [
    { name: 'New Year Day', date: new Date('2026-01-01'), type: 'national' },
    { name: 'Republic Day', date: new Date('2026-01-26'), type: 'national' },
    { name: 'Holi', date: new Date('2026-03-14'), type: 'national' },
    { name: 'Independence Day', date: new Date('2026-08-15'), type: 'national' },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02'), type: 'national' },
    { name: 'Diwali', date: new Date('2026-10-21'), type: 'national' },
    { name: 'Christmas', date: new Date('2026-12-25'), type: 'national' },
];

const seedHolidays = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for holiday seeding...');

        await Holiday.deleteMany();
        await Holiday.insertMany(holidays);

        console.log('Holidays seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding holidays:', error);
        process.exit(1);
    }
};

seedHolidays();

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['info', 'important', 'urgent'], default: 'info' },
    pinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);

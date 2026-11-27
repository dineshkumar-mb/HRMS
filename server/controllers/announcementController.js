const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find()
            .sort({ pinned: -1, createdAt: -1 })
            .limit(20);
        res.json({ success: true, count: announcements.length, data: announcements });
    } catch (error) {
        next(error);
    }
};

const createAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

const updateAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!announcement) {
            res.status(404);
            return next(new Error('Announcement not found'));
        }
        res.json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

const deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            res.status(404);
            return next(new Error('Announcement not found'));
        }
        await announcement.deleteOne();
        res.json({ success: true, message: 'Announcement removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };

const Notification = require('../models/notification');
const User = require('../models/user'); // Assuming you have a User model

// Updated createNotification function in controller
exports.createNotification = async (req, res) => {
  try {
    const { content, pollId, creatorId } = req.body; // Add creatorId to exclude poll creator
    
    // Get all users except the poll creator
    const users = await User.find({ _id: { $ne: creatorId } }, '_id');
    
    // Create notifications for all users except the creator
    const notifications = users.map(user => ({
      content,
      userId: user._id,
      poll: pollId,
      isRead: false
    }));
    
    // Insert all notifications at once
    const createdNotifications = await Notification.insertMany(notifications);
    
    res.status(201).json({ 
      message: 'Notifications created successfully',
      count: createdNotifications.length 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Only get notifications for the specific user
    const notifications = await Notification.find({ userId }).populate('poll');
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body; // Get userId from request body or you can get it from JWT token
    
    // Find notification that belongs to the specific user
    const notification = await Notification.findOne({ 
      _id: notificationId, 
      userId: userId 
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification marked as read successfully' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Additional helper function to mark all notifications as read for a user
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    
    await Notification.updateMany(
      { userId: userId, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read successfully' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
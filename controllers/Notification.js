const Notification = require('../models/notification');
const User = require('../models/user'); 

  exports.createNotification = async (req, res) => {
    try {
      const { content, pollId, creatorId } = req.body; 
      
      const users = await User.find({ _id: { $ne: creatorId } }, '_id');
      
      const notifications = users.map(user => ({
        content,
        userId: user._id,
        poll: pollId,
        isRead: false
      }));
      
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
    const { userId } = req.query; 
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
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
    const { userId } = req.body; 
    
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
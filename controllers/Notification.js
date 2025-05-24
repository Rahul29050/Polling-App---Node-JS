const Notification = require('../models/notification');

exports.createNotification = async (req, res) => {
    try {
      const { content, userId } = req.body;
  
      const notification = new Notification({ content, userId });
      await notification.save();
  
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  exports.getNotifications = async (req, res) => {
    try {
      const notifications = await Notification.find();
  
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  exports.markNotificationAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
  
      notification.isRead = true; 
      await notification.save();
  
      res.status(200).json({ message: 'Notification marked as read successfully' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
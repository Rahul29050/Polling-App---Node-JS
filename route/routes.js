const express = require('express');
const router = express.Router();
const {verifyAccessToken} = require ('../middleware')

const userController = require('../controllers/user');
const pollController = require('../controllers/pollController');
const notificationController = require('../controllers/Notification');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/verify-otp', userController.verifyOTP);
router.post('/resend-otp', userController.resendOTP);
router.get('/api/users', userController.getAllUsers);

// NEW: Forgot Password routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-password-reset-otp', userController.verifyPasswordResetOTP);
router.post('/reset-password', userController.resetPassword);

router.get('/api/polls', verifyAccessToken,pollController.getAllPolls);
router.get('/api/user/polls', verifyAccessToken, pollController.getUserPolls);
router.post('/api/polls',verifyAccessToken, pollController.createPoll);
router.get('/api/polls/:id',verifyAccessToken, pollController.getPollById);
router.patch('/api/polls/update-status/:id', verifyAccessToken, pollController.updatePollStatus);
router.post('/api/vote',verifyAccessToken, pollController.vote);
router.delete('/api/polls/:id', verifyAccessToken, pollController.deletePoll);


router.post('/notifications', notificationController.createNotification);
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/:notificationId/read', notificationController.markNotificationAsRead);
router.patch('/notifications/read-all', notificationController.markAllNotificationsAsRead);
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const count = await require('../models/notification').countDocuments({ 
      userId: userId, 
      isRead: false 
    });
    
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

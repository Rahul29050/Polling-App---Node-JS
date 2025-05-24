const express = require('express');
const router = express.Router();
const {verifyAccessToken} = require ('../middleware')

const userController = require('../controllers/user');
const pollController = require('../controllers/pollController');
const notificationController = require('../controllers/Notification');


router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

router.get('/api/polls', verifyAccessToken,pollController.getAllPolls);
router.get('/api/user/polls', verifyAccessToken, pollController.getUserPolls);
router.post('/api/polls',verifyAccessToken, pollController.createPoll);
router.get('/api/polls/:id',verifyAccessToken, pollController.getPollById);
router.patch('/api/polls/update-status/:id', verifyAccessToken, pollController.updatePollStatus);
router.post('/api/vote',verifyAccessToken, pollController.vote);
router.delete('/api/polls/:id', verifyAccessToken, pollController.deletePoll);


router.post('/notifications', notificationController.createNotification);
router.get('/notifications', verifyAccessToken, notificationController.getNotifications);
router.put('/notifications/:notificationId/read', verifyAccessToken, notificationController.markNotificationAsRead);

module.exports = router;

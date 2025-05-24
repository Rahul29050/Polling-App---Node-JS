// const Notification = require('../models/notification');

// const removeNotificationsOnPollDeletion = async (req, res, next) => {
//   const pollId = req.params.id;
//   try {
//     await Notification.deleteMany({ poll: pollId });
//     next();
//   } catch (error) {
//     console.error('Error removing notifications on poll deletion:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// const removeExpiredPollNotifications = async (req, res, next) => {
//   try {
//     const currentTime = new Date();
//     await Notification.deleteMany({ });
//     next();
//   } catch (error) {
//     console.error('Error removing expired poll notifications:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// module.exports = {
//   removeNotificationsOnPollDeletion,
//   removeExpiredPollNotifications,
// };

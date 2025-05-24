// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//   content: {
//     type: String,
//     required: true,
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
// });

// module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll', 
  },
  isRead: {
    type: Boolean,
    default: false,
  },
},);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;



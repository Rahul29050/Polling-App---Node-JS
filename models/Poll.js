const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  option: String,
  votes: Number,
});

const userVoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
});


const pollSchema = new mongoose.Schema({
  question: String,
  options: [pollOptionSchema],
  visibility: String,
  duration: Number,
  durationUnit: String,
  isOpen: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
  },
  votes: [userVoteSchema], 
  isVote: {
    type: Boolean,
    default: false,
  },
    allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }], 
},
{
  timestamps: true,
});

module.exports = mongoose.model('Poll', pollSchema);
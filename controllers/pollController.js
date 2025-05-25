// controllers/pollController.js
const Poll = require('../models/Poll');

exports.getAllPolls = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    const polls = await Poll.find({
      $or: [
        { visibility: 'public' },
        { 
          visibility: 'private', 
          allowedUsers: { $in: [userId] }
        },
        {
          visibility: 'private',
          'createdBy.userId': userId
        }
      ]
    }).populate('createdBy', 'username');
    
    res.status(200).json(polls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserPolls = async (req, res) => {
  try {
    const user = req.user._id;
    const userPolls = await Poll.find({ 'createdBy.userId': user });
    // console.log(userPolls)
    res.status(200).json(userPolls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createPoll = async (req, res) => {
  try {
    const { question, options, visibility, duration, durationUnit, createdBy, allowedUsers  } = req.body;

    const pollOptions = options.map((option) => ({ option, votes: 0 }));

    const poll = new Poll({
      question,
      options: pollOptions,
      visibility,
      duration,
      durationUnit,
      createdBy,
      allowedUsers: visibility === 'private' ? allowedUsers : [],
      createdAt: new Date(),
      isOpen: true,
    });
    await poll.save();

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const pollId = req.params.id;

    const existingPoll = await Poll.findById(pollId);
    if (!existingPoll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (existingPoll.createdBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this poll' });
    }

    await Poll.findByIdAndDelete(pollId);

    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


exports.updatePollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;
    
    
    const updatedPoll = await Poll.findById(id);
    updatedPoll.isOpen = isOpen;
    await updatedPoll.save();
    
    if (!updatedPoll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    res.status(200).json({ message: 'Poll status updated successfully', poll: updatedPoll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.visibility === 'private') {
      const userId = req.user._id;
      const isAllowed = poll.allowedUsers.some(uid => uid.toString() === userId.toString());

      if (!isAllowed && poll.createdBy.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Access denied to private poll' });
      }
    }


    if (!poll.isOpen) {
      return res.status(403).json({ message: 'Poll duration has ended' });
    }

    res.status(200).json(poll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.vote = async (req, res) => {
  try {
    const { pollId, optionId } = req.body;
    const userId = req.user._id;

    if (!pollId || !optionId) {
      return res.status(400).json({ message: 'Both pollId and optionId are required.' });
    }

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const userVote = poll.votes.find(vote => vote.userId.equals(userId));

    if (userVote) {
      return res.status(400).json({ message: 'You have already voted in this poll.' });
    }

    const selectedOption = poll.options.find(o => o._id.equals(optionId));

    if (!selectedOption) {
      return res.status(400).json({ message: 'Option not found' });
    }

    selectedOption.votes += 1;

    poll.votes.push({ userId, optionId });
    poll.isVote = true;

    await poll.save();

    return res.status(200).json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error recording vote:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// exports.checkUserVote = async (req, res) => {
//   try {
//     const { pollId } = req.params;
//     const userId = req.user._id;

//     const poll = await Poll.findById(pollId);

//     if (!poll) {
//       return res.status(404).json({ message: 'Poll not found' });
//     }

//     const userVote = poll.votes.find(vote => vote.userId.equals(userId));

//     if (userVote) {
//       return res.status(200).json({ hasVoted: true });
//     }

//     return res.status(200).json({ hasVoted: false });
//   } catch (error) {
//     console.error('Error checking user vote:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };



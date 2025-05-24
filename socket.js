// socket.js

const { Server } = require("socket.io");

let io;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on("connection", (socket) => {
    console.log("A new user has connected", socket.id);

    socket.on('testEvent', (message) => {
      console.log(`Received a test message: ${message}`);
    });

    
    socket.on('newPollCreated', (postData) => {
      const newPoll = {
        question: postData.question,
        createdBy: {
          username: postData.createdBy.username,
        },
      };
      console.log(newPoll)

      // io.emit('pollCreated', newPoll);
      io.emit('pollCreated', postData);

    });
  });
}

function emitPollUpdate(poll) {
  if (io) {
    io.emit('pollUpdate', poll);
  }
}

module.exports = {
  initializeSocket,
  emitPollUpdate,
};

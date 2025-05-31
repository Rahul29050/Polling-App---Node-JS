const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const socketModule = require('./socket');
const cron = require('node-cron');
const Poll = require('./models/Poll') ;

require('dotenv').config();
mongoose.set('strictQuery', false);
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io = socketIo(server);

socketModule.initializeSocket(server);

const routes = require('./route/routes');
app.use(express.json());
app.use(routes);

mongoose
  .connect("mongodb://0.0.0.0:27017/Poll", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to DB");
  })
  .catch((error) => {
    console.error("Error connecting to DB:", error);
  });

server.listen(3000, function check(error) {
  if (error) {
    console.log("Server start error:", error);
  } else {
    console.log("Server started on port 3000");
  }
});

cron.schedule('*/1 * * * *', async () => {
  try {
    const openPolls = await Poll.find({ isOpen: true });

    const currentTime = new Date();
    for (const poll of openPolls) {
      const pollEndTime = new Date(poll.createdAt);
      pollEndTime.setSeconds(pollEndTime.getSeconds() + poll.duration);
     
      const updatedPoll = { ...poll };
      
      if (currentTime >= pollEndTime) {
        updatedPoll.isOpen = false;
        await updatedPoll.save();
      }
    }

    console.log('Poll statuses updated successfully');
  } catch (error) {
    // console.error('Error updating poll statuses:', error);
  }
});

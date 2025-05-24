const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// 🧠 Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/risyncChat');
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// 📄 Define Message model
const Message = mongoose.model('Message', {
  username: String,
  message: String,
  room: String,
  timestamp: { type: Date, default: Date.now }
});

// 🌐 Handle socket connections
io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);

    // 🕘 Send last 100 messages to user
    const previousMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(100);
    socket.emit('loadMessages', previousMessages);

    socket.to(room).emit('message', {
      username: 'System',
      message: `${username} has joined the chat`,
      system: true
    });
  });

  socket.on('message', async ({ username, message, room }) => {
    const newMessage = new Message({ username, message, room });
    await newMessage.save();

    socket.to(room).emit('message', { username, message });
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(room => {
      socket.to(room).emit('message', {
        username: 'System',
        message: `A user has left the chat.`,
        system: true
      });
    });
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});

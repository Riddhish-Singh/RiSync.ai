const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.to(room).emit('message', {
      username: 'System',
      message: `${username} has joined the chat`,
      system: true
    });
  });

  socket.on('message', ({ username, message, room }) => {
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
  console.log('Server running at http://localhost:3000');
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from 'public'
app.use(express.static('public'));

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user joined', (username) => {
    socket.username = username;
    io.emit('user joined', username);
    console.log(`${username} joined`);
  });

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Bind to all network interfaces
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

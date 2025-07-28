const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Load saved messages if messages.json exists
let messages = [];
if (fs.existsSync('messages.json')) {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send all saved messages to this new user
  socket.emit('load old messages', messages);

  socket.on('user joined', (username) => {
    socket.username = username;
    io.emit('user joined', username);
    console.log(`${username} joined`);
    // Relay WebRTC signaling data
socket.on('call user', (data) => {
  io.to(data.userToCall).emit('call made', {
    signal: data.signalData,
    from: socket.id,
    name: data.name,
  });
});

socket.on('make answer', (data) => {
  io.to(data.to).emit('answer made', {
    signal: data.signal,
    from: socket.id,
  });
});

// File sharing event
socket.on('send file', (data) => {
  // Broadcast file data to all except sender
  socket.broadcast.emit('receive file', data);
});

  });

  socket.on('chat message', (data) => {
    messages.push(data); // Add new message to array

    // Save updated messages array to file
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

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

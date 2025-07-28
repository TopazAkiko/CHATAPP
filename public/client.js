const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const usernamePrompt = document.getElementById('usernamePrompt');
const usernameInput = document.getElementById('usernameInput');
const usernameBtn = document.getElementById('usernameBtn');
const chatContainer = document.getElementById('chatContainer');
const micBtn = document.getElementById('micBtn');

let username = '';
let recognition;

// Function to add a message to the chat list and scroll down
function addMessageToList(data) {
  const item = document.createElement('li');
  item.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;

  if (data.username === username) {
    item.classList.add('my-message');
  } else {
    item.classList.add('other-message');
  }

  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

// ✅ Remove localStorage load — use server instead!
// The server sends saved messages on connect:
socket.on('load old messages', (oldMessages) => {
  oldMessages.forEach(data => {
    addMessageToList(data);
  });
});

// Handle username submission
usernameBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    username = name;
    usernamePrompt.style.display = 'none';
    chatContainer.style.display = 'block';
    socket.emit('user joined', username);
  }
});

// Handle message form submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value && username) {
    socket.emit('chat message', { username, message: input.value });
    input.value = '';
  }
});

// Receive and render chat messages (server keeps them)
socket.on('chat message', (data) => {
  addMessageToList(data);
});

// Notify when a user joins
socket.on('user joined', (name) => {
  const item = document.createElement('li');
  item.innerHTML = `<em>${name} joined the chat</em>`;
  messages.appendChild(item);
});

// Setup speech recognition for mic button
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech Recognition not supported in this browser";
}

// Start speech recognition on mic button click
micBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});
// Send button click
document.getElementById('sendBtn').addEventListener('click', () => {
  if (input.value && username) {
    socket.emit('chat message', { username, message: input.value });
    input.value = '';
  }
});
// === WebRTC variables ===
let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const callButton = document.getElementById('callBtn'); // you need to add this in HTML
const hangupButton = document.getElementById('hangupBtn'); // add in HTML

// Start media devices for audio/video call
async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  // Show local video in your UI if you add a video element with id 'localVideo'
  document.getElementById('localVideo').srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice candidate', { candidate: event.candidate });
    }
  };

  peerConnection.ontrack = (event) => {
    // Show remote video in your UI if you add a video element with id 'remoteVideo'
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  // Create offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('call user', {
    userToCall: 'OTHER_USER_SOCKET_ID', // You need to handle how to get this dynamically
    signalData: offer,
    name: username,
  });
}

// Handle receiving a call
socket.on('call made', async (data) => {
  if (!peerConnection) {
    await startCall(); // initialize your peerConnection and media
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('make answer', {
    signal: answer,
    to: data.from,
  });
});

// Handle answer from callee
socket.on('answer made', async (data) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
});

// ICE candidate handling (add this to your socket events)
socket.on('ice candidate', async (data) => {
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (e) {
    console.error('Error adding received ice candidate', e);
  }
});

// Hang up call
function hangUp() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  // Clear video srcObjects if you have video tags
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('remoteVideo').srcObject = null;
}

hangupButton.addEventListener('click', hangUp);


// === File sharing ===

const fileInput = document.getElementById('fileInput'); // add this input to HTML

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('send file', {
      username,
      fileName: file.name,
      fileType: file.type,
      fileData: reader.result,
    });
  };
  reader.readAsDataURL(file);
});

socket.on('receive file', (data) => {
  const item = document.createElement('li');
  item.innerHTML = `<strong>${data.username}:</strong> Sent a file: <a href="${data.fileData}" download="${data.fileName}">${data.fileName}</a>`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

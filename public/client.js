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

// Load saved messages from localStorage on page load
window.onload = () => {
  const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
  savedMessages.forEach((data) => {
    addMessageToList(data);
  });
};

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

// Receive and render chat messages and save to localStorage
socket.on('chat message', (data) => {
  addMessageToList(data);

  // Save to localStorage
  const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
  savedMessages.push(data);
  localStorage.setItem('chatMessages', JSON.stringify(savedMessages));
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

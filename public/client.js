const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const usernamePrompt = document.getElementById('usernamePrompt');
const usernameInput = document.getElementById('usernameInput');
const usernameBtn = document.getElementById('usernameBtn');
const chatContainer = document.getElementById('chatContainer');

let username = '';

usernameBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    username = name;
    usernamePrompt.style.display = 'none';
    chatContainer.style.display = 'block';
    socket.emit('user joined', username);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value && username) {
    socket.emit('chat message', { username, message: input.value });
    input.value = '';
  }
});

socket.on('chat message', (data) => {
  const item = document.createElement('li');
  item.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('user joined', (name) => {
  const item = document.createElement('li');
  item.innerHTML = `<em>${name} joined the chat</em>`;
  messages.appendChild(item);
});

const micBtn = document.getElementById('micBtn');
let recognition;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech Recognition not supported";
}

micBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});

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

// ✅ Add a message to the list and scroll
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

// ✅ Load saved messages on page load
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem('chatMessages')) || [];
  saved.forEach((data) => addMessageToList(data));
};

// ✅ Handle username submit
usernameBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    username = name;
    usernamePrompt.style.display = 'none';
    chatContainer.style.display = 'block';
    socket.emit('user joined', username);
  }
});

// ✅ Send a message
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value && username) {
    const data = { username, message: input.value };
    socket.emit('chat message', data);
    input.value = '';
  }
});

// ✅ Receive a message
socket.on('chat message', (data) => {
  addMessageToList(data);

  const saved = JSON.parse(localStorage.getItem('chatMessages')) || [];
  saved.push(data);
  localStorage.setItem('chatMessages', JSON.stringify(saved));
});

// ✅ User joined notice
socket.on('user joined', (name) => {
  const item = document.createElement('li');
  item.innerHTML = `<em>${name} joined the chat</em>`;
  messages.appendChild(item);
});

// ✅ Speech recognition
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech Recognition not supported";
}

micBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});

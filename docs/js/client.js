// Initialize connection to the server
const socket = new WebSocket('ws://localhost:8080');
const output = document.getElementById('output');
const input = document.getElementById('messageInput');

// Connection opened
socket.addEventListener('open', () => {
  console.log('Connected to the server!');
});

// on click of a button 
// socket.send(JSON.stringify({ type: 'create' }));

// socket.send(JSON.stringify({ 
//     type: 'join', 
//     roomCode: '12345' // collected from an input field
// }));
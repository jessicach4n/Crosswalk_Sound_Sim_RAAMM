const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

const generateRoomCode = () => {
  return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
};

wss.on("connection", (socket) => {
  console.log("A new client connected!");

  socket.roomCode = null;

  socket.on("message", (data) => {
    const message = JSON.parse(data);

    if (message.type == 'create') {

    }
    else if (message.type == 'join') {

    }
    else {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid action' }));
    }
    
    
  })

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:8080");

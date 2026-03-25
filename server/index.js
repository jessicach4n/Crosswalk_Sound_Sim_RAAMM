const WebSocket = require("ws");
const crypto = require("crypto");

const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;

  do {
    code = Array.from({ length: 6 }, () => {
      return chars[crypto.randomInt(0, chars.length)];
    }).join("");
  } while (rooms.has(code));

  return code;
}

wss.on("connection", (socket) => {
  console.log("Backend: A new client connected!");

  socket.roomCode = null;

  socket.on("message", (data) => {
    let message;

    try {
      message = JSON.parse(data.toString());
    }
    catch (err) {
      socket.send(
        JSON.stringify({type: "error", message: "Invalid JSON: " + err})
      );
      return;
    }

    if (message.type == 'create') {
      const roomCode = generateRoomCode();

      rooms.set(roomCode, {
        host: socket,
        members: [socket],
      });

      socket.roomCode = roomCode;

      socket.send(
        JSON.stringify({
          type: "room-created",
          roomCode,
        }),
      );
    }
    else if (message.type == 'join') {
      const room = rooms.get(message.roomCode);

      if (!room) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Room not found",
          }),
        );
        return;
      }

      room.members.push(socket);
      socket.roomCode = message.roomCode;

      socket.send(
        JSON.stringify({
          type: "room-joined",
          roomCode: message.roomCode,
        }),
      );
    }
    else {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid action' }));
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:8080");

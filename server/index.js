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
        duration: null,
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

      if (room.members.length >= 2) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Room is full",
          }),
        );
        return;
      }

      room.members.push(socket);
      socket.roomCode = message.roomCode;

      // success sent to listener
      socket.send(
        JSON.stringify({
          type: "room-joined",
          roomCode: message.roomCode,
        }),
      );

      // notify the host someone joined
      if (room.host && room.host.readyState === WebSocket.OPEN) {
        console.log("peer-joined")
        room.host.send(
          JSON.stringify({
            type: "peer-joined",
            roomCode: message.roomCode,
          }),
        );
      }
    }
    else if (message.type === "set-duration") {
      const room = room.get(message.roomCode);
      if (!room) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Room not found",
          }),
        );
        return;
      }

      if (room.host !== socket) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Only the host can set the duration",
          }),
        );
        return;
      }

      const validDurations = [15, 30, 45, 60];
      const duration = Number(message.duration);

      if (!validDurations.includes(duration)) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Invalid duration",
          }),
        );
        return;
      }

      room.duration = duration;

      // confirm to host
      socket.send(
        JSON.stringify({
          type: "duration-set",
          duration,
        }),
      );

      // notify listener
      room.members.forEach((member) => {
        if (member !== socket && member.readyState === WebSocket.OPEN) {
          member.send(
            JSON.stringify({
              type: "duration-updated",
              duration,
            }),
          );
        }
      });
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

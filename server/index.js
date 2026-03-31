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
    else if (message.type === "prepare-sound") {
      const room = rooms.get(message.roomCode);

      if (!room) {
        socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }

      if (room.host !== socket) {
        socket.send(JSON.stringify({ type: "error", message: "Only the host can prepare sound" }));
        return;
      }

      room.members.forEach((member) => {
        if (member.readyState !== WebSocket.OPEN) return;
        member.send(JSON.stringify({ type: "prepare-sound", sound: message.sound }));
      });
    }

    else if (message.type === "listener-ready") {
      const room = rooms.get(message.roomCode);

      if (!room) {
        socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }

      // Forward to host so it knows listener is primed and waiting
      if (room.host && room.host.readyState === WebSocket.OPEN) {
        room.host.send(JSON.stringify({ type: "listener-ready", sound: message.sound }));
      }
    }
    else if (message.type === "play-sound") {
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

      if (room.host !== socket) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Only the host can start the sound",
          }),
        );
        return;
      }

      const leadMs = 0;
      const listenerOffsetMs = 580;

      const now = Date.now();
      const hostStartAt = now + leadMs;
      const listenerStartAt = hostStartAt + listenerOffsetMs;

      room.members.forEach((member) => {
        if (member.readyState !== WebSocket.OPEN) return;

        const isHost = member === room.host;

        member.send(
          JSON.stringify({
            type: "play-sound",
            sound: message.sound,
            startAt: isHost ? hostStartAt : listenerStartAt,
          }),
        );
      });
    }
    else if (message.type === "stop-sound") {
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

      if (room.host !== socket) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Only the host can stop the sound",
          }),
        );
        return;
      }

      room.members.forEach((member) => {
        if (member.readyState !== WebSocket.OPEN) return;

        member.send(
          JSON.stringify({
            type: "stop-sound",
            sound: message.sound,
          }),
        );
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

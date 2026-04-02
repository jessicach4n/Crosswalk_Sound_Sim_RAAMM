const WebSocket = require("ws");
const crypto = require("crypto");

const ALLOWED_ORIGINS = [
  "https://jessicach4n.github.io", 
  "http://localhost:5500",
  "http://localhost:5501"
];

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
  port: PORT,
  verifyClient: ({ origin }) => {
    if (!origin) return false;
    return ALLOWED_ORIGINS.includes(origin);
  },
});

const rooms = new Map();

function generateRoomCode() {
  const charsAlpha = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const charsNum = "23456789";
  let code;

  do {
    const firstLetter = charsAlpha[crypto.randomInt(0, charsAlpha.length)];

    const numbers = Array.from({ length: 5 }, () => {
      return charsNum[crypto.randomInt(0, charsNum.length)];
    }).join("");

    code = `${firstLetter}${numbers}`;

  } while (rooms.has(code));

  return code;
}

wss.on("connection", (socket) => {
  console.log("Backend: A new client connected!");

  socket.roomCode = null;

socket.on("message", (data) => {
    if (data.length > 1024) {
      socket.send(
        JSON.stringify({ type: "error", message: "Message too large" })
      );
      return;
    }

    let message;

    try {
      message = JSON.parse(data.toString());
    } catch (err) {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
      return;
    }

    const VALID_SOUNDS = ["canadian", "beep", "cuckoo", "all"];
    const ROOM_CODE_REGEX = /^[A-Z2-9]{6}$/;

    // Validate roomCode if present
    if (
      message.roomCode !== undefined &&
      (typeof message.roomCode !== "string" ||
        !ROOM_CODE_REGEX.test(message.roomCode))
    ) {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid room code" })
      );
      return;
    }

    // Validate sound if present
    if (
      message.sound !== undefined &&
      !VALID_SOUNDS.includes(message.sound)
    ) {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid sound" })
      );
      return;
    }

    if (message.type === "pong") {
      // Ignore pong messages used for heartbeat
      return;
    }

    if (message.type == "create") {
      if (rooms.size >= 100) {
        socket.send(
          JSON.stringify({ type: "error", message: "Server is full" })
        );
        return;
      }

      if (socket.roomCode) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "You already have a room",
          })
        );
        return;
      }

      const roomCode = generateRoomCode();

      rooms.set(roomCode, {
        host: socket,
        members: [socket],
        duration: null,
        lastActive: Date.now(),
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

      if (room) {
        room.lastActive = Date.now();
      }

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
      const listenerOffsetMs = 1000; // Sync offset

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
    else if (message.type === "leave-room") {
      const roomCode = message.roomCode || socket.roomCode;

      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (!room) return;

      if (room.host === socket) {
        // SCENARIO A: The Host is leaving. Destroy the room.
        room.members.forEach((member) => {
          if (member !== socket && member.readyState === WebSocket.OPEN) {
            member.send(JSON.stringify({ type: "room-closed" }));
            member.roomCode = null;
          }
        });
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} closed by host`);
      } else {
        // SCENARIO B: The Listener is leaving. Keep the room open.
        room.members = room.members.filter((member) => member !== socket);
        socket.roomCode = null;
        console.log(`Listener left room ${roomCode}. Spot is now open.`);
      }
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");

    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.host === socket) {
      // SCENARIO A: Host disconnected. Destroy the room.
      room.members.forEach((member) => {
        if (member !== socket && member.readyState === WebSocket.OPEN) {
          member.send(JSON.stringify({ type: "room-closed" }));
          member.roomCode = null;
        }
      });
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted due to host disconnect`);
    } else {
      // SCENARIO B: Listener disconnected. Keep the room open.
      room.members = room.members.filter((member) => member !== socket);
      console.log(`Listener disconnected from room ${roomCode}. Spot is open.`);
    }
  });
});

const CLEANUP_INTERVAL = 60000; // Check every 60 seconds
const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Periodic cleanup of inactive rooms
setInterval(() => {
  const now = Date.now();
  
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > MAX_IDLE_TIME) {
      console.log(`Cleanup: Room ${code} closed due to inactivity.`);
      
      // Notify any remaining members
      room.members.forEach((member) => {
        if (member.readyState === WebSocket.OPEN) {
          member.send(JSON.stringify({ 
            type: "error", 
            message: "Room closed due to inactivity" 
          }));
          member.roomCode = null;
        }
      });
      
      rooms.delete(code); // Remove from memory
    }
  }
}, CLEANUP_INTERVAL);

// Heartbeat mechanism to keep connections alive 
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "ping" }));
    }
  });
}, 30000); 



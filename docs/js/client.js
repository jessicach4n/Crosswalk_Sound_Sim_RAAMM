const socket = new WebSocket("ws://localhost:8080");

//=============DOM elements=================
const roomCodeContainer = document.getElementById("room-code");
const roomCodeInput = document.getElementById("server-input");

socket.addEventListener("open", () => {
  console.log("Frontend: Connected to the server!");
});

document.getElementById("create-server-btn").addEventListener("click", () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "create" }));
  } else {
    console.log("Socket not open yet");
  }
});

document.getElementById("submit-btn").addEventListener("click", () => {
  const roomCode = roomCodeInput.value.trim();

  if (!roomCode) {
    console.log("Please enter a room code");
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "join",
        roomCode,
      }),
    );
  } else {
    console.log("Socket not open yet");
  }
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  console.log(message);

  if (message.type === "error") {
    console.log("Server error:", message.message);
    return;
  }

  if (message.type === "room-created") {
    window.appState.currentRoomCode = message.roomCode;
    window.appState.currentRole = "host";

    roomCodeContainer.textContent = message.roomCode;

    document.dispatchEvent(
      new CustomEvent("room-created", {
        detail: { roomCode: message.roomCode },
      }),
    );
  }

  if (message.type === "peer-joined") {
    document.dispatchEvent(new Event("peer-joined"));
  }

  if (message.type === "room-joined") {
      window.appState.currentRoomCode = message.roomCode;
      window.appState.currentRole = "listener";

      document.dispatchEvent(
        new CustomEvent("room-joined", {
          detail: { roomCode: message.roomCode },
        }),
      );
    }

  if (message.type === "duration-set") {
    console.log("Host selected duration:", message.duration);
  }

  if (message.type === "duration-updated") {
    console.log("Listener received duration:", message.duration);
  }
});



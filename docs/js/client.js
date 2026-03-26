const socket = new WebSocket("ws://localhost:8080");

//=============DOM elements=================
const roomCodeContainer = document.getElementById("room-code");
const roomCodeInput = document.getElementById("server-input");

const playPauseBtn = document.getElementById("melody-du-canada-play-btn");
const replayBtn = document.getElementById("melody-du-canada-replay-btn");

// ============= Audio =============
const soundControllers = {
  canadian: {
    audio: new Audio("audio/canadian_melody.wav"),
    playBtn: document.getElementById("melody-du-canada-play-btn"),
    replayBtn: document.getElementById("melody-du-canada-replay-btn"),
  },
  beep: {
    audio: new Audio("audio/beep_beep.wav"),
    playBtn: document.getElementById("beep-beep-play-btn"),
    replayBtn: document.getElementById("beep-beep-replay-btn"),
  },
  cuckoo: {
    audio: new Audio("audio/cuckoo.wav"),
    playBtn: document.getElementById("cuckoo-play-btn"),
    replayBtn: document.getElementById("cuckoo-replay-btn"),
  },
};

function setButtonState(soundName, isPlaying) {
  const controller = soundControllers[soundName];
  if (!controller) return;

  controller.playBtn.innerHTML = isPlaying
    ? '<span class="material-symbols-outlined">pause</span>'
    : '<span class="material-symbols-outlined">play_arrow</span>';

  controller.playBtn.classList.toggle("pause", isPlaying);
  controller.playBtn.classList.toggle("play", !isPlaying);
}

let currentSound = null;

function scheduleSound(soundName, startAt) {
  const controller = soundControllers[soundName];

  if (!controller) {
    console.error("Unknown sound:", soundName);
    return;
  }

  const { audio } = controller;
  const delay = startAt - Date.now();

  const playAudio = async () => {
    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
      console.log(`Playing ${soundName}`);
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  if (delay <= 0) {
    playAudio();
  } else {
    setTimeout(playAudio, delay);
  }
}

Object.entries(soundControllers).forEach(([soundName, controller]) => {
  controller.audio.addEventListener("ended", () => {
    if (currentSound === soundName) {
      currentSound = null;
    }
    setButtonState(soundName, false);
  });
});

function requestPlay(soundName) {
  if (window.appState.currentRole !== "host") {
    console.log("Only the host can start playback");
    return;
  }

  if (!window.appState.currentRoomCode) {
    console.log("No room code available");
    return;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    console.log("Socket not open");
    return;
  }

  socket.send(
    JSON.stringify({
      type: "play-sound",
      roomCode: window.appState.currentRoomCode,
      sound: soundName,
    }),
  );
}

soundControllers.canadian.playBtn.addEventListener("click", () => {
  requestPlay("canadian");
});

soundControllers.beep.playBtn.addEventListener("click", () => {
  requestPlay("beep");
});

soundControllers.cuckoo.playBtn.addEventListener("click", () => {
  requestPlay("cuckoo");
});

document.addEventListener("play-sound", () => {
  socket.send(
    JSON.stringify({
      type: "play-sound",
      roomCode: window.appState.currentRoomCode,
      sound: "canadian",
    }),
  );
});

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

  if (message.type === "play-sound") {
    scheduleSound(message.sound, message.startAt);
  }
});





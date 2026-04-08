import { appState } from "./appState.js";
import { sounds, unlockAllAudio } from "./sounds.js";

if (location.hostname !== "localhost") {
  console.log = function () {}; // Disables all console.logs on the live site
}

const WS_URL =
  location.hostname === "localhost"
    ? "ws://localhost:8080"
    : "wss://crosswalk-sound-sim-raamm-server.onrender.com";

const socket = new WebSocket(WS_URL);

//=============DOM elements=================
const roomCodeContainer = document.getElementById("room-code");
const roomCodeInput = document.getElementById("server-input");

// ============= Audio =============
const soundBtnControllers = {
  canadian: { playBtn: document.getElementById("melody-du-canada-play-btn") },
  beep: { playBtn: document.getElementById("beep-beep-play-btn") },
  cuckoo: { playBtn: document.getElementById("cuckoo-play-btn") },
};

function setButtonState(soundName, isPlaying) {
  const controller = soundBtnControllers[soundName];
  if (!controller) return;

  controller.playBtn.innerHTML = isPlaying
    ? '<span class="material-symbols-outlined">pause</span>'
    : '<span class="material-symbols-outlined">play_arrow</span>';

  controller.playBtn.classList.toggle("pause", isPlaying);
  controller.playBtn.classList.toggle("play", !isPlaying);

  controller.playBtn.setAttribute(
    "aria-label",
    isPlaying
      ? "Mettre en pause la mélodie"
      : "Jouer la mélodie"
  );
}

document.addEventListener("sound-playstate", (event) => {
  setButtonState(event.detail.name, event.detail.isPlaying);
});

function scheduleSound(baseSoundName, startAt) {
  let actualSoundName = baseSoundName;

  if (appState.currentDuration) {
    if (baseSoundName === "canadian") {
      actualSoundName = `canadian_melody_${appState.currentDuration}`; 
    } 
    else if (baseSoundName === "beep") {
      actualSoundName = `beep_${appState.currentDuration}`;
    }
    else if (baseSoundName === "cuckoo") {
      actualSoundName = `cuckoo_${appState.currentDuration}`;
    }
  }

  const sound = sounds[actualSoundName];
  
  if (!sound) {
    console.error(`Audio file not found for: ${actualSoundName}`);
    return;
  }
  
  sound.schedule(startAt);
}

let isThrottled = false;

function requestPlay(soundName) {
  if (isThrottled || appState.currentRole !== "host" || !appState.currentRoomCode || socket.readyState !== WebSocket.OPEN) return;

  isThrottled = true;
  setTimeout(() => { isThrottled = false; }, 500);

  socket.send(
    JSON.stringify({
      type: "prepare-sound",
      roomCode: appState.currentRoomCode,
      sound: soundName,
    }),
  );
}

function stopAllAudio() {
  Object.values(sounds).forEach((sound) => sound.cancel());
  Object.keys(soundBtnControllers).forEach((name) => setButtonState(name, false));
}

function broadcastStop(soundName) {
  if (
    appState.currentRole === "host" &&
    appState.currentRoomCode &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "stop-sound",
        roomCode: appState.currentRoomCode,
        sound: soundName || "all",
      }),
    );
  }
}

document.addEventListener("page-leaving", (event) => {
  if (event.detail.fromController) {
    broadcastStop();
  }
  stopAllAudio();
});

window.addEventListener("pagehide", () => {
  broadcastStop();
  stopAllAudio();
});

function handleSoundButtonClick(soundName) {
  const isPlaying = soundBtnControllers[soundName].playBtn.classList.contains("pause");

  stopAllAudio();       
  broadcastStop("all"); 

  if (!isPlaying) {
    requestPlay(soundName);
  }
}

soundBtnControllers.canadian.playBtn.addEventListener("click", () => handleSoundButtonClick("canadian"));
soundBtnControllers.beep.playBtn.addEventListener("click", () => handleSoundButtonClick("beep"));
soundBtnControllers.cuckoo.playBtn.addEventListener("click", () => handleSoundButtonClick("cuckoo"));

document.getElementById("create-server-btn").addEventListener("click", () => {
  unlockAllAudio(); 

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "create" }));
  }
});

document.getElementById("submit-btn").addEventListener("click", () => {
  unlockAllAudio();
  
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  let invalidCodeError = document.getElementById("invalid-code-error");

  if (!roomCode || roomCode.length > 6) {
    invalidCodeError.textContent = "Veillez entrer un code valide.";
    invalidCodeError.classList.remove("hidden");
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "join",
        roomCode,
      }),
    );
  }
});

// Hide the error message as soon as the user starts typing a new code
roomCodeInput.addEventListener("input", () => {
  const invalidCodeError = document.getElementById("invalid-code-error");
  if (invalidCodeError) {
    invalidCodeError.classList.add("hidden");
  }
});

function displayInactivityOverlay() {
  const overlay = document.getElementById("inactivity-overlay");
  const reloadBtn = document.getElementById("inactivity-reload-btn");
  const mainContent = document.getElementById("main-app-content");

  if (overlay) {
    overlay.classList.remove("hidden"); // Reveal the overlay
    
    if (mainContent) {
      mainContent.setAttribute("inert", ""); 
      mainContent.setAttribute("aria-hidden", "true"); 
    }

    if (reloadBtn) {
      reloadBtn.focus();
    }
  }
}

socket.addEventListener("message", (event) => {
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    console.error("Received invalid JSON from server");
    return;
  }

  if (message.type === "ping") {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "pong" }));
    }
    return; 
  }

  if (message.type === "error") {
    const errorMsg = message.message;

    // 1. Handle Room Inactivity
    if (errorMsg === "Room closed due to inactivity") {
      displayInactivityOverlay(); 
      return;
    }

    // 2. Handle Duplicate Room Creation
    if (errorMsg === "You already have a room") {
      document.dispatchEvent(new CustomEvent("navigate-to", { detail: { page: "home" } }));
      return;
    }

    // 3. Handle Invalid/Missing Rooms
    if (errorMsg.includes("not found") || errorMsg.includes("Invalid room code")) {
      const errorElement = document.getElementById("invalid-code-error");
      errorElement.textContent = "Le code soumis est invalide ou la salle n'existe plus.";
      errorElement.classList.remove("hidden");
      return;
    }

    // 4. Handle Full Rooms
    if (errorMsg === "Room is full") {
      const errorElement = document.getElementById("invalid-code-error");
      errorElement.textContent = "Cette salle est déjà complète.";
      errorElement.classList.remove("hidden");
      return;
    }

    return;
  }

  if (message.type === "room-created") {
    appState.currentRoomCode = message.roomCode;
    appState.currentRole = "host";

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
      appState.currentRoomCode = message.roomCode;
      appState.currentRole = "listener";

      document.dispatchEvent(
        new CustomEvent("room-joined", {
          detail: { roomCode: message.roomCode },
        }),
      );
    }

  if (message.type === "duration-set") {
    appState.currentDuration = message.duration;
  }

  if (message.type === "duration-updated") {
    appState.currentDuration = message.duration;
  }

  if (message.type === "prepare-sound") {
    if (appState.currentRole === "listener") {
      // Listener is now primed and waiting — notify host
      socket.send(
        JSON.stringify({
          type: "listener-ready",
          roomCode: appState.currentRoomCode,
          sound: message.sound,
        }),
      );
    }
    // Host receives this too but just waits for listener-ready
  }

  if (message.type === "listener-ready") {
    // Host receives this — both devices are ready, now trigger play
    socket.send(
      JSON.stringify({
        type: "play-sound",
        roomCode: appState.currentRoomCode,
        sound: message.sound,
      }),
    );
  }

  if (message.type === "play-sound") {
    scheduleSound(message.sound, message.startAt);
  }

  if (message.type === "stop-sound") {
    stopAllAudio();
  }

  if (message.type === "room-closed") {
    stopAllAudio();


    if (appState.currentRoomCode) {
      appState.currentRoomCode = null;
      appState.currentRole = null;
      document.dispatchEvent(new CustomEvent("navigate-to", { detail: { page: "landing" } }));
    }
  }
});

export { socket, stopAllAudio, scheduleSound, appState };
import { appState } from "./appState.js";
import { socket, stopAllAudio } from "./client.js";

//==========DOM elements============
//buttons
const startButton = document.getElementById("start-btn");
const instructionButton = document.getElementById("instruction-btn");
const createServerButton = document.getElementById("create-server-btn");
const rejoindreServerButton = document.getElementById("rejoindre-sever-btn");
const waitRoomButton = document.getElementById("wait-room-btn");
const allezAuSimulateurButton = document.getElementById("allez-au-simulateur-btn");

//back buttons
const backToLanding1 = document.getElementById("back-to-landing-1");
const backToLanding2 = document.getElementById("back-to-landing-2");
const backToHome = document.getElementById("back-to-home");
const backToWaitingRoom = document.getElementById("back-to-waiting-room");
const backToDuration = document.getElementById("back-to-duration");
const backToHomeFromJoiningRoom = document.getElementById("back-to-home-from-joining-room");
const backToJoiningRoom = document.getElementById("back-to-joining-room");

//landing page
const landingPage = document.getElementById("landing");
const landingHeading = document.getElementById("landing-heading");

//instruction page
const instructionPage = document.getElementById("instruction");
const instructionHeading = document.getElementById("instruction-heading");

//home page
const homePage = document.getElementById("home");
const homeHeading = document.getElementById("home-heading");


//waiting room
const waitingRoomPage = document.getElementById("waiting-room");
const waitingRoomHeading = document.getElementById("waiting-room-heading");

//duration
const durationPage = document.getElementById("duration");
const durationHeading = document.getElementById("duration-heading");

//controller
const controllerPage = document.getElementById("controller");
const controllerHeading = document.getElementById("controller-heading");

//joining room
const joiningRoomPage = document.getElementById("joining-room");
const joiningRoomHeading = document.getElementById("joining-room-heading");

//listener
const listenerPage = document.getElementById("listener");
const listenerHeading = document.getElementById("listener-heading");
const listenerRoomCode = document.getElementById("room-code-listener");

//loading
const loadingPage = document.getElementById("loading");
const loadingError = document.getElementById("loading-error");
const retryBtn = document.getElementById("retry-btn");

socket.addEventListener("open", () => {
  loadingError.classList.add("hidden");
  retryBtn.classList.add("hidden");
  navigateTo(landingPage, landingHeading);
});

socket.addEventListener("close", () => {
  if (currentPage !== loadingPage) {
    navigateTo(loadingPage, document.getElementById("loading-heading"));
  }
  loadingError.classList.remove("hidden");
  retryBtn.classList.remove("hidden");
});

socket.addEventListener("error", () => {
  loadingError.classList.remove("hidden");
  retryBtn.classList.remove("hidden");
});

retryBtn.addEventListener("click", () => {
  window.location.reload();
});

//==========Page navigation functions==========
let currentPage = loadingPage;
let documentTitle = document.getElementsByTagName("title")[0];

function navigateTo(targetPage, targetHeading) {
  // Signal the audio file to stop and broadcast
  document.dispatchEvent(new CustomEvent("page-leaving", {
    detail: {
      fromController: currentPage === controllerPage,
      fromListener: currentPage === listenerPage,
    }
  }));

  currentPage.classList.add("hidden");
  currentPage.inert = true;

  targetPage.classList.remove("hidden");
  targetPage.inert = false;

  currentPage = targetPage;

  targetHeading.setAttribute("tabindex", "-1");
  targetHeading.focus();

  // Update the document title based on the target page
  switch (targetPage) {
    case landingPage:
      documentTitle.textContent = "Simulateur de feux sonores - RAAMM";
      break;
    case homePage:
      documentTitle.textContent = "Menu - Simulateur de feux sonores - RAAMM";
      break;
    case waitingRoomPage:
      documentTitle.textContent = "Salle d'attente - Simulateur de feux sonores - RAAMM";
      break;
    case durationPage:
      documentTitle.textContent = "Durée - Simulateur de feux sonores - RAAMM";
      break;
    case controllerPage:
      documentTitle.textContent = "Contrôleur - Simulateur de feux sonores - RAAMM";
      break;
    case joiningRoomPage:
      documentTitle.textContent = "Rejoindre une salle - Simulateur de feux sonores - RAAMM";
      break;
    case listenerPage:
      documentTitle.textContent = "Écouteur - Simulateur de feux sonores - RAAMM";
      break;
    case instructionPage:
      documentTitle.textContent ="Mode d'emploi - Simulateur de feux sonores - RAAMM"
    default:
      documentTitle.textContent = "Simulateur de feux sonores - RAAMM";
  }
}

// ==============Event listeners===============
// landing to home page
startButton.addEventListener("click", () => {
  navigateTo(homePage, homeHeading);
});

//home to instruction page
instructionButton.addEventListener("click", () => {
  navigateTo(instructionPage, instructionHeading);
});

document.addEventListener("room-created", (event) => {
  navigateTo(waitingRoomPage, waitingRoomHeading);
});

//waiting room to duration page
waitRoomButton.addEventListener("click", () => {
  navigateTo(durationPage, durationHeading);
});

// button to go to duration when both have joined a room
document.addEventListener("peer-joined", () => {
  waitRoomButton.classList.remove("hidden");
});

//duration to controler page
allezAuSimulateurButton.addEventListener("click", () => {
  navigateTo(controllerPage, controllerHeading);
});

//home to joining room page
rejoindreServerButton.addEventListener("click", () => {
  navigateTo(joiningRoomPage, joiningRoomHeading);
});

document.addEventListener("room-joined", (event) => {
	listenerRoomCode.textContent = event.detail.roomCode;
  navigateTo(listenerPage, listenerHeading);
});

const announcer = document.getElementById("announcer");

document.addEventListener("navigate-to", (event) => {
  stopAllAudio();
  if (event.detail.page === "landing") {
    // Clear first so it re-triggers if the same message fires twice
    announcer.textContent = "";
    requestAnimationFrame(() => {
      announcer.textContent =
        "Vous avez été déconnecté de la salle. Retour à l'accueil.";
    });
    navigateTo(landingPage, landingHeading);
  }
  else if (event.detail.page === "home") {
    // Clear first so it re-triggers if the same message fires twice
    announcer.textContent = "";
    requestAnimationFrame(() => {
      announcer.textContent =
        "Vous avez été déconnecté de la salle. Retour à l'accueil.";
    });
    navigateTo(homePage, homeHeading);
  }
});

//===========BACK BUTTON===============

//back to landing
backToLanding1.addEventListener("click", () => {
  navigateTo(landingPage, landingHeading);
});

//back to landing
backToLanding2.addEventListener("click", () => {
  navigateTo(landingPage, landingHeading);
});

// back to home page
backToHome.addEventListener("click", () => {
  if (
    appState.currentRoomCode &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "leave-room",
        roomCode: appState.currentRoomCode,
      })
    );
    appState.currentRoomCode = null;
    appState.currentRole = null;
  }
  navigateTo(homePage, homeHeading);
});
//back to waiting room
backToWaitingRoom.addEventListener("click", () => {
  navigateTo(waitingRoomPage, waitingRoomHeading);
});

//back to duration page
backToDuration.addEventListener("click", () => {
  navigateTo(durationPage, durationHeading);
});

//back to joining room page (Listener leaves)
backToJoiningRoom.addEventListener("click", () => {
  // Tell the server to open up the spot!
  if (appState.currentRoomCode && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "leave-room",
        roomCode: appState.currentRoomCode,
      })
    );
  }
  
  // Clear the listener's memory
  appState.currentRoomCode = null;
  appState.currentRole = null;

  // Navigate back
  navigateTo(joiningRoomPage, joiningRoomHeading);
});

// back to home page from joining room
backToHomeFromJoiningRoom.addEventListener("click", () => {
  navigateTo(homePage, homeHeading);
});

//=======DURATION BUTTONS=====

const buttons = document.querySelectorAll(
  "#duration button:not(#allez-au-simulateur-btn):not(#back-to-waiting-room)"
);
//loop through all buttons in class duration-button
buttons.forEach(button => {
  button.addEventListener("click", () => {

    //unselectes all buttons
    buttons.forEach(btn => {
      btn.classList.remove("selected");
      btn.classList.add("unselected");
      btn.setAttribute("aria-pressed", "false"); 

    });

    //selected button that was clicked
    button.classList.remove("unselected");
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true"); 

  });
});
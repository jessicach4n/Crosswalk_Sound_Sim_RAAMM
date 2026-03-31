//==========DOM elements============
//buttons
const startButton = document.getElementById("start-btn");
const createServerButton = document.getElementById("create-server-btn");
const rejoindreServerButton = document.getElementById("rejoindre-sever-btn");
const waitRoomButton = document.getElementById("wait-room-btn");
const allezAuSimulateurButton = document.getElementById("allez-au-simulateur-btn");
const sudmitButton = document.getElementById("submit-btn");

//back buttons
const backToLanding = document.getElementById("back-to-landing");
const backToHome = document.getElementById("back-to-home");
const backToWaitingRoom = document.getElementById("back-to-waiting-room");
const backToDuration = document.getElementById("back-to-duration");
const backToHomeFromJoiningRoom = document.getElementById("back-to-home-from-joining-room");
const backToJoiningRoom = document.getElementById("back-to-joining-room");

//landing page
const landingPage = document.getElementById("landing");
const landingHeading = document.getElementById("landing-heading");

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

//==========Page navigation functions==========
let currentPage = landingPage;

function navigateTo(targetPage, targetHeading) {
  stopAllAudio(); 

  // Hide landing page and show home page
  currentPage.classList.add("hidden");
  targetPage.classList.remove("hidden");

  // Set new current page
  currentPage = targetPage;

  // Make it focusable and force VoiceOver to read the new screen's title
  targetHeading.setAttribute("tabindex", "-1");
  targetHeading.focus();
}

// ==============Event listeners===============
// landing to home page
startButton.addEventListener("click", () => {
  navigateTo(homePage, homeHeading);
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
  listenerRoomCode.innerHTML = `${event.detail.roomCode}`;
  navigateTo(listenerPage, listenerHeading);
});

//===========BACK BUTTON===============

//back to landing
backToLanding.addEventListener("click", () => {
  navigateTo(landingPage, landingHeading);
});
// back to home page
backToHome.addEventListener("click", () => {
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

//back to joining room page
backToJoiningRoom.addEventListener("click", () => {
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
    });

    //selected button that was clicked
    button.classList.remove("unselected");
    button.classList.add("selected");
  });
});
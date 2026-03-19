// 1. WEBSOCKET SETUP: Connect to the server
const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", () => {
  console.log("Connected to the server!");
});

// 2. DOM elements 
const startButton = document.getElementById("start-btn");

const landingPage = document.getElementById("landing");
const landingHeading = document.getElementById("landing-heading");

const homePage = document.getElementById("home");
const homeHeading = document.getElementById("home-heading");

// 3. Page navigation functions
let currentPage = landingPage;

function navigateTo(targetPage, targetHeading) {
  // Hide landing page and show home page
  currentPage.classList.add("hidden");
  targetPage.classList.remove("hidden");
  
  // Set new current page
  currentPage = targetPage;

  // Make it focusable and force VoiceOver to read the new screen's title
  targetHeading.setAttribute("tabindex", "-1"); 
  targetHeading.focus();
}

// 4. Event listeners
startButton.addEventListener("click", () => {
  navigateTo(homePage, homeHeading);
});


/*SIMULATE SERVER CODE TO DELETE */
const roomCodeContainer = document.getElementById("room-code");
const waitRoomBtn = document.getElementById("wait-room-btn");

const roomCode = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
roomCodeContainer.textContent = roomCode;

setTimeout(() => {
  waitRoomBtn.textContent = "Suivant";
}, 2000);

//display server nb according to user input
let server_nb_input;
document.getElementById("submit-btn").onclick = function () {
  server_nb_input = document.getElementById("server-input").value;
  console.log(server_nb_input);
  document.getElementById("server-nb").textContent = server_nb_input;
};

//======= duration buttons=====

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

/* AUDIO */

// Melody du canada
const audio = new Audio("audio/canadian_melody.wav")
const playPauseBtn = document.getElementById("melody-du-canada-play-btn");
const audioStatus = document.getElementById("audio-status");
const replayBtn = document.getElementById("melody-du-canada-replay-btn");

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = ` <span class="material-symbols-outlined">pause</span>`; //change to pause icon
    playPauseBtn.classList.remove("play");
    playPauseBtn.classList.add("pause");
  } else {
    audio.pause();
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`; // chnage to play icon
    playPauseBtn.classList.remove("pause");
    playPauseBtn.classList.add("play");
  }
});

// Optional: when audio ends, reset button text
audio.addEventListener("ended", () => {
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`; // chnage to play icon
});

// Replay on click
replayBtn.addEventListener("click", () => {
  audio.currentTime = 0;
  audio.play();
});



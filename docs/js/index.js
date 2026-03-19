document.addEventListener("DOMContentLoaded", () => {
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
  document.getElementById("submit").onclick = function () {
    server_nb_input = document.getElementById("server-input").value;
    console.log(server_nb_input);
    document.getElementById("server-nb").textContent = server_nb_input;
  };

  /* AUDIO */
  const audio = new Audio("audio/canadian_melody.wav")
  const playPauseBtn = document.getElementById("play-btn");
  const audioStatus = document.getElementById("audio-status");
  const replayBtn = document.querySelector("replay-btn");

  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.textContent = "Pause"; // change button text
      playPauseBtn.classList.remove("play");
      playPauseBtn.classList.add("pause");
    } else {
      audio.pause();
      playPauseBtn.textContent = "Jouez"; // change button text
      playPauseBtn.classList.remove("pause");
      playPauseBtn.classList.add("play");
    }
  });

  // Optional: when audio ends, reset button text
  audio.addEventListener("ended", () => {
    playPauseBtn.textContent = "Jouez";
  });

  // Replay on click
  replayBtn.addEventListener("click", () => {
    audio.currentTime = 0;
    audio.play();
  });

});

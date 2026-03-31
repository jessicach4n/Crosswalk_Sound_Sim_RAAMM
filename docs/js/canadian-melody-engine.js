// ============= Canadian Melody =============
const canadianAudio = new Audio("audio/canadian_melody.wav");

function cancelCanadianMelody() {
  canadianAudio.pause();
  canadianAudio.currentTime = 0;
  setButtonState("canadian", false);
}

function scheduleCanadianMelody(startAt) {
  cancelCanadianMelody();

  const play = async () => {
    try {
      canadianAudio.currentTime = 0;
      await canadianAudio.play();
      setButtonState("canadian", true);
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  const delay = startAt - Date.now();
  if (delay <= 0) {
    play();
  } else {
    setTimeout(play, delay);
  }
}

canadianAudio.addEventListener("ended", () => {
  setButtonState("canadian", false);
});
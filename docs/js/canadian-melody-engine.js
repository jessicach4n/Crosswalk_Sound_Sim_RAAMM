const canadianAudio = new Audio("audio/canadian_melody.wav");
let canadianTimer = null;

export function cancelCanadianMelody() {
  if (canadianTimer) {
    clearTimeout(canadianTimer);
    canadianTimer = null;
  }
  canadianAudio.pause();
  canadianAudio.currentTime = 0;
  document.dispatchEvent(new CustomEvent("canadian-playstate", { detail: { isPlaying: false } }));
}

export function scheduleCanadianMelody(startAt) {
  cancelCanadianMelody();

  const play = async () => {
    try {
      canadianAudio.currentTime = 0;
      await canadianAudio.play();
      document.dispatchEvent(new CustomEvent("canadian-playstate", { detail: { isPlaying: true } }));
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  const delay = startAt - Date.now();
  if (delay <= 0) {
    play();
  } else {
    canadianTimer = setTimeout(play, delay);
  }
}

canadianAudio.addEventListener("ended", () => {
  canadianTimer = null;
  document.dispatchEvent(new CustomEvent("canadian-playstate", { detail: { isPlaying: false } }));
});
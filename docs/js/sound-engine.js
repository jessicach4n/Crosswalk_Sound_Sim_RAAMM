export class SoundEngine {
  #audio;
  #timer = null;
  #name;

  constructor(name, src) {
    this.#name = name;
    this.#audio = new Audio(src);

    this.#audio.addEventListener("ended", () => {
      this.#timer = null;
      this.#dispatch(false);
    });
  }

  unlock() {
    this.#audio.play().then(() => {
      this.#audio.pause();
      this.#audio.currentTime = 0;
    }).catch((err) => {
      console.log(`Unlock failed for ${this.#name}, user might need to click again`, err);
    });
  }

  schedule(startAt) {
    this.cancel();

    const play = async () => {
      try {
        this.#audio.currentTime = 0;
        await this.#audio.play();
        this.#dispatch(true);
      } catch (err) {
        console.error(`Audio play failed for ${this.#name}:`, err);
      }
    };

    const delay = startAt - Date.now();
    if (delay <= 0) {
      play();
    } else {
      this.#timer = setTimeout(play, delay);
    }
  }

  cancel() {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#audio.pause();
    this.#audio.currentTime = 0;
    this.#dispatch(false);
  }

  #dispatch(isPlaying) {
    document.dispatchEvent(
      new CustomEvent("sound-playstate", {
        detail: { name: this.#name, isPlaying },
      }),
    );
  }
}

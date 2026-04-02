import { SoundEngine } from "./sound-engine.js";

export const sounds = {
  canadian: new SoundEngine("canadian", "audio/canadian_melody.wav"),
  beep: new SoundEngine("beep", "audio/beep_beep.wav"),
  cuckoo: new SoundEngine("cuckoo", "audio/cuckoo.wav"),
};
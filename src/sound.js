/**
 * Lightweight sound effects using the Web Audio API.
 *
 * No audio files needed — we synthesize short tones on the fly. The audio
 * context is created lazily on the first sound so browsers don't block it.
 */
(function (HM) {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (ctx == null) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Play a single tone. type: sine|square|triangle|sawtooth
  function tone(freq, start, duration, type, gainValue) {
    const audio = getCtx();
    if (!audio) return;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;

    const t0 = audio.currentTime + start;
    const g = gainValue == null ? 0.18 : gainValue;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(g, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  // Play a sequence of [freq, duration] notes back to back.
  function sequence(notes, type) {
    let t = 0;
    notes.forEach(([freq, dur]) => {
      tone(freq, t, dur, type);
      t += dur;
    });
  }

  const sounds = {
    click: () => tone(420, 0, 0.06, "triangle", 0.08),
    correct: () => sequence([[660, 0.09], [880, 0.12]], "sine"),
    wrong: () => sequence([[200, 0.18], [150, 0.2]], "sawtooth"),
    hint: () => sequence([[700, 0.07], [900, 0.07], [1100, 0.1]], "triangle"),
    start: () => sequence([[523, 0.09], [659, 0.09], [784, 0.12]], "sine"),
    win: () =>
      sequence([[523, 0.12], [659, 0.12], [784, 0.12], [1046, 0.28]], "sine"),
    lose: () =>
      sequence([[392, 0.18], [330, 0.18], [262, 0.18], [196, 0.4]], "sawtooth"),
  };

  const Sound = {
    play(name) {
      if (!enabled) return;
      const fn = sounds[name];
      if (fn) fn();
    },
    setEnabled(value) {
      enabled = !!value;
    },
    isEnabled() {
      return enabled;
    },
  };

  HM.Sound = Sound;
})(window.HM);

// ponytail: Web Audio API — zero dependencies, works in all modern browsers
// AudioContext created lazily on first user interaction (complies with autoplay policy)

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function playBeep(): void {
  // ponytail: Web Audio API — 3-pulse square-wave burst, no dependencies
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const PULSE_MS = 150;
    const GAP_MS = 150;
    const FREQS = [1000, 1300, 1000];
    const VOLUME = 0.5;

    FREQS.forEach((freq, i) => {
      const tStart = now + (i * (PULSE_MS + GAP_MS)) / 1000;
      const tEnd = tStart + PULSE_MS / 1000;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, tStart);
      gain.gain.setValueAtTime(VOLUME, tStart);
      gain.gain.exponentialRampToValueAtTime(0.001, tEnd);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(tStart);
      osc.stop(tEnd);
    });
  } catch {
    // Audio not available — silently ignore
  }
}

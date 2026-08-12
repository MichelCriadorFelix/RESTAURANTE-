let ringInterval: any = null;
let ringAudioContext: any = null;
let ringBlobUrlPromise: Promise<string> | null = null;

// A single <audio> element, kept playing continuously (never paused) once
// the admin dashboard is open — only its volume changes between "quiet
// ambient loop" and "loud ring". Browsers exempt a tab that's *already*
// actively playing media from the background throttling that otherwise
// pauses timers/network listeners (including the Firestore onSnapshot
// connection) once the app is minimized. Pausing and restarting on demand
// doesn't get this exemption — the trick only works if it never stops.
let persistentAudioEl: HTMLAudioElement | null = null;
const KEEPALIVE_VOLUME = 0.03;
const RING_VOLUME = 1.0;

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeWavMono(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
}

function scheduleRingTone(ctx: OfflineAudioContext | AudioContext, time: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'square';
  osc1.frequency.setValueAtTime(440, time);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(480, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.05);
  gain.gain.setValueAtTime(0.8, time + 0.35);
  gain.gain.linearRampToValueAtTime(0, time + 0.4);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.4);
  osc2.stop(time + 0.4);
}

// Pre-renders the ring tone into a real WAV file (once, cached) instead of
// synthesizing it live with the Web Audio API. Mobile browsers throttle
// setInterval/AudioContext heavily once a tab loses focus (e.g. the admin
// switches to WhatsApp), but they treat an actual <audio>/<video> element as
// media playback and let it keep running in the background — the same
// exemption that lets a background music tab keep playing.
async function renderRingToneBlobUrl(): Promise<string> {
  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error('OfflineAudioContext not supported');

  const sampleRate = 44100;
  const durationSeconds = 1;
  const offlineCtx = new OfflineCtx(1, Math.ceil(sampleRate * durationSeconds), sampleRate);

  scheduleRingTone(offlineCtx, 0);
  scheduleRingTone(offlineCtx, 0.5);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = encodeWavMono(renderedBuffer.getChannelData(0), sampleRate);
  return URL.createObjectURL(wavBlob);
}

async function ensurePersistentAudio(): Promise<HTMLAudioElement> {
  if (!ringBlobUrlPromise) {
    ringBlobUrlPromise = renderRingToneBlobUrl();
  }
  const url = await ringBlobUrlPromise;

  if (!persistentAudioEl) {
    persistentAudioEl = new Audio(url);
    persistentAudioEl.loop = true;
  }
  return persistentAudioEl;
}

function setMediaSessionMetadata(ringing: boolean) {
  if (!('mediaSession' in navigator)) return;
  try {
    (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
      title: ringing ? 'Novo Pedido Recebido!' : 'Painel do Restaurante Ativo',
      artist: ringing ? 'Toque para abrir o painel' : 'Aguardando novos pedidos',
    });
    (navigator as any).mediaSession.setActionHandler('pause', () => stopRing());
    (navigator as any).mediaSession.setActionHandler('stop', () => stopRing());
  } catch (e) { /* mediaSession is best-effort */ }
}

// Call once when the admin dashboard mounts. Starts the quiet ambient loop
// immediately (rather than waiting for the first real order) so the tab
// already qualifies for the background-media exemption by the time an
// order actually comes in — starting it only in reaction to an order is
// too late, since detecting that order in the first place depends on the
// same exemption keeping the Firestore listener alive.
export async function startBackgroundKeepAlive() {
  try {
    const audio = await ensurePersistentAudio();
    audio.volume = KEEPALIVE_VOLUME;
    setMediaSessionMetadata(false);
    if (audio.paused) {
      await audio.play();
    }
  } catch (e) {
    // Autoplay blocked (no user gesture yet on this page load) — startRing()
    // will retry when a real order arrives, and playLoudRing() covers the
    // foreground case either way.
  }
}

export async function startRing() {
  try {
    const audio = await ensurePersistentAudio();
    audio.volume = RING_VOLUME;
    setMediaSessionMetadata(true);
    if (audio.paused) {
      await audio.play();
    }
  } catch (e) {
    // Autoplay blocked, or WAV rendering unsupported — fall back to the
    // original WebAudio loop, which still works while the tab is focused.
    if (!ringInterval) {
      playLoudRing();
      ringInterval = setInterval(() => {
        playLoudRing();
      }, 2500);
    }
  }
}

export function stopRing() {
  if (persistentAudioEl && !persistentAudioEl.paused) {
    // Drop back to the quiet ambient loop instead of pausing — pausing
    // would give up the background-media exemption the keep-alive exists
    // for, right until the next order needs it again.
    persistentAudioEl.volume = KEEPALIVE_VOLUME;
    setMediaSessionMetadata(false);
  }
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

// Fully stops the keep-alive loop — call this when leaving the admin
// dashboard entirely (unlike stopRing(), which just drops back to the quiet
// loop so the next order can still be detected while the dashboard stays
// open).
export function stopBackgroundKeepAlive() {
  if (persistentAudioEl) {
    persistentAudioEl.pause();
    persistentAudioEl.currentTime = 0;
  }
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

function playLoudRing() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    if (!ringAudioContext) {
      ringAudioContext = new AudioContext();
    }
    const ctx = ringAudioContext;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    scheduleRingTone(ctx, now);
    scheduleRingTone(ctx, now + 0.5);
  } catch(e) {}
}

/**
 * Audio notification utility using pure Web Audio API synthesizer.
 * This guarantees loud, clear, instant, and cross-platform notification chimes
 * without relying on static file hosting or assets.
 */
export function playNotificationSound(type: 'new_order' | 'new_message' | 'status_change') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    if (type === 'new_order') {
      // Ascending triple-note triumphant chime for a new order
      const now = ctx.currentTime;

      // Note 1: C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Note 2: E5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      gain2.gain.setValueAtTime(0.6, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15 + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.15 + 0.4);

      // Note 3: G5 (Loudest and holds longest)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.3);
      gain3.gain.setValueAtTime(0.8, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + 0.65);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 0.3 + 0.7);

    } else if (type === 'new_message') {
      // Friendly, snappy bubble pop or crisp double beep for a new message
      const now = ctx.currentTime;

      // Tap 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(600, now);
      osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tap 2 (rapid offset)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(800, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.08 + 0.1);
      gain2.gain.setValueAtTime(0.5, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08 + 0.15);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.08 + 0.2);

    } else if (type === 'status_change') {
      // Elegant success slide-up chime for a status progression
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // slide to A5

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.error('Failed to play synthesized notification sound', err);
  }
}

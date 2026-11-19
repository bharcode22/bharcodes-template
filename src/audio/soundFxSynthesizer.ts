import { useEffect, useState } from 'react';

const SAMPLE_RATE = 44100;
const BASE_FPS = 30;

const wavBlobCache = new Map<string, Promise<Blob>>();
const wavUrlCache = new Map<string, string>();

function fToSec(tFrame: number): number {
  return Math.max(0, tFrame / BASE_FPS);
}

function createNoiseBuffer(
  ctx: OfflineAudioContext,
  durationSec: number
): AudioBuffer {
  const length = Math.max(1, Math.floor(durationSec * SAMPLE_RATE));
  const buffer = ctx.createBuffer(1, length, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  // Deterministic soft pink-tinted noise (consistent across renders)
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let seed = 133791;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
  }
  return buffer;
}

function connectPanned(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  pan: number
): StereoPannerNode {
  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), 0);
  panner.connect(dest);
  return panner;
}

// Smooth silky air-whoosh (bandpass filtered noise + subtle sub glide)
function scheduleWhoosh(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  startSec: number,
  durationSec: number,
  startFreq: number,
  endFreq: number,
  gainPeak: number,
  pan = 0
): void {
  const panner = connectPanned(ctx, dest, pan);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.setValueAtTime(1.6, startSec);
  filter.frequency.setValueAtTime(startFreq, startSec);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(80, endFreq),
    startSec + durationSec
  );

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startSec);
  env.gain.linearRampToValueAtTime(gainPeak, startSec + durationSec * 0.32);
  env.gain.exponentialRampToValueAtTime(0.0001, startSec + durationSec);

  noise.connect(filter);
  filter.connect(env);
  env.connect(panner);
  noise.start(startSec);
  noise.stop(startSec + durationSec + 0.02);

  // Subtle warm air tone underneath
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(Math.max(55, startFreq * 0.22), startSec);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(55, endFreq * 0.22),
    startSec + durationSec
  );

  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.0001, startSec);
  toneGain.gain.linearRampToValueAtTime(
    gainPeak * 0.28,
    startSec + durationSec * 0.35
  );
  toneGain.gain.exponentialRampToValueAtTime(0.0001, startSec + durationSec);

  osc.connect(toneGain);
  toneGain.connect(panner);
  osc.start(startSec);
  osc.stop(startSec + durationSec + 0.02);
}

// Soft Apple-style glassy pop / droplet chime
function scheduleGlassPop(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startSec: number,
  freq: number,
  gainPeak: number,
  durationSec = 0.19,
  pan = 0
): void {
  const panner = connectPanned(ctx, dest, pan);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 0.92, startSec);
  osc.frequency.exponentialRampToValueAtTime(freq, startSec + 0.022);

  const harmonic = ctx.createOscillator();
  harmonic.type = 'triangle';
  harmonic.frequency.setValueAtTime(freq * 2, startSec);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2800, startSec);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startSec);
  env.gain.linearRampToValueAtTime(gainPeak, startSec + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, startSec + durationSec);

  const harmGain = ctx.createGain();
  harmGain.gain.setValueAtTime(0.18, startSec);

  osc.connect(lp);
  harmonic.connect(harmGain);
  harmGain.connect(lp);
  lp.connect(env);
  env.connect(panner);

  osc.start(startSec);
  harmonic.start(startSec);
  osc.stop(startSec + durationSec + 0.02);
  harmonic.stop(startSec + durationSec + 0.02);
}

// Multi-harmonic warm shimmer chord / chime
function scheduleShimmerChime(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startSec: number,
  freqs: number[],
  gainPeak: number,
  durationSec = 0.55,
  pan = 0
): void {
  const perVoice = gainPeak / Math.max(1, freqs.length);
  freqs.forEach((f, idx) => {
    const panner = connectPanned(
      ctx,
      dest,
      pan + (idx - (freqs.length - 1) / 2) * 0.14
    );
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, startSec);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startSec);
    env.gain.linearRampToValueAtTime(perVoice, startSec + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, startSec + durationSec);

    osc.connect(env);
    env.connect(panner);
    osc.start(startSec);
    osc.stop(startSec + durationSec + 0.02);
  });
}

// Soft dampened Apple Magic Keyboard tap
function scheduleKeyTap(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  startSec: number,
  pitchMul: number,
  gainPeak: number,
  isSpace = false
): void {
  const panner = connectPanned(ctx, dest, (pitchMul - 1) * 0.6);

  // Tactile switch click
  const click = ctx.createBufferSource();
  click.buffer = noiseBuffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime((isSpace ? 1100 : 2100) * pitchMul, startSec);
  bp.Q.setValueAtTime(2.4, startSec);

  const clickEnv = ctx.createGain();
  clickEnv.gain.setValueAtTime(0.0001, startSec);
  clickEnv.gain.linearRampToValueAtTime(gainPeak * 0.9, startSec + 0.002);
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, startSec + 0.022);

  click.connect(bp);
  bp.connect(clickEnv);
  clickEnv.connect(panner);
  click.start(startSec);
  click.stop(startSec + 0.03);

  // Soft keycap thud
  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime((isSpace ? 135 : 195) * pitchMul, startSec);
  thud.frequency.exponentialRampToValueAtTime(68, startSec + 0.028);

  const thudEnv = ctx.createGain();
  thudEnv.gain.setValueAtTime(0.0001, startSec);
  thudEnv.gain.linearRampToValueAtTime(gainPeak * 0.55, startSec + 0.002);
  thudEnv.gain.exponentialRampToValueAtTime(0.0001, startSec + 0.032);

  thud.connect(thudEnv);
  thudEnv.connect(panner);
  thud.start(startSec);
  thud.stop(startSec + 0.04);
}

// Gentle telemetry sonar / heartbeat pulse
function scheduleTelemetryPing(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startSec: number,
  freq: number,
  gainPeak: number,
  pan = 0
): void {
  const panner = connectPanned(ctx, dest, pan);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startSec);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.985, startSec + 0.14);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startSec);
  env.gain.linearRampToValueAtTime(gainPeak, startSec + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, startSec + 0.16);

  osc.connect(env);
  env.connect(panner);
  osc.start(startSec);
  osc.stop(startSec + 0.18);
}

function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const arrayBuf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuf);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuf], { type: 'audio/wav' });
}

export type SfxPreset = 'mqtt' | 'sse';

async function synthesizeMqttWebSocketSfx(
  durationSeconds = 34
): Promise<Blob> {
  const safeDuration = Math.max(10, Math.min(180, durationSeconds));
  const totalSamples = Math.ceil(safeDuration * SAMPLE_RATE);
  const ctx = new OfflineAudioContext(2, totalSamples, SAMPLE_RATE);

  // Master compressor + gentle low-pass warmth so nothing ever clips or sounds harsh
  const masterCompressor = ctx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-14, 0);
  masterCompressor.knee.setValueAtTime(16, 0);
  masterCompressor.ratio.setValueAtTime(3.5, 0);
  masterCompressor.attack.setValueAtTime(0.004, 0);
  masterCompressor.release.setValueAtTime(0.18, 0);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.88, 0);

  masterCompressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  const noiseBuffer = createNoiseBuffer(ctx, 2.5);

  // --------------------------------------------------------------------------
  // SCENE 1 (0 - 98f): Right-to-Left Kinetic Glass Cards [0,15,24,36,43,48,57]
  // --------------------------------------------------------------------------
  const s1Cues = [0, 15, 24, 36, 43, 48, 57];
  const s1Notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 1046.5];
  s1Cues.forEach((cue, i) => {
    const t = fToSec(cue);
    scheduleWhoosh(ctx, masterCompressor, noiseBuffer, t, 0.22, 1600, 460, 0.14, 0.35 - i * 0.08);
    scheduleGlassPop(ctx, masterCompressor, t + 0.015, s1Notes[i], i === 5 ? 0.22 : 0.16, 0.21, 0.15 - i * 0.04);
    if (i === 5) {
      // "realtime" highlighted card shimmer
      scheduleShimmerChime(ctx, masterCompressor, t + 0.02, [880, 1318.5], 0.16, 0.48, 0);
    }
  });
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(84), 0.38, 900, 240, 0.11, -0.2);

  // --------------------------------------------------------------------------
  // SCENE 2 (90 - 232f): Multi-Hardware -> MQTT Architecture
  // --------------------------------------------------------------------------
  scheduleShimmerChime(ctx, masterCompressor, fToSec(94), [261.63, 392.0], 0.16, 0.65, 0.25);

  const hwAppearCues = [100, 108, 116, 124, 132];
  const hwNotes = [523.25, 587.33, 659.25, 783.99, 880.0];
  hwAppearCues.forEach((cue, i) => {
    scheduleGlassPop(ctx, masterCompressor, fToSec(cue), hwNotes[i], 0.15, 0.2, -0.45);
  });

  const hwLineCues = [130, 138, 146, 154, 162];
  hwLineCues.forEach((cue, i) => {
    scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(cue), 0.45, 360 + i * 50, 1450 + i * 90, 0.09, -0.1 + i * 0.1);
  });

  // Incoming data packets hitting MQTT hub
  [154, 166, 178, 192, 206, 218].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 784 + (i % 3) * 110, 0.1, 0.35);
  });

  // --------------------------------------------------------------------------
  // SCENE 3 (224 - 344f): Apple Terminal Window + Typewriter Effect
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(224), 0.34, 240, 1150, 0.16, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(225), 196, 0.14, 0.22, 0);

  // Typewriter key taps aligned to "nah sekarang bagaimana cara mengirimkan data itu ke frontend secara realtime"
  const typedText =
    'nah sekarang bagaimana cara mengirimkan data itu ke frontend secara realtime';
  for (let i = 0; i < typedText.length; i++) {
    const ch = typedText[i];
    const frameAt = 234 + (i / typedText.length) * 83;
    const isSpace = ch === ' ';
    if (isSpace || i % 2 === 0 || i > typedText.length - 10) {
      const pitchJitter = 0.94 + ((i * 37) % 13) * 0.011;
      scheduleKeyTap(
        ctx,
        masterCompressor,
        noiseBuffer,
        fToSec(frameAt),
        pitchJitter,
        isSpace ? 0.1 : 0.13,
        isSpace
      );
    }
  }
  // Underline completion chime on "realtime"
  scheduleShimmerChime(ctx, masterCompressor, fToSec(308), [783.99, 1046.5], 0.15, 0.45, 0);

  // --------------------------------------------------------------------------
  // SCENE 3B (333 - 408f): WebSocket Full-Duplex Showcase
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(334), 0.42, 300, 1900, 0.15, -0.35);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(336), 0.42, 1900, 340, 0.14, 0.35);
  scheduleShimmerChime(ctx, masterCompressor, fToSec(335), [523.25, 783.99, 1174.66], 0.2, 0.72, 0);

  [352, 372, 390].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), i % 2 === 0 ? 880 : 1046.5, 0.11, i % 2 === 0 ? -0.3 : 0.3);
  });

  // --------------------------------------------------------------------------
  // SCENE 4 (400 - 610f): Open-Canvas Icon Pipeline (MQTT -> Node.js -> React)
  // --------------------------------------------------------------------------
  scheduleGlassPop(ctx, masterCompressor, fToSec(412), 523.25, 0.18, 0.28, -0.45);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(430), 0.55, 340, 1400, 0.12, -0.2);

  scheduleGlassPop(ctx, masterCompressor, fToSec(452), 659.25, 0.18, 0.28, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(486), 0.55, 380, 1550, 0.12, 0.2);

  scheduleShimmerChime(ctx, masterCompressor, fToSec(504), [783.99, 1174.66], 0.19, 0.62, 0.45);
  [538, 566].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 880 + i * 110, 0.09, i === 0 ? -0.15 : 0.15);
  });

  // --------------------------------------------------------------------------
  // SCENE 5 (598 - 842f): Live React Browser (Blinking HB Counting Grid)
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(602), 0.36, 280, 1200, 0.14, 0);
  const gridNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 880.0, 1046.5];
  for (let i = 0; i < 8; i++) {
    scheduleGlassPop(
      ctx,
      masterCompressor,
      fToSec(608 + i * 4),
      gridNotes[i],
      0.11,
      0.16,
      ((i % 4) - 1.5) * 0.28
    );
  }
  // Subtle rhythmic HB blink telemetry pulses across Scene 5
  const hbPulseNotes = [783.99, 880.0, 1046.5, 659.25];
  for (let f = 636, step = 0; f <= 816; f += 14, step++) {
    scheduleTelemetryPing(
      ctx,
      masterCompressor,
      fToSec(f),
      hbPulseNotes[step % hbPulseNotes.length],
      0.075,
      ((step % 4) - 1.5) * 0.35
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 6 (830 - 1020f): Finale Flow (MQTT JSON HB -> Back-End -> Front-End UI)
  // --------------------------------------------------------------------------
  scheduleShimmerChime(ctx, masterCompressor, fToSec(834), [523.25, 783.99], 0.17, 0.45, -0.45);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(850), 0.38, 360, 1400, 0.12, -0.2);

  scheduleShimmerChime(ctx, masterCompressor, fToSec(862), [659.25, 987.77], 0.17, 0.45, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(880), 0.38, 420, 1550, 0.12, 0.2);

  scheduleShimmerChime(ctx, masterCompressor, fToSec(892), [783.99, 1174.66, 1567.98], 0.2, 0.72, 0.45);

  [918, 944, 970].forEach((cue) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 1046.5, 0.1, 0.4);
  });

  scheduleShimmerChime(
    ctx,
    masterCompressor,
    fToSec(988),
    [261.63, 392.0, 523.25, 659.25],
    0.18,
    0.95,
    0
  );

  const rendered = await ctx.startRendering();
  return encodeAudioBufferToWavBlob(rendered);
}

async function synthesizeSseProtocolSfx(durationSeconds = 48.5): Promise<Blob> {
  const safeDuration = Math.max(10, Math.min(180, durationSeconds));
  const totalSamples = Math.ceil(safeDuration * SAMPLE_RATE);
  const ctx = new OfflineAudioContext(2, totalSamples, SAMPLE_RATE);

  const masterCompressor = ctx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-14, 0);
  masterCompressor.knee.setValueAtTime(16, 0);
  masterCompressor.ratio.setValueAtTime(3.5, 0);
  masterCompressor.attack.setValueAtTime(0.004, 0);
  masterCompressor.release.setValueAtTime(0.18, 0);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.88, 0);

  masterCompressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  const noiseBuffer = createNoiseBuffer(ctx, 2.5);

  // --------------------------------------------------------------------------
  // SCENE 0 (0 - 82f): Word/Phrase-by-Phrase Kinetic Glass Cards
  // --------------------------------------------------------------------------
  const sseWordCues = [0, 12, 30, 39, 40, 51];
  const sseWordNotes = [523.25, 587.33, 659.25, 698.46, 880.0, 1046.5];
  sseWordCues.forEach((cue, i) => {
    const t = fToSec(cue);
    if (i !== 3) {
      scheduleWhoosh(ctx, masterCompressor, noiseBuffer, t, 0.18, 1550, 440, 0.11, 0.32 - i * 0.12);
    }
    scheduleGlassPop(
      ctx,
      masterCompressor,
      t + 0.01,
      sseWordNotes[i],
      i === 4 ? 0.2 : i === 3 ? 0.08 : 0.14,
      0.18,
      0.18 - i * 0.07
    );
    if (i === 4) {
      // "upload file" highlighted card shimmer
      scheduleShimmerChime(ctx, masterCompressor, t + 0.018, [880, 1318.5], 0.15, 0.44, 0);
    }
  });

  // --------------------------------------------------------------------------
  // SCENE 1 (76 - 188f): File Upload Progress Bar Card
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(76), 0.3, 280, 1350, 0.14, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(78), 523.25, 0.16, 0.22, 0);

  [92, 110, 128, 146, 164].forEach((cue, idx) => {
    scheduleTelemetryPing(
      ctx,
      masterCompressor,
      fToSec(cue),
      587.33 + idx * 75,
      0.085,
      -0.3 + idx * 0.15
    );
  });
  scheduleShimmerChime(ctx, masterCompressor, fToSec(174), [659.25, 987.77, 1318.5], 0.18, 0.56, 0);

  // --------------------------------------------------------------------------
  // SCENE 2 (182 - 334f): Axios & XMLHttpRequest Cards
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(184), 0.28, 300, 1250, 0.12, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(188), 493.88, 0.14, 0.2, 0);

  // "Axios" entrance (~236f)
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(234), 0.28, 1250, 420, 0.13, -0.35);
  scheduleGlassPop(ctx, masterCompressor, fToSec(238), 587.33, 0.18, 0.25, -0.38);
  [254, 270].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 740 + i * 80, 0.08, -0.35);
  });

  // "maupun" connector (~276f)
  scheduleGlassPop(ctx, masterCompressor, fToSec(276), 659.25, 0.11, 0.15, 0);

  // "XMLHttpRequest" entrance (~286f)
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(284), 0.28, 420, 1500, 0.13, 0.35);
  scheduleShimmerChime(ctx, masterCompressor, fToSec(288), [659.25, 987.77], 0.17, 0.42, 0.38);
  [304, 320].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 880 + i * 95, 0.085, 0.35);
  });

  // --------------------------------------------------------------------------
  // SCENE 3 (326 - 485f): Realtime Server -> Client Question Terminal
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(326), 0.32, 240, 1200, 0.15, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(328), 220, 0.14, 0.22, 0);

  const s3Prompt = 'server kirim data progress bar realtime ke client';
  for (let i = 0; i < s3Prompt.length; i++) {
    const ch = s3Prompt[i];
    const frameAt = 336 + (i / s3Prompt.length) * 98;
    const isSpace = ch === ' ';
    if (isSpace || i % 2 === 0) {
      const pitchJitter = 0.93 + ((i * 31) % 13) * 0.011;
      scheduleKeyTap(
        ctx,
        masterCompressor,
        noiseBuffer,
        fToSec(frameAt),
        pitchJitter,
        isSpace ? 0.095 : 0.12,
        isSpace
      );
    }
  }
  scheduleShimmerChime(ctx, masterCompressor, fToSec(442), [783.99, 1046.5], 0.17, 0.5, 0);
  [456, 470].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 880 + i * 110, 0.09, 0.2);
  });

  // --------------------------------------------------------------------------
  // SCENE 4a (480 - 592f): Perkenalan SSE (Server-Sent Events)
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(482), 0.36, 260, 1750, 0.14, 0);
  scheduleShimmerChime(ctx, masterCompressor, fToSec(486), [523.25, 783.99, 1046.5], 0.2, 0.65, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(536), 0.28, 360, 1450, 0.11, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(540), 659.25, 0.17, 0.24, 0);

  // --------------------------------------------------------------------------
  // SCENE 4b (584 - 758f): Protokol SSE (1 Arah) Server -> Client Stream
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(586), 0.34, 280, 1500, 0.13, -0.2);
  scheduleGlassPop(ctx, masterCompressor, fToSec(588), 523.25, 0.16, 0.22, -0.25);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(604), 0.42, 340, 1600, 0.12, 0.1);

  [626, 652, 678, 704, 730].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 783.99 + (i % 3) * 110, 0.095, -0.25 + (i % 3) * 0.25);
  });

  // --------------------------------------------------------------------------
  // SCENE 5 (750 - 995f): WebSocket (Komunikasi 2 Arah)
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(754), 0.34, 1500, 420, 0.13, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(758), 523.25, 0.17, 0.24, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(824), 0.3, 420, 1450, 0.12, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(828), 659.25, 0.16, 0.22, 0);

  [895, 935, 965].forEach((cue, i) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), i % 2 === 0 ? 783.99 : 987.77, 0.095, i % 2 === 0 ? -0.35 : 0.35);
  });

  // --------------------------------------------------------------------------
  // SCENE 6a (990 - 1104f): Cukup Komunikasi 1 Arah Saja
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(992), 0.36, 300, 1550, 0.14, 0);
  scheduleShimmerChime(ctx, masterCompressor, fToSec(998), [523.25, 783.99, 1046.5], 0.18, 0.56, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(1038), 0.34, 340, 1450, 0.12, 0.15);
  scheduleGlassPop(ctx, masterCompressor, fToSec(1042), 783.99, 0.16, 0.22, 0.1);

  // --------------------------------------------------------------------------
  // SCENE 6b (1098 - 1190f): Server Mengirimkan Progress Bar ke Client
  // --------------------------------------------------------------------------
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(1098), 0.3, 280, 1400, 0.13, -0.2);
  scheduleGlassPop(ctx, masterCompressor, fToSec(1102), 587.33, 0.16, 0.21, -0.25);

  [1120, 1138, 1156, 1172].forEach((cue, idx) => {
    scheduleTelemetryPing(
      ctx,
      masterCompressor,
      fToSec(cue),
      659.25 + idx * 85,
      0.085,
      -0.3 + idx * 0.2
    );
  });
  scheduleShimmerChime(ctx, masterCompressor, fToSec(1178), [659.25, 987.77, 1318.5], 0.17, 0.45, 0.3);

  // --------------------------------------------------------------------------
  // SCENE 7 (1184 - 1455f): Backend Stepped Progress (1184-1347f) + Closing Prompt (1348-1455f)
  // --------------------------------------------------------------------------
  scheduleShimmerChime(ctx, masterCompressor, fToSec(1192), [523.25, 783.99], 0.16, 0.42, -0.4);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(1218), 0.32, 360, 1380, 0.11, -0.15);

  scheduleShimmerChime(ctx, masterCompressor, fToSec(1238), [659.25, 987.77], 0.16, 0.42, 0);
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(1264), 0.32, 420, 1520, 0.11, 0.15);

  scheduleShimmerChime(ctx, masterCompressor, fToSec(1284), [783.99, 1174.66, 1567.98], 0.19, 0.58, 0.4);
  [1308, 1326].forEach((cue) => {
    scheduleTelemetryPing(ctx, masterCompressor, fToSec(cue), 1046.5, 0.09, 0.35);
  });

  // 1348f: "bagaimana implementasinya..? silahkan prompt aja dulu"
  scheduleWhoosh(ctx, masterCompressor, noiseBuffer, fToSec(1348), 0.34, 280, 1650, 0.14, 0);
  scheduleGlassPop(ctx, masterCompressor, fToSec(1352), 659.25, 0.17, 0.24, 0);

  const outroPrompt = 'silahkan prompt aja dulu';
  for (let i = 0; i < outroPrompt.length; i++) {
    const ch = outroPrompt[i];
    const frameAt = 1392 + (i / outroPrompt.length) * 34;
    if (ch === ' ' || i % 2 === 0) {
      scheduleKeyTap(
        ctx,
        masterCompressor,
        noiseBuffer,
        fToSec(frameAt),
        0.95 + ((i * 19) % 11) * 0.012,
        ch === ' ' ? 0.085 : 0.11,
        ch === ' '
      );
    }
  }
  scheduleShimmerChime(
    ctx,
    masterCompressor,
    fToSec(1426),
    [261.63, 392.0, 523.25, 659.25],
    0.18,
    0.95,
    0
  );

  const rendered = await ctx.startRendering();
  return encodeAudioBufferToWavBlob(rendered);
}

export function getSoundFxWavBlob(
  durationSeconds = 34,
  preset: SfxPreset = 'mqtt'
): Promise<Blob> {
  const key = `${preset}:${durationSeconds.toFixed(2)}`;
  const existing = wavBlobCache.get(key);
  if (existing) return existing;

  const promise =
    preset === 'sse'
      ? synthesizeSseProtocolSfx(durationSeconds)
      : synthesizeMqttWebSocketSfx(durationSeconds);
  wavBlobCache.set(key, promise);
  return promise;
}

export async function getSoundFxObjectUrl(
  durationSeconds = 34,
  preset: SfxPreset = 'mqtt'
): Promise<string> {
  const key = `${preset}:${durationSeconds.toFixed(2)}`;
  const existing = wavUrlCache.get(key);
  if (existing) return existing;

  const blob = await getSoundFxWavBlob(durationSeconds, preset);
  const url = URL.createObjectURL(blob);
  wavUrlCache.set(key, url);
  return url;
}

export async function downloadSoundFxWav(
  durationSeconds = 34,
  filename = 'mqtt-websocket-sound-fx.wav',
  preset: SfxPreset = 'mqtt'
): Promise<void> {
  const url = await getSoundFxObjectUrl(durationSeconds, preset);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function useSoundFxUrl(
  enabled: boolean,
  durationSeconds = 34,
  preset: SfxPreset = 'mqtt'
): string | null {
  const cacheKey = `${preset}:${durationSeconds.toFixed(2)}`;
  const [url, setUrl] = useState<string | null>(() => {
    if (!enabled) return null;
    return wavUrlCache.get(cacheKey) ?? null;
  });

  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return;
    }
    let active = true;
    getSoundFxObjectUrl(durationSeconds, preset)
      .then((resolved) => {
        if (active) setUrl(resolved);
      })
      .catch(() => {
        // Ignore WebAudio failure in restricted environments
      });
    return () => {
      active = false;
    };
  }, [enabled, durationSeconds, preset]);

  return url;
}

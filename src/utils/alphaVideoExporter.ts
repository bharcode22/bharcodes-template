import React from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import type {
  AspectPreset,
  CompositionDefinition,
  StudioCompositionProps,
} from '../remotion/types';

export type AlphaExportFormat = 'mov' | 'webm';

export interface AlphaExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'done';
  currentFrame: number;
  totalFrames: number;
  percent: number;
}

export interface AlphaExportResult {
  filename: string;
  sizeBytes: number;
  previewUrl?: string;
}

class BackendUnavailableError extends Error {
  constructor(message = 'Backend FFmpeg tidak aktif pada host ini') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Render dibatalkan', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Render dibatalkan', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function parseJsonSafe<T>(res: Response, fallbackMsg: string): Promise<T> {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();
  if (!ct.includes('application/json')) {
    throw new BackendUnavailableError();
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(fallbackMsg);
  }
  if (!res.ok) {
    const errObj = data as { error?: string } | null;
    throw new Error(errObj?.error || fallbackMsg);
  }
  return data as T;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function loadSvgImage(svgMarkup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const bytes = new TextEncoder().encode(svgMarkup);
    const dataUrl = `data:image/svg+xml;base64,${uint8ArrayToBase64(bytes)}`;
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('Gagal merasterisasi frame SVG ke kanvas Alpha'));
    img.src = dataUrl;
  });
}

async function drawStageToCanvas(
  stageEl: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Promise<void> {
  const clone = stageEl.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.querySelectorAll('audio, video').forEach((el) => el.remove());

  const serializer = new XMLSerializer();
  const serializedHtml = serializer.serializeToString(clone);

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>*,*::before,*::after{box-sizing:border-box;}</style>
  <foreignObject x="0" y="0" width="${width}" height="${height}">${serializedHtml}</foreignObject>
</svg>`;

  const img = await loadSvgImage(svgMarkup);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal mengonversi frame ke PNG transparan'));
    }, 'image/png');
  });
}

function pickSupportedWebmMime(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

// 100% Client-Side fallback (Video Only, NO Audio) when running on static hosting without Express backend
async function renderWebmClientSide(params: {
  player: PlayerRef;
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  baseFilename: string;
  signal: AbortSignal;
  onProgress: (progress: AlphaExportProgress) => void;
}): Promise<AlphaExportResult> {
  const {
    player,
    host,
    canvas,
    ctx,
    width,
    height,
    fps,
    durationInFrames,
    baseFilename,
    signal,
    onProgress,
  } = params;

  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    throw new Error('Browser ini tidak mendukung perekaman video WebM langsung');
  }

  const mimeType = pickSupportedWebmMime();
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
  });

  const stoppedPromise = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = () =>
      reject(new Error('Gagal merekam stream video WebM di browser'));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  recorder.start(250);
  const frameDelayMs = Math.max(8, Math.round(1000 / fps));

  try {
    for (let f = 0; f < durationInFrames; f++) {
      if (signal.aborted) {
        recorder.stop();
        throw new DOMException('Render dibatalkan', 'AbortError');
      }

      player.seekTo(f);
      await nextAnimationFrame();
      await nextAnimationFrame();

      const stageEl = host.querySelector(
        '[data-alpha-stage="true"]'
      ) as HTMLElement | null;
      if (!stageEl) {
        throw new Error(`Elemen frame ${f} tidak ditemukan`);
      }

      await drawStageToCanvas(stageEl, canvas, ctx, width, height);
      track?.requestFrame?.();
      await sleep(frameDelayMs, signal);

      onProgress({
        phase: 'rendering',
        currentFrame: f + 1,
        totalFrames: durationInFrames,
        percent: Math.round(((f + 1) / durationInFrames) * 95),
      });
    }

    onProgress({
      phase: 'encoding',
      currentFrame: durationInFrames,
      totalFrames: durationInFrames,
      percent: 97,
    });

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    const videoBlob = await stoppedPromise;
    if (videoBlob.size === 0) {
      throw new Error('Hasil rekaman video WebM kosong');
    }

    const filename = `${baseFilename}.webm`;
    const blobUrl = URL.createObjectURL(videoBlob);

    onProgress({
      phase: 'done',
      currentFrame: durationInFrames,
      totalFrames: durationInFrames,
      percent: 100,
    });

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return {
      filename,
      sizeBytes: videoBlob.size,
      previewUrl: blobUrl,
    };
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

export async function exportAlphaVideoOnly(params: {
  composition: CompositionDefinition;
  props: StudioCompositionProps;
  aspect: AspectPreset;
  fps: number;
  durationInFrames: number;
  format: AlphaExportFormat;
  signal: AbortSignal;
  onProgress: (progress: AlphaExportProgress) => void;
}): Promise<AlphaExportResult> {
  const {
    composition,
    props,
    aspect,
    fps,
    durationInFrames,
    format,
    signal,
    onProgress,
  } = params;

  const width = aspect.width;
  const height = aspect.height;
  const slug = composition.id.toLowerCase();
  const baseFilename = `${slug}-${aspect.width}x${aspect.height}-alpha-video-only`;

  onProgress({
    phase: 'preparing',
    currentFrame: 0,
    totalFrames: durationInFrames,
    percent: 0,
  });

  // Check if Express FFmpeg backend is reachable
  let useServerBackend = false;
  try {
    const healthRes = await fetch('/api/alpha-render/health', { signal });
    const health = await parseJsonSafe<{ ok: boolean }>(
      healthRes,
      'Backend tidak merespons'
    );
    useServerBackend = Boolean(health?.ok);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    useServerBackend = false;
  }

  // Create hidden 1:1 offscreen Player host
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-20000px';
  host.style.top = '0';
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.pointerEvents = 'none';
  host.style.background = 'transparent';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);

  const root = createRoot(host);
  const playerRef = React.createRef<PlayerRef>();
  const Comp = composition.component;

  // Video-only props: force transparent background and mute/omit all audio
  const videoOnlyProps: StudioCompositionProps = {
    ...props,
    transparentBackground: true,
    audioVolume: 0,
    soundFxVolume: 0,
  };

  const StageWrapper: React.FC<StudioCompositionProps> = (compProps) =>
    React.createElement(
      'div',
      {
        'data-alpha-stage': 'true',
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
        },
      },
      React.createElement(Comp, compProps)
    );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    root.unmount();
    host.remove();
    throw new Error('Browser tidak mendukung Canvas 2D Alpha');
  }

  let jobId: string | null = null;
  const pendingUploads = new Set<Promise<void>>();
  const MAX_CONCURRENT_UPLOADS = 4;

  try {
    root.render(
      React.createElement(Player, {
        ref: playerRef,
        component: StageWrapper,
        inputProps: videoOnlyProps,
        durationInFrames,
        fps,
        compositionWidth: width,
        compositionHeight: height,
        autoPlay: false,
        controls: false,
        style: {
          width,
          height,
          backgroundColor: 'transparent',
        },
      })
    );

    // Wait for Player & first frame to mount
    for (let attempt = 0; attempt < 15; attempt++) {
      await nextAnimationFrame();
      if (playerRef.current && host.querySelector('[data-alpha-stage="true"]')) {
        break;
      }
    }

    const player = playerRef.current;
    if (!player) {
      throw new Error('Gagal menginisialisasi Remotion Player untuk render');
    }

    // If backend FFmpeg is unavailable (e.g. static preview), fall back to client-side WebM Alpha recording
    if (!useServerBackend) {
      if (format === 'mov') {
        throw new Error(
          'Format .MOV ProRes 4444 membutuhkan server FFmpeg aktif. Pilih .WEBM VP9 Alpha untuk unduh langsung dari browser.'
        );
      }
      return await renderWebmClientSide({
        player,
        host,
        canvas,
        ctx,
        width,
        height,
        fps,
        durationInFrames,
        baseFilename,
        signal,
        onProgress,
      });
    }

    const startRes = await fetch('/api/alpha-render/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width,
        height,
        fps,
        totalFrames: durationInFrames,
        format,
        filename: baseFilename,
      }),
      signal,
    });

    const startData = await parseJsonSafe<{ jobId: string }>(
      startRes,
      'Gagal memulai sesi render Alpha'
    );
    jobId = startData.jobId;

    for (let f = 0; f < durationInFrames; f++) {
      if (signal.aborted) {
        throw new DOMException('Render dibatalkan', 'AbortError');
      }

      player.seekTo(f);
      await nextAnimationFrame();
      await nextAnimationFrame();

      const stageEl = host.querySelector(
        '[data-alpha-stage="true"]'
      ) as HTMLElement | null;
      if (!stageEl) {
        throw new Error(`Elemen frame ${f} tidak ditemukan`);
      }

      await drawStageToCanvas(stageEl, canvas, ctx, width, height);
      const pngBlob = await canvasToPngBlob(canvas);

      while (pendingUploads.size >= MAX_CONCURRENT_UPLOADS) {
        await Promise.race(pendingUploads);
      }

      const frameIdx = f;
      const uploadPromise = fetch(
        `/api/alpha-render/frame/${jobId}/${frameIdx}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'image/png' },
          body: pngBlob,
          signal,
        }
      ).then(async (res) => {
        await parseJsonSafe<{ ok: boolean }>(
          res,
          `Gagal mengunggah frame ${frameIdx}`
        );
      });

      pendingUploads.add(uploadPromise);
      uploadPromise.finally(() => pendingUploads.delete(uploadPromise));

      onProgress({
        phase: 'rendering',
        currentFrame: f + 1,
        totalFrames: durationInFrames,
        percent: Math.round(((f + 1) / durationInFrames) * 80),
      });
    }

    await Promise.all(pendingUploads);

    if (signal.aborted) {
      throw new DOMException('Render dibatalkan', 'AbortError');
    }

    onProgress({
      phase: 'encoding',
      currentFrame: 0,
      totalFrames: durationInFrames,
      percent: 80,
    });

    const finishRes = await fetch(`/api/alpha-render/finish/${jobId}`, {
      method: 'POST',
      signal,
    });

    await parseJsonSafe<{ ok: boolean }>(
      finishRes,
      'Gagal memulai encoding video Alpha'
    );

    // Poll encoding status smoothly from 80% -> 100%
    let downloadUrl = '';
    let filename = '';
    let sizeBytes = 0;

    while (true) {
      await sleep(550, signal);

      const statusRes = await fetch(`/api/alpha-render/status/${jobId}`, {
        signal,
      });
      const statusData = await parseJsonSafe<{
        status: 'uploading' | 'encoding' | 'done' | 'error';
        encodedFrames: number;
        totalFrames: number;
        downloadUrl: string | null;
        filename: string;
        sizeBytes: number;
        error: string | null;
      }>(statusRes, 'Gagal memantau status encoding Alpha');

      if (statusData.status === 'error') {
        throw new Error(statusData.error || 'FFmpeg gagal mengenkode video Alpha');
      }

      if (statusData.status === 'done' && statusData.downloadUrl) {
        downloadUrl = statusData.downloadUrl;
        filename = statusData.filename;
        sizeBytes = statusData.sizeBytes;
        break;
      }

      const encodeRatio =
        statusData.totalFrames > 0
          ? statusData.encodedFrames / statusData.totalFrames
          : 0;
      onProgress({
        phase: 'encoding',
        currentFrame: statusData.encodedFrames,
        totalFrames: statusData.totalFrames,
        percent: Math.min(99, 80 + Math.round(encodeRatio * 19)),
      });
    }

    const dlRes = await fetch(downloadUrl, { signal });
    if (!dlRes.ok) {
      throw new Error('Gagal mengunduh file hasil render Alpha');
    }
    const ct = (dlRes.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) {
      throw new Error('Server mengembalikan HTML alih-alih file video');
    }

    const videoBlob = await dlRes.blob();
    if (videoBlob.size === 0) {
      throw new Error('File video Alpha kosong');
    }

    const blobUrl = URL.createObjectURL(videoBlob);

    onProgress({
      phase: 'done',
      currentFrame: durationInFrames,
      totalFrames: durationInFrames,
      percent: 100,
    });

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return {
      filename,
      sizeBytes: videoBlob.size || sizeBytes,
      previewUrl: format === 'webm' ? blobUrl : undefined,
    };
  } catch (err) {
    if (jobId) {
      void fetch(`/api/alpha-render/${jobId}`, { method: 'DELETE' }).catch(
        () => undefined
      );
    }
    throw err;
  } finally {
    root.unmount();
    host.remove();
  }
}

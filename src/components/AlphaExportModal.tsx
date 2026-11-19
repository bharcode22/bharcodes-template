import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Film, Loader2, VolumeX, X } from 'lucide-react';
import {
  exportAlphaVideoOnly,
  type AlphaExportFormat,
  type AlphaExportProgress,
  type AlphaExportResult,
} from '../utils/alphaVideoExporter';
import type {
  AspectPreset,
  CompositionDefinition,
  StudioCompositionProps,
} from '../remotion/types';

interface AlphaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  composition: CompositionDefinition;
  props: StudioCompositionProps;
  aspect: AspectPreset;
  fps: number;
  durationInFrames: number;
}

export const AlphaExportModal: React.FC<AlphaExportModalProps> = ({
  isOpen,
  onClose,
  composition,
  props,
  aspect,
  fps,
  durationInFrames,
}) => {
  const [format, setFormat] = useState<AlphaExportFormat>('webm');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>(
    'idle'
  );
  const [progress, setProgress] = useState<AlphaExportProgress>({
    phase: 'preparing',
    currentFrame: 0,
    totalFrames: durationInFrames,
    percent: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<AlphaExportResult | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      if (resultInfo?.previewUrl) {
        URL.revokeObjectURL(resultInfo.previewUrl);
      }
      setStatus('idle');
      setErrorMsg(null);
      setResultInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (resultInfo?.previewUrl) {
      URL.revokeObjectURL(resultInfo.previewUrl);
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('working');
    setErrorMsg(null);
    setResultInfo(null);

    try {
      const result = await exportAlphaVideoOnly({
        composition,
        props,
        aspect,
        fps,
        durationInFrames,
        format,
        signal: controller.signal,
        onProgress: setProgress,
      });
      setResultInfo(result);
      setStatus('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengekspor video Alpha'
      );
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancelOrClose = () => {
    if (status === 'working') {
      abortRef.current?.abort();
    }
    onClose();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatExtLabel = format === 'webm' ? 'WEBM' : 'MOV';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alpha-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0F141F] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="alpha-modal-title"
                className="text-sm font-semibold text-white"
              >
                Unduh Video Alpha (Video Only)
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <VolumeX className="w-3 h-3 text-emerald-400" />
                <span>Tanpa background &amp; tanpa trek audio</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelOrClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Spec Summary */}
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/10">
              <div className="text-slate-400 text-[11px]">Resolusi</div>
              <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                {aspect.width}×{aspect.height}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/10">
              <div className="text-slate-400 text-[11px]">Frame Rate</div>
              <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                {fps} fps ({durationInFrames}f)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/10">
              <div className="text-slate-400 text-[11px]">Audio</div>
              <div className="font-semibold text-emerald-400 mt-0.5">
                Video Only
              </div>
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-300">
              Pilih Format Transparansi Alpha
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={status === 'working'}
                onClick={() => setFormat('webm')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  format === 'webm'
                    ? 'bg-blue-600/15 border-blue-500 text-white'
                    : 'bg-[#0B0F17] border-white/10 text-slate-300 hover:border-white/25'
                } disabled:opacity-60`}
              >
                <div className="text-xs font-semibold">.WEBM VP9 Alpha</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Bisa diputar langsung di Chrome, Windows, Android, CapCut, &amp; OBS
                </div>
              </button>

              <button
                type="button"
                disabled={status === 'working'}
                onClick={() => setFormat('mov')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  format === 'mov'
                    ? 'bg-blue-600/15 border-blue-500 text-white'
                    : 'bg-[#0B0F17] border-white/10 text-slate-300 hover:border-white/25'
                } disabled:opacity-60`}
              >
                <div className="text-xs font-semibold">.MOV ProRes 4444</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Untuk editing Mac (QuickTime Mac, Final Cut Pro, Apple Motion, DaVinci)
                </div>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'working' && (
            <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 flex items-center gap-2 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  {progress.phase === 'preparing'
                    ? 'Menyiapkan kanvas Alpha...'
                    : progress.phase === 'rendering'
                      ? `Merender frame ${progress.currentFrame}/${progress.totalFrames}`
                      : `Mengenkode Alpha frame ${progress.currentFrame}/${progress.totalFrames}`}
                </span>
                <span className="font-mono tabular-nums text-blue-400 font-semibold">
                  {progress.percent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Banner + Live Alpha Preview for WebM */}
          {status === 'done' && resultInfo && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold">
                    Video Alpha siap &amp; terunduh
                  </div>
                  <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                    {resultInfo.filename} ({formatBytes(resultInfo.sizeBytes)})
                  </div>
                </div>
              </div>

              {resultInfo.previewUrl && (
                <div
                  className="rounded-lg overflow-hidden border border-white/15"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #1E293B 25%, transparent 25%), linear-gradient(-45deg, #1E293B 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1E293B 75%), linear-gradient(-45deg, transparent 75%, #1E293B 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#0F172A',
                  }}
                >
                  <video
                    src={resultInfo.previewUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full max-h-56 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {status === 'error' && errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#0B0F17]/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancelOrClose}
            className="px-3.5 py-2 rounded-md border border-white/15 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
          >
            {status === 'working' ? 'Batalkan' : 'Tutup'}
          </button>
          <button
            type="button"
            disabled={status === 'working'}
            onClick={handleStart}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            {status === 'working' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {status === 'done'
                    ? 'Unduh Ulang Alpha'
                    : `Mulai Unduh .${formatExtLabel} Alpha`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

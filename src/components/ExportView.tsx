import React, { useState } from 'react';
import { Check, Copy, Download, Film, Loader2, Terminal, Volume2 } from 'lucide-react';
import {
  generateCompositionTsx,
  generateRemotionConfigTs,
  generateRenderCommand,
  generateRootTsx,
} from '../remotion/codeGenerator';
import type {
  AspectPreset,
  CompositionDefinition,
  StudioCompositionProps,
} from '../remotion/types';

interface ExportViewProps {
  composition: CompositionDefinition;
  props: StudioCompositionProps;
  aspect: AspectPreset;
  fps: number;
  durationInFrames: number;
  onOpenAlphaExport: () => void;
  onDownloadSoundFx: () => void;
  sfxDownloading: boolean;
}

export const ExportView: React.FC<ExportViewProps> = ({
  composition,
  props,
  aspect,
  fps,
  durationInFrames,
  onOpenAlphaExport,
  onDownloadSoundFx,
  sfxDownloading,
}) => {
  const [selectedFile, setSelectedFile] = useState<
    'composition' | 'root' | 'config' | 'props'
  >('composition');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rootCode = generateRootTsx(
    composition,
    aspect,
    fps,
    durationInFrames,
    props
  );
  const compCode = generateCompositionTsx(composition, props);
  const configCode = generateRemotionConfigTs();
  const propsJson = JSON.stringify(props, null, 2);
  const renderCmd = generateRenderCommand(
    composition,
    fps,
    durationInFrames
  );

  const activeContent =
    selectedFile === 'root'
      ? rootCode
      : selectedFile === 'config'
        ? configCode
        : selectedFile === 'props'
          ? propsJson
          : compCode;

  const activeFilename =
    selectedFile === 'root'
      ? 'Root.tsx'
      : selectedFile === 'config'
        ? 'remotion.config.ts'
        : selectedFile === 'props'
          ? 'props.json'
          : `${composition.id}Composition.tsx`;

  const copyText = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const downloadFile = (
    filename: string,
    content: string,
    mime = 'text/plain'
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ekspor & Render Proyek Remotion
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Unduh kode sumber dan konfigurasi Apple ProRes 4444 untuk merender file <code className="font-mono text-slate-200">.mov</code> tanpa background (saluran Alpha) agar siap disunting ulang di Final Cut Pro, Apple Motion, atau CapCut di perangkat Apple.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onDownloadSoundFx}
              disabled={sfxDownloading}
              className="px-3.5 py-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {sfxDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>Unduh Sound FX (.wav)</span>
            </button>
            <button
              type="button"
              onClick={onOpenAlphaExport}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Unduh Alpha (Video Only)</span>
            </button>
            <button
              type="button"
              onClick={() => downloadFile(activeFilename, activeContent)}
              className="px-3.5 py-2 rounded-md border border-white/15 bg-[#111827] hover:bg-white/10 text-xs font-medium text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh {activeFilename}</span>
            </button>
          </div>
        </div>

        {/* Summary Spec Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-white/10 bg-[#0F141F]">
            <div className="text-xs text-slate-400">Komposisi Aktif</div>
            <div className="text-sm font-semibold text-white mt-1">
              {composition.title}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-[#0F141F]">
            <div className="text-xs text-slate-400">Resolusi &amp; Alpha</div>
            <div className="text-sm font-mono tabular-nums font-semibold text-white mt-1">
              {aspect.width}×{aspect.height} · Alpha
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-[#0F141F]">
            <div className="text-xs text-slate-400">Codec Ekspor</div>
            <div className="text-sm font-mono font-semibold text-white mt-1">
              WEBM VP9 / ProRes 4444
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-[#0F141F]">
            <div className="text-xs text-slate-400">Total Durasi</div>
            <div className="text-sm font-mono tabular-nums font-semibold text-white mt-1">
              {durationInFrames}f ({(durationInFrames / fps).toFixed(1)} dtk ·{' '}
              {fps} fps)
            </div>
          </div>
        </div>

        {/* CLI Command Block */}
        <div className="rounded-lg border border-white/10 bg-[#0F141F] p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Perintah Render Terminal Alpha (Remotion CLI)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs rounded bg-blue-600/15 border border-blue-500/35 text-blue-300 font-semibold whitespace-nowrap shrink-0">
                Alpha Only (.MOV / .WEBM)
              </span>

              <button
                type="button"
                onClick={() => copyText('cli', renderCmd)}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedId === 'cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Perintah</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-3.5 rounded-md bg-[#0B0F17] border border-white/10 font-mono text-xs text-blue-300 overflow-x-auto">
            <code>{renderCmd}</code>
          </pre>

          <p className="text-xs text-slate-400 leading-relaxed">
            Flag{' '}
            <code className="font-mono text-slate-200 bg-white/5 px-1.5 py-0.5 rounded">
              --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --muted
            </code>{' '}
            menghasilkan video <code className="font-mono text-slate-200">.mov</code> 10-bit dengan transparansi Alpha penuh tanpa audio (video only) agar siap ditarik ke timeline Final Cut Pro, Apple Motion, atau CapCut.
          </p>
        </div>

        {/* File Viewer */}
        <div className="rounded-lg border border-white/10 bg-[#0F141F] overflow-hidden flex flex-col">
          <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1 bg-[#0B0F17] p-0.5 rounded-md border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedFile('composition')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedFile === 'composition'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {composition.id}Composition.tsx
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile('config')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedFile === 'config'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                remotion.config.ts
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile('root')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedFile === 'root'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Root.tsx
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile('props')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedFile === 'props'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                props.json
              </button>
            </div>

            <button
              type="button"
              onClick={() => copyText('file', activeContent)}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedId === 'file' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-[#0B0F17] font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto max-h-[460px]">
            <code>{activeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

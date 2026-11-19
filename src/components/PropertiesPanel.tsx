import React, { useState } from 'react';
import {
  Check,
  Copy,
  Film,
  Loader2,
  Paintbrush,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  generateCompositionTsx,
  generateRootTsx,
} from '../remotion/codeGenerator';
import type {
  AspectPreset,
  ClipFontFamily,
  ClipIconId,
  CompositionDefinition,
  EnterAnimationPreset,
  ExitAnimationPreset,
  StudioCompositionProps,
  StudioProject,
  TimelineClip,
} from '../remotion/types';

interface PropertiesPanelProps {
  project: StudioProject;
  composition: CompositionDefinition;
  props: StudioCompositionProps;
  aspect: AspectPreset;
  selectedClip: TimelineClip | null;
  onSelectClip: (clipId: string) => void;
  onUpdateClip: (
    clipId: string,
    updater: (clip: TimelineClip) => TimelineClip,
    commitHistory?: boolean
  ) => void;
  onApplyStyleToAllClips: (sourceClip: TimelineClip) => void;
  onUpdateProject: (
    updater: (proj: StudioProject) => StudioProject,
    commitHistory?: boolean
  ) => void;
  onFitDurationToClips: () => void;
  onResetDefaults: () => void;
  onOpenAlphaExport: () => void;
  onDownloadSoundFx: () => void;
  sfxDownloading: boolean;
}

const ACCENT_SWATCHES = [
  { label: 'Biru Apple', value: '#0071E3' },
  { label: 'Biru Cobalt', value: '#3B82F6' },
  { label: 'Hijau Emerald', value: '#10B981' },
  { label: 'Kuning Amber', value: '#F59E0B' },
  { label: 'Merah Crimson', value: '#EF4444' },
];

const TEXT_SWATCHES = [
  { label: 'Putih Apple', value: '#F5F5F7' },
  { label: 'Putih Murni', value: '#FFFFFF' },
  { label: 'Abu Slate', value: '#CBD5E1' },
  { label: 'Hitam Apple', value: '#1D1D1F' },
];

const ENTER_PRESETS: Array<{ id: EnterAnimationPreset; label: string }> = [
  { id: 'none', label: 'Tanpa Tambahan' },
  { id: 'pop-spring', label: 'Pop Spring' },
  { id: 'slide-up', label: 'Slide Naik' },
  { id: 'slide-left', label: 'Slide Kanan → Kiri' },
  { id: 'slide-right', label: 'Slide Kiri → Kanan' },
  { id: 'fade', label: 'Fade Halus' },
  { id: 'blur-in', label: 'Blur In' },
];

const EXIT_PRESETS: Array<{ id: ExitAnimationPreset; label: string }> = [
  { id: 'none', label: 'Tanpa Tambahan' },
  { id: 'fade', label: 'Fade Out' },
  { id: 'slide-down', label: 'Slide Turun' },
  { id: 'scale-down', label: 'Perkecil Keluar' },
];

const FONT_OPTIONS: ClipFontFamily[] = [
  'Plus Jakarta Sans',
  'DM Sans',
  'JetBrains Mono',
];

const ICON_OPTIONS: Array<{ id: ClipIconId; label: string }> = [
  { id: 'mqtt', label: 'MQTT' },
  { id: 'websocket', label: 'WebSocket' },
  { id: 'nodejs', label: 'Node.js' },
  { id: 'react', label: 'React' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'sensor', label: 'Sensor' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  composition,
  props,
  aspect,
  selectedClip,
  onSelectClip,
  onUpdateClip,
  onApplyStyleToAllClips,
  onUpdateProject,
  onFitDurationToClips,
  onResetDefaults,
  onOpenAlphaExport,
  onDownloadSoundFx,
  sfxDownloading,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'motion' | 'code'>('content');
  const [codeTarget, setCodeTarget] = useState<'composition' | 'root'>('composition');
  const [copied, setCopied] = useState(false);

  const generatedCode =
    codeTarget === 'root'
      ? generateRootTsx(
          composition,
          aspect,
          30,
          project.durationInFrames,
          props
        )
      : generateCompositionTsx(composition, props);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const patchClipContent = (patch: Partial<TimelineClip['content']>) => {
    if (!selectedClip) return;
    onUpdateClip(selectedClip.id, (c) => ({
      ...c,
      content: { ...c.content, ...patch },
    }));
  };

  const patchClipStyle = (patch: Partial<TimelineClip['style']>) => {
    if (!selectedClip) return;
    onUpdateClip(selectedClip.id, (c) => ({
      ...c,
      style: { ...c.style, ...patch },
    }));
  };

  const patchClipAnim = (patch: Partial<TimelineClip['animation']>) => {
    if (!selectedClip) return;
    onUpdateClip(selectedClip.id, (c) => ({
      ...c,
      animation: { ...c.animation, ...patch },
    }));
  };

  return (
    <aside className="w-80 xl:w-[356px] shrink-0 border-l border-white/10 bg-[#0F141F] flex flex-col h-full overflow-hidden">
      {/* Inspector Tab Header */}
      <div className="h-12 px-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-0.5 bg-[#0B0F17] p-0.5 rounded-md border border-white/10">
          {(
            [
              { id: 'content', label: 'Konten' },
              { id: 'style', label: 'Style' },
              { id: 'motion', label: 'Animasi' },
              { id: 'code', label: 'TSX' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white/12 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          title="Reset komposisi ke kondisi awal"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Selected Clip Selector Strip (for Content / Style / Motion tabs) */}
      {activeTab !== 'code' && (
        <div className="px-4 py-2.5 border-b border-white/10 bg-[#0B0F17]/60 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Klip / Layer Terpilih</span>
            {selectedClip && (
              <span className="font-mono tabular-nums text-blue-300">
                {selectedClip.from}f · {selectedClip.durationInFrames}f
              </span>
            )}
          </div>
          <select
            value={selectedClip?.id ?? ''}
            onChange={(e) => onSelectClip(e.target.value)}
            aria-label="Pilih klip atau layer"
            className="w-full rounded-md bg-[#111827] border border-white/15 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {project.clips.length === 0 ? (
              <option value="">Belum ada layer</option>
            ) : (
              [...project.clips]
                .sort((a, b) => a.trackRow - b.trackRow)
                .map((clip) => (
                  <option key={clip.id} value={clip.id}>
                    {clip.name} ({clip.from}f–{clip.from + clip.durationInFrames}f)
                  </option>
                ))
            )}
          </select>
        </div>
      )}

      {activeTab === 'code' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[#0B0F17] p-0.5 rounded-md border border-white/10">
              <button
                type="button"
                onClick={() => setCodeTarget('composition')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  codeTarget === 'composition'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Composition.tsx
              </button>
              <button
                type="button"
                onClick={() => setCodeTarget('root')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  codeTarget === 'root'
                    ? 'bg-white/12 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Root.tsx
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-xs text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 overflow-auto rounded-md bg-[#0B0F17] border border-white/10 p-3 text-[11px] leading-relaxed font-mono text-slate-300">
            <code>{generatedCode}</code>
          </pre>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {!selectedClip ? (
            <div className="p-4 rounded-lg border border-white/10 bg-[#0B0F17] text-xs text-slate-400 text-center">
              Pilih atau tambahkan layer dari Timeline di bawah untuk mulai mengedit konten, style, dan animasi.
            </div>
          ) : (
            <>
              {/* TAB 1: KONTEN & TIMING */}
              {activeTab === 'content' && (
                <>
                  <div className="flex flex-col gap-3">
                    <h2 className="text-xs font-semibold text-slate-300">
                      Identitas &amp; Waktu Klip
                    </h2>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">Nama Layer</span>
                      <input
                        type="text"
                        value={selectedClip.name}
                        onChange={(e) =>
                          onUpdateClip(selectedClip.id, (c) => ({
                            ...c,
                            name: e.target.value,
                          }))
                        }
                        className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Mulai (frame)</span>
                        <input
                          type="number"
                          min={0}
                          max={3600}
                          value={selectedClip.from}
                          onChange={(e) =>
                            onUpdateClip(selectedClip.id, (c) => ({
                              ...c,
                              from: Math.max(0, Math.round(Number(e.target.value) || 0)),
                            }))
                          }
                          className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Durasi (frame)</span>
                        <input
                          type="number"
                          min={6}
                          max={3600}
                          value={selectedClip.durationInFrames}
                          onChange={(e) =>
                            onUpdateClip(selectedClip.id, (c) => ({
                              ...c,
                              durationInFrames: Math.max(
                                6,
                                Math.round(Number(e.target.value) || 6)
                              ),
                            }))
                          }
                          className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
                    </div>

                    {selectedClip.sourceStartOffset > 0 && (
                      <div className="flex items-center justify-between text-[11px] bg-[#0B0F17] border border-white/10 rounded-md px-2.5 py-2">
                        <span className="text-slate-400">
                          Offset Potongan: <strong className="font-mono text-slate-200">+{selectedClip.sourceStartOffset}f</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            patchClipAnim({
                              resetOnTrim: !selectedClip.animation.resetOnTrim,
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            selectedClip.animation.resetOnTrim
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {selectedClip.animation.resetOnTrim
                            ? 'Reset Animasi'
                            : 'Lanjutkan Mulus'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                    <h2 className="text-xs font-semibold text-slate-300">
                      Isi Konten Layer
                    </h2>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">
                        Teks Utama / Perintah Terminal
                      </span>
                      <textarea
                        rows={3}
                        value={selectedClip.content.text}
                        onChange={(e) => patchClipContent({ text: e.target.value })}
                        className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">
                        Subteks / Prompt / URL
                      </span>
                      <input
                        type="text"
                        value={selectedClip.content.subtext}
                        onChange={(e) => patchClipContent({ subtext: e.target.value })}
                        className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Kata Sorotan</span>
                        <input
                          type="text"
                          value={selectedClip.content.highlightWord}
                          onChange={(e) =>
                            patchClipContent({ highlightWord: e.target.value })
                          }
                          className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Label / Badge</span>
                        <input
                          type="text"
                          value={selectedClip.content.badgeLabel}
                          onChange={(e) =>
                            patchClipContent({ badgeLabel: e.target.value })
                          }
                          className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
                    </div>

                    {selectedClip.kind === 'custom-layer' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">Ikon Node</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {ICON_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => patchClipContent({ iconId: opt.id })}
                              className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-colors ${
                                selectedClip.content.iconId === opt.id
                                  ? 'bg-blue-600/20 border-blue-500 text-white'
                                  : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </label>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: STYLE VISUAL & GLASSMORPHISM */}
              {activeTab === 'style' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
                      <span>Gaya Kaca &amp; Tipografi</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => onApplyStyleToAllClips(selectedClip)}
                      className="text-[11px] text-blue-300 hover:text-blue-200 underline underline-offset-2"
                    >
                      Terapkan ke semua
                    </button>
                  </div>

                  {/* Glass Dark / Light */}
                  <div className="grid grid-cols-2 gap-1.5 bg-[#0B0F17] p-1 rounded-md border border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        patchClipStyle({
                          appleDarkMode: false,
                          textColor: '#1D1D1F',
                          glassOpacity: 0.56,
                          borderOpacity: 0.78,
                        })
                      }
                      className={`py-1.5 text-xs rounded transition-colors ${
                        !selectedClip.style.appleDarkMode
                          ? 'bg-white/12 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Kaca Terang
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchClipStyle({
                          appleDarkMode: true,
                          textColor: '#F5F5F7',
                          glassOpacity: 0.52,
                          borderOpacity: 0.24,
                        })
                      }
                      className={`py-1.5 text-xs rounded transition-colors ${
                        selectedClip.style.appleDarkMode
                          ? 'bg-white/12 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Kaca Gelap
                    </button>
                  </div>

                  {/* Glassmorphism Sliders */}
                  <label className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Opasitas Kaca</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {Math.round(selectedClip.style.glassOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.02}
                      value={selectedClip.style.glassOpacity}
                      onChange={(e) =>
                        patchClipStyle({ glassOpacity: Number(e.target.value) })
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Intensitas Blur</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {selectedClip.style.blurPx}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={64}
                      step={2}
                      value={selectedClip.style.blurPx}
                      onChange={(e) =>
                        patchClipStyle({ blurPx: Number(e.target.value) })
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Radius Sudut</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {selectedClip.style.borderRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={64}
                      step={2}
                      value={selectedClip.style.borderRadius}
                      onChange={(e) =>
                        patchClipStyle({ borderRadius: Number(e.target.value) })
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </label>

                  {/* Font Family & Size & Weight */}
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">Jenis Font</span>
                      <select
                        value={selectedClip.style.fontFamily}
                        onChange={(e) =>
                          patchClipStyle({
                            fontFamily: e.target.value as ClipFontFamily,
                          })
                        }
                        className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Ukuran Teks</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {selectedClip.style.fontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={24}
                        max={110}
                        step={2}
                        value={selectedClip.style.fontSize}
                        onChange={(e) =>
                          patchClipStyle({ fontSize: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">Bobot Huruf</span>
                      <div className="grid grid-cols-4 gap-1 bg-[#0B0F17] p-1 rounded-md border border-white/10">
                        {[500, 600, 700, 800].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => patchClipStyle({ fontWeight: w })}
                            className={`py-1 text-xs font-mono rounded transition-colors ${
                              selectedClip.style.fontWeight === w
                                ? 'bg-white/12 text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-400">Warna Aksen</span>
                      <div className="flex items-center gap-2">
                        {ACCENT_SWATCHES.map((swatch) => (
                          <button
                            key={swatch.value}
                            type="button"
                            title={swatch.label}
                            onClick={() =>
                              patchClipStyle({ accentColor: swatch.value })
                            }
                            style={{ backgroundColor: swatch.value }}
                            className={`w-6 h-6 rounded-md transition-transform ${
                              selectedClip.style.accentColor.toLowerCase() ===
                              swatch.value.toLowerCase()
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0F141F] scale-105'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedClip.style.accentColor}
                          onChange={(e) =>
                            patchClipStyle({ accentColor: e.target.value })
                          }
                          aria-label="Warna aksen kustom"
                          className="w-7 h-7 rounded bg-transparent border border-white/10 cursor-pointer ml-auto"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-400">Warna Teks</span>
                      <div className="flex items-center gap-2">
                        {TEXT_SWATCHES.map((swatch) => (
                          <button
                            key={swatch.value}
                            type="button"
                            title={swatch.label}
                            onClick={() =>
                              patchClipStyle({ textColor: swatch.value })
                            }
                            style={{ backgroundColor: swatch.value }}
                            className={`w-6 h-6 rounded-md border border-white/25 transition-transform ${
                              selectedClip.style.textColor.toLowerCase() ===
                              swatch.value.toLowerCase()
                                ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0F141F] scale-105'
                                : 'opacity-85 hover:opacity-100'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedClip.style.textColor}
                          onChange={(e) =>
                            patchClipStyle({ textColor: e.target.value })
                          }
                          aria-label="Warna teks kustom"
                          className="w-7 h-7 rounded bg-transparent border border-white/10 cursor-pointer ml-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transformasi Layer (Opasitas, Skala, Rotasi, Posisi) */}
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Transformasi Layer
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          patchClipStyle({
                            opacity: 1,
                            scale: 1,
                            rotationDeg: 0,
                            posX: 50,
                            posY: 50,
                          })
                        }
                        className="text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        Reset Transformasi
                      </button>
                    </div>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Opasitas Layer</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {Math.round((selectedClip.style.opacity ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={selectedClip.style.opacity ?? 1}
                        onChange={(e) =>
                          patchClipStyle({ opacity: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Skala</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {Math.round((selectedClip.style.scale ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.3}
                        max={2}
                        step={0.02}
                        value={selectedClip.style.scale ?? 1}
                        onChange={(e) =>
                          patchClipStyle({ scale: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Rotasi</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {selectedClip.style.rotationDeg ?? 0}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={selectedClip.style.rotationDeg ?? 0}
                        onChange={(e) =>
                          patchClipStyle({ rotationDeg: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                          <span>Posisi X</span>
                          <span>{selectedClip.style.posX}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={95}
                          value={selectedClip.style.posX}
                          onChange={(e) =>
                            patchClipStyle({ posX: Number(e.target.value) })
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                          <span>Posisi Y</span>
                          <span>{selectedClip.style.posY}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={95}
                          value={selectedClip.style.posY}
                          onChange={(e) =>
                            patchClipStyle({ posY: Number(e.target.value) })
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANIMASI & FISIKA SPRING */}
              {activeTab === 'motion' && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Preset Animasi Klip</span>
                  </h2>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400">Animasi Masuk</span>
                    <select
                      value={selectedClip.animation.enterPreset}
                      onChange={(e) =>
                        patchClipAnim({
                          enterPreset: e.target.value as EnterAnimationPreset,
                        })
                      }
                      className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      {ENTER_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400">Animasi Keluar</span>
                    <select
                      value={selectedClip.animation.exitPreset}
                      onChange={(e) =>
                        patchClipAnim({
                          exitPreset: e.target.value as ExitAnimationPreset,
                        })
                      }
                      className="w-full rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      {EXIT_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">Durasi Masuk (f)</span>
                      <input
                        type="number"
                        min={4}
                        max={60}
                        value={selectedClip.animation.enterFrames}
                        onChange={(e) =>
                          patchClipAnim({
                            enterFrames: Math.max(
                              4,
                              Math.min(60, Number(e.target.value) || 12)
                            ),
                          })
                        }
                        className="rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">Durasi Keluar (f)</span>
                      <input
                        type="number"
                        min={4}
                        max={60}
                        value={selectedClip.animation.exitFrames}
                        onChange={(e) =>
                          patchClipAnim({
                            exitFrames: Math.max(
                              4,
                              Math.min(60, Number(e.target.value) || 12)
                            ),
                          })
                        }
                        className="rounded-md bg-[#0B0F17] border border-white/10 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                    <h3 className="text-xs font-semibold text-slate-300">
                      Fisika Spring
                    </h3>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Spring Damping</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {selectedClip.animation.springDamping}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={28}
                        step={1}
                        value={selectedClip.animation.springDamping}
                        onChange={(e) =>
                          patchClipAnim({ springDamping: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Spring Stiffness</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {selectedClip.animation.springStiffness}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={260}
                        step={5}
                        value={selectedClip.animation.springStiffness}
                        onChange={(e) =>
                          patchClipAnim({ springStiffness: Number(e.target.value) })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Global Composition Audio, Duration & Direct Alpha Exports */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Durasi &amp; Audio Proyek
              </span>
              <button
                type="button"
                onClick={onFitDurationToClips}
                className="text-[11px] text-blue-300 hover:text-blue-200"
              >
                Paskan ke Klip
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Durasi Total (30 fps)</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {project.durationInFrames}f ({(project.durationInFrames / 30).toFixed(1)} dtk)
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={5400}
                step={15}
                value={project.durationInFrames}
                onChange={(e) =>
                  onUpdateProject(
                    (p) => ({ ...p, durationInFrames: Number(e.target.value) }),
                    false
                  )
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProject((p) => ({
                      ...p,
                      durationInFrames: Math.max(60, p.durationInFrames - 150),
                    }))
                  }
                  className="px-2 py-1 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] font-mono tabular-nums text-slate-300 transition-colors"
                >
                  -5d
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProject((p) => ({
                      ...p,
                      durationInFrames: Math.min(5400, p.durationInFrames + 150),
                    }))
                  }
                  className="px-2 py-1 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] font-mono tabular-nums text-slate-200 transition-colors"
                >
                  +5d
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProject((p) => ({
                      ...p,
                      durationInFrames: Math.min(5400, p.durationInFrames + 450),
                    }))
                  }
                  className="px-2 py-1 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] font-mono tabular-nums text-slate-200 transition-colors"
                >
                  +15d
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <input
                    type="number"
                    min={2}
                    max={180}
                    step={1}
                    aria-label="Durasi dalam detik"
                    value={Math.round(project.durationInFrames / 30)}
                    onChange={(e) => {
                      const sec = Math.max(
                        2,
                        Math.min(180, Number(e.target.value) || 2)
                      );
                      onUpdateProject((p) => ({
                        ...p,
                        durationInFrames: sec * 30,
                      }));
                    }}
                    className="w-14 rounded bg-[#0B0F17] border border-white/10 px-1.5 py-1 text-right text-[11px] font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">dtk</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-slate-300">
                {project.audioLabel ||
                  (project.compositionId === 'SseProtocolExplainer'
                    ? 'Narasi Bawaan (.mp3)'
                    : 'Narasi Bawaan (.flac)')}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateProject((p) => ({
                    ...p,
                    audioEnabled: !p.audioEnabled,
                    audioVolume: !p.audioEnabled ? 1 : p.audioVolume,
                  }))
                }
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  project.audioEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0B0F17] border border-white/10 text-slate-400'
                }`}
              >
                {project.audioEnabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            {project.audioEnabled && (
              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Volume Narasi</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {Math.round(project.audioVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={project.audioVolume}
                  onChange={(e) =>
                    onUpdateProject(
                      (p) => ({ ...p, audioVolume: Number(e.target.value) }),
                      false
                    )
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </label>
            )}

            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-slate-300">Sound FX (Sintesis)</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateProject((p) => {
                    const currentlyOn = p.soundFxEnabled ?? p.soundFxVolume > 0;
                    const nextOn = !currentlyOn;
                    return {
                      ...p,
                      soundFxEnabled: nextOn,
                      soundFxVolume:
                        nextOn && p.soundFxVolume <= 0 ? 0.75 : p.soundFxVolume,
                    };
                  })
                }
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  (project.soundFxEnabled ?? project.soundFxVolume > 0)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B0F17] border border-white/10 text-slate-400'
                }`}
              >
                {(project.soundFxEnabled ?? project.soundFxVolume > 0)
                  ? 'Aktif'
                  : 'Nonaktif'}
              </button>
            </div>

            {(project.soundFxEnabled ?? project.soundFxVolume > 0) && (
              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Volume Sound FX</span>
                  <span className="font-mono tabular-nums text-emerald-300">
                    {Math.round(project.soundFxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={project.soundFxVolume}
                  onChange={(e) =>
                    onUpdateProject(
                      (p) => ({
                        ...p,
                        soundFxVolume: Number(e.target.value),
                        soundFxEnabled: Number(e.target.value) > 0,
                      }),
                      false
                    )
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </label>
            )}

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenAlphaExport}
                className="w-full py-2 px-3 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-semibold text-blue-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Film className="w-3.5 h-3.5 text-blue-400" />
                <span>Unduh Alpha (Video Only)</span>
              </button>
              <button
                type="button"
                onClick={onDownloadSoundFx}
                disabled={sfxDownloading}
                className="w-full py-2 px-3 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {sfxDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>Unduh Sound FX (.wav)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

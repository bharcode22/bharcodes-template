import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Magnet,
  Music,
  Pause,
  Play,
  Plus,
  Redo2,
  Repeat,
  RotateCcw,
  Scissors,
  Trash2,
  Undo2,
  Unlock,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { PlayerRef } from '@remotion/player';
import type {
  CompositionId,
  CustomLayerType,
  ScenePresetId,
  TimelineClip,
} from '../remotion/types';
import { AUDIO_BEAT_CUES, SSE_BEAT_CUES, UIUX_BEAT_CUES } from '../utils/projectStorage';

interface StudioTimelineProps {
  playerRef: React.RefObject<PlayerRef | null>;
  compositionId?: CompositionId;
  currentFrame: number;
  durationInFrames: number;
  fps: number;
  isPlaying: boolean;
  loop: boolean;
  playbackRate: number;
  clips: TimelineClip[];
  selectedClipId: string | null;
  audioEnabled: boolean;
  audioVolume: number;
  audioLabel?: string;
  audioDurationFrames?: number;
  beatCues?: number[];
  soundFxEnabled: boolean;
  soundFxVolume: number;
  canUndo: boolean;
  canRedo: boolean;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onSeek: (frame: number) => void;
  onSelectClip: (clipId: string) => void;
  onUpdateClipTiming: (
    clipId: string,
    patch: {
      from: number;
      durationInFrames: number;
      sourceStartOffset: number;
    },
    commitHistory: boolean
  ) => void;
  onSplitClip: (clipId: string, atFrame: number) => void;
  onDuplicateClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onMoveTrack: (clipId: string, direction: -1 | 1) => void;
  onToggleVisibility: (clipId: string) => void;
  onToggleLock: (clipId: string) => void;
  onAddCustomLayer: (layerType: CustomLayerType) => void;
  onAddScenePreset: (sceneId: ScenePresetId) => void;
  onToggleAudio: () => void;
  onToggleSoundFx: () => void;
  onChangeDuration: (nextFrames: number) => void;
  onFitDurationToClips: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

type DragMode = 'move' | 'trim-left' | 'trim-right';

interface ActiveDragState {
  clipId: string;
  mode: DragMode;
  startClientX: number;
  origFrom: number;
  origDuration: number;
  origSourceOffset: number;
  currentFrom: number;
  currentDuration: number;
  currentOffset: number;
  snappedFrame: number | null;
}

function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const remFrames = frame % fps;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(remFrames).padStart(2, '0')}`;
}

function pickTickStep(visibleFrames: number): number {
  const candidates = [
    5, 10, 15, 30, 60, 90, 120, 150, 240, 300, 600, 900, 1200, 1800,
  ];
  const target = visibleFrames / 7;
  for (const step of candidates) {
    if (step >= target) return step;
  }
  return 1800;
}

const MQTT_PRESET_MENU: Array<{ id: ScenePresetId; label: string }> = [
  { id: 'scene-1-intro', label: '01. Kartu Kanan → Kiri' },
  { id: 'scene-2-mqtt', label: '02. Hardware → MQTT' },
  { id: 'scene-3-ws', label: '03. Terminal Apple' },
  { id: 'scene-3b-websocket', label: 'WebSocket Showcase' },
  { id: 'scene-4-flow', label: '04. Pipeline MQTT → React' },
  { id: 'scene-5-browser', label: '05. Grid HB Counting' },
  { id: 'scene-6-outro', label: '06. Alur JSON → UI' },
];

const SSE_PRESET_MENU: Array<{ id: ScenePresetId; label: string }> = [
  { id: 'sse-0-intro', label: '00. Teks Kata per Kata' },
  { id: 'sse-1-upload', label: '01. Upload Progress Bar' },
  { id: 'sse-2-axios-xhr', label: '02. Axios & XMLHttpRequest' },
  { id: 'sse-3-question', label: '03. Pertanyaan Realtime' },
  { id: 'sse-4a-intro', label: '04a. Perkenalan SSE' },
  { id: 'sse-4-protocol', label: '04b. Protokol SSE (1 Arah)' },
  { id: 'sse-5-vs-ws', label: '05. WebSocket (2 Arah)' },
  { id: 'sse-6a-intro', label: '06a. Cukup 1 Arah Saja' },
  { id: 'sse-6-one-way', label: '06b. Server Kirim Progress' },
  { id: 'sse-7-backend-outro', label: '07. Backend Kirim Bertahap' },
];

const UIUX_PRESET_MENU: Array<{ id: ScenePresetId; label: string }> = [
  { id: 'uiux-0-hook', label: '00. Hook: Tebak Kepala Atasan' },
  { id: 'uiux-1-prompting', label: '01. Walaupun Nge-prompt Aja' },
  { id: 'uiux-2-request', label: '02. Request Upload via AI' },
  { id: 'uiux-3-webapp', label: '03. Fitur Sudah Ada di Web App' },
  { id: 'uiux-4-conflict', label: '04. Experience Kurang Sesuai' },
  { id: 'uiux-5-improve', label: '05. Improve UX Dulu' },
  { id: 'uiux-6-dilemma', label: '06. Dev UX ≠ Atasan UX' },
  { id: 'uiux-7-role', label: '07. Tiga Tugas Utama UI/UX' },
  { id: 'uiux-8-bridge', label: '08. Jembatan Ide Sebelum Coding' },
];

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  compositionId = 'MqttWebSocketExplainer',
  currentFrame,
  durationInFrames,
  fps,
  isPlaying,
  loop,
  playbackRate,
  clips,
  selectedClipId,
  audioEnabled,
  audioVolume,
  audioLabel,
  audioDurationFrames,
  beatCues,
  soundFxEnabled,
  soundFxVolume,
  canUndo,
  canRedo,
  onTogglePlay,
  onToggleLoop,
  onChangePlaybackRate,
  onSeek,
  onSelectClip,
  onUpdateClipTiming,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
  onMoveTrack,
  onToggleVisibility,
  onToggleLock,
  onAddCustomLayer,
  onAddScenePreset,
  onToggleAudio,
  onToggleSoundFx,
  onChangeDuration,
  onFitDurationToClips,
  onUndo,
  onRedo,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [trackAreaWidth, setTrackAreaWidth] = useState<number>(600);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [addMenuOpen, setAddMenuOpen] = useState<boolean>(false);
  const [durationMenuOpen, setDurationMenuOpen] = useState<boolean>(false);
  const [dragState, setDragState] = useState<ActiveDragState | null>(null);

  const isUiUx = compositionId === 'UiUxEngineerExplainer';
  const isSse = compositionId === 'SseProtocolExplainer';
  const activeBeatCues =
    beatCues ??
    (isUiUx ? UIUX_BEAT_CUES : isSse ? SSE_BEAT_CUES : AUDIO_BEAT_CUES);
  const presetMenuItems = isUiUx
    ? UIUX_PRESET_MENU
    : isSse
      ? SSE_PRESET_MENU
      : MQTT_PRESET_MENU;
  const resolvedAudioLabel =
    audioLabel ||
    (isUiUx
      ? 'Audio Narasi UI/UX (.mp3)'
      : isSse
        ? 'Audio Narasi (.mp3)'
        : 'Audio Narasi (.flac)');
  const resolvedAudioDuration =
    audioDurationFrames ?? (isUiUx ? 2018 : isSse ? 1452 : 1010);

  const labelColWidth = 228;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const avail = Math.max(320, el.clientWidth - labelColWidth - 32);
      setTrackAreaWidth(avail);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!addMenuOpen && !durationMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        addMenuOpen &&
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setAddMenuOpen(false);
      }
      if (
        durationMenuOpen &&
        durationMenuRef.current &&
        !durationMenuRef.current.contains(e.target as Node)
      ) {
        setDurationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [addMenuOpen, durationMenuOpen]);

  const safeDuration = Math.max(1, durationInFrames - 1);
  const progressPct = Math.min(
    100,
    Math.max(0, (currentFrame / safeDuration) * 100)
  );
  const zoomedTrackPx = Math.round(trackAreaWidth * zoom);

  const applyZoom = useCallback(
    (nextZoomRaw: number) => {
      const nextZoom = Math.min(10, Math.max(1, Number(nextZoomRaw.toFixed(2))));
      setZoom(nextZoom);

      requestAnimationFrame(() => {
        const scroller = scrollContainerRef.current;
        if (!scroller) return;
        if (nextZoom <= 1) {
          scroller.scrollLeft = 0;
          return;
        }
        const totalTrackW = trackAreaWidth * nextZoom;
        const playheadX = (currentFrame / safeDuration) * totalTrackW;
        scroller.scrollLeft = Math.max(0, playheadX - trackAreaWidth * 0.5);
      });
    },
    [currentFrame, safeDuration, trackAreaWidth]
  );

  useEffect(() => {
    if (!isPlaying || zoom <= 1) return;
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const totalTrackW = trackAreaWidth * zoom;
    const playheadX = (currentFrame / safeDuration) * totalTrackW;
    const visibleStart = scroller.scrollLeft;
    const visibleEnd = visibleStart + trackAreaWidth;

    if (playheadX < visibleStart + 24 || playheadX > visibleEnd - 36) {
      scroller.scrollLeft = Math.max(0, playheadX - trackAreaWidth * 0.25);
    }
  }, [currentFrame, isPlaying, safeDuration, trackAreaWidth, zoom]);

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.5 : -0.5;
    applyZoom(zoom + delta);
  };

  const seekFromClientX = (clientX: number) => {
    const el = scrubberRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * (durationInFrames - 1)));
  };

  const handleScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    seekFromClientX(e.clientX);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    seekFromClientX(e.clientX);
  };

  const handleScrubUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsScrubbing(false);
    }
  };

  // Compute snap targets (playhead, other clip boundaries, audio cues)
  const findNearestSnap = useCallback(
    (candidateFrame: number, excludeClipId: string): number | null => {
      if (!snapEnabled) return null;
      const pxPerFrame = zoomedTrackPx / Math.max(1, durationInFrames);
      const thresholdFrames = Math.max(2, Math.round(9 / Math.max(0.1, pxPerFrame)));

      const targets = new Set<number>([0, currentFrame, durationInFrames]);
      if (audioEnabled) {
        for (const cue of activeBeatCues) {
          if (cue <= durationInFrames) targets.add(cue);
        }
      }
      for (const c of clips) {
        if (c.id === excludeClipId) continue;
        targets.add(c.from);
        targets.add(c.from + c.durationInFrames);
      }

      let best: number | null = null;
      let bestDist = thresholdFrames + 1;
      for (const target of targets) {
        const dist = Math.abs(candidateFrame - target);
        if (dist <= thresholdFrames && dist < bestDist) {
          bestDist = dist;
          best = target;
        }
      }
      return best;
    },
    [activeBeatCues, audioEnabled, clips, currentFrame, durationInFrames, snapEnabled, zoomedTrackPx]
  );

  // Global window pointer handlers for clip drag / trim
  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startClientX;
      const framesDelta = Math.round(
        (dx / Math.max(1, zoomedTrackPx)) * durationInFrames
      );

      if (dragState.mode === 'move') {
        const rawFrom = Math.max(0, dragState.origFrom + framesDelta);
        const snapStart = findNearestSnap(rawFrom, dragState.clipId);
        const snapEnd = findNearestSnap(
          rawFrom + dragState.origDuration,
          dragState.clipId
        );

        let nextFrom = rawFrom;
        let snapped: number | null = null;

        if (snapStart !== null) {
          nextFrom = Math.max(0, snapStart);
          snapped = snapStart;
        } else if (snapEnd !== null) {
          nextFrom = Math.max(0, snapEnd - dragState.origDuration);
          snapped = snapEnd;
        }

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentFrom: nextFrom,
                currentDuration: prev.origDuration,
                currentOffset: prev.origSourceOffset,
                snappedFrame: snapped,
              }
            : null
        );
        onUpdateClipTiming(
          dragState.clipId,
          {
            from: nextFrom,
            durationInFrames: dragState.origDuration,
            sourceStartOffset: dragState.origSourceOffset,
          },
          false
        );
      } else if (dragState.mode === 'trim-left') {
        const origEnd = dragState.origFrom + dragState.origDuration;
        const maxFrom = origEnd - 6;
        const minFrom = Math.max(0, dragState.origFrom - dragState.origSourceOffset);
        const rawFrom = Math.min(
          maxFrom,
          Math.max(minFrom, dragState.origFrom + framesDelta)
        );
        const snapped = findNearestSnap(rawFrom, dragState.clipId);
        const nextFrom =
          snapped !== null
            ? Math.min(maxFrom, Math.max(minFrom, snapped))
            : rawFrom;
        const delta = nextFrom - dragState.origFrom;
        const nextDur = Math.max(6, dragState.origDuration - delta);
        const nextOffset = Math.max(0, dragState.origSourceOffset + delta);

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentFrom: nextFrom,
                currentDuration: nextDur,
                currentOffset: nextOffset,
                snappedFrame: snapped,
              }
            : null
        );
        onUpdateClipTiming(
          dragState.clipId,
          {
            from: nextFrom,
            durationInFrames: nextDur,
            sourceStartOffset: nextOffset,
          },
          false
        );
      } else if (dragState.mode === 'trim-right') {
        const rawEnd = Math.max(
          dragState.origFrom + 6,
          dragState.origFrom + dragState.origDuration + framesDelta
        );
        const snapped = findNearestSnap(rawEnd, dragState.clipId);
        const nextEnd =
          snapped !== null
            ? Math.max(dragState.origFrom + 6, snapped)
            : rawEnd;
        const nextDur = Math.max(6, nextEnd - dragState.origFrom);

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentFrom: prev.origFrom,
                currentDuration: nextDur,
                currentOffset: prev.origSourceOffset,
                snappedFrame: snapped,
              }
            : null
        );
        onUpdateClipTiming(
          dragState.clipId,
          {
            from: dragState.origFrom,
            durationInFrames: nextDur,
            sourceStartOffset: dragState.origSourceOffset,
          },
          false
        );
      }
    };

    const onUp = () => {
      onUpdateClipTiming(
        dragState.clipId,
        {
          from: dragState.currentFrom,
          durationInFrames: dragState.currentDuration,
          sourceStartOffset: dragState.currentOffset,
        },
        true
      );
      setDragState(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, durationInFrames, findNearestSnap, onUpdateClipTiming, zoomedTrackPx]);

  const startClipDrag = (
    e: React.PointerEvent,
    clip: TimelineClip,
    mode: DragMode
  ) => {
    e.stopPropagation();
    onSelectClip(clip.id);
    if (clip.locked) return;
    setDragState({
      clipId: clip.id,
      mode,
      startClientX: e.clientX,
      origFrom: clip.from,
      origDuration: clip.durationInFrames,
      origSourceOffset: clip.sourceStartOffset,
      currentFrom: clip.from,
      currentDuration: clip.durationInFrames,
      currentOffset: clip.sourceStartOffset,
      snappedFrame: null,
    });
  };

  // Ordered top-to-bottom by trackRow ascending (trackRow 0 = top layer)
  const orderedClips = [...clips].sort((a, b) => a.trackRow - b.trackRow);
  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null;

  // Target for Split: selected clip covering playhead, or topmost unlocked visible clip under playhead
  const splitTarget =
    selectedClip &&
    !selectedClip.locked &&
    currentFrame > selectedClip.from + 2 &&
    currentFrame < selectedClip.from + selectedClip.durationInFrames - 2
      ? selectedClip
      : orderedClips.find(
          (c) =>
            c.visible &&
            !c.locked &&
            currentFrame > c.from + 2 &&
            currentFrame < c.from + c.durationInFrames - 2
        ) ?? null;

  const visibleFrames = durationInFrames / zoom;
  const rulerStep = pickTickStep(visibleFrames);
  const rulerTicks: number[] = [];
  for (let f = 0; f < durationInFrames; f += rulerStep) {
    rulerTicks.push(f);
  }

  return (
    <section
      aria-label="Timeline dan editor klip"
      className="border-t border-white/10 bg-[#0F141F] flex flex-col shrink-0 select-none"
    >
      {/* Top Transport & NLE Editing Bar */}
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between gap-3 overflow-x-auto">
        {/* Left: Playback + History */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onSeek(0)}
            title="Kembali ke awal"
            aria-label="Kembali ke frame awal"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentFrame - 1))}
            title="Mundur 1 frame (Panah Kiri)"
            aria-label="Mundur 1 frame"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
            className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Putar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeek(Math.min(durationInFrames - 1, currentFrame + 1))}
            title="Maju 1 frame (Panah Kanan)"
            aria-label="Maju 1 frame"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            title="Ulang otomatis"
            aria-pressed={loop}
            className={`h-8 px-2 rounded-md text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              loop
                ? 'bg-white/12 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" aria-hidden="true" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd + Z)"
            aria-label="Undo"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd + Shift + Z)"
            aria-label="Redo"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" aria-hidden="true" />

          {/* NLE Clip Actions: Add Layer, Split, Duplicate, Delete, Snap */}
          <div ref={addMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              className="h-8 px-2.5 rounded-md bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Tambah Layer</span>
            </button>

            {addMenuOpen && (
              <div className="absolute left-0 bottom-10 z-50 w-64 rounded-lg border border-white/15 bg-[#111827] shadow-2xl p-2 flex flex-col gap-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                  Layer Bebas (Di Posisi Playhead)
                </div>
                {(
                  [
                    { id: 'glass-card', label: 'Kartu Kaca Apple' },
                    { id: 'kinetic-text', label: 'Teks Kinetik Sorotan' },
                    { id: 'terminal', label: 'Terminal Kustom' },
                    { id: 'badge-node', label: 'Badge Node & Ikon' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onAddCustomLayer(item.id);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded text-xs text-slate-200 hover:bg-blue-600/20 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}

                <div className="my-1 border-t border-white/10" />
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                  Sisipkan Adegan Preset
                </div>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                  {presetMenuItems.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => {
                        onAddScenePreset(scene.id);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors truncate"
                    >
                      {scene.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!splitTarget}
            onClick={() => splitTarget && onSplitClip(splitTarget.id, currentFrame)}
            title="Potong klip di posisi playhead (Tombol S)"
            className="h-8 px-2.5 rounded-md border border-white/10 bg-[#0B0F17] hover:bg-white/10 disabled:opacity-35 text-xs text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Split</span>
          </button>

          <button
            type="button"
            disabled={!selectedClip}
            onClick={() => selectedClip && onDuplicateClip(selectedClip.id)}
            title="Duplikat klip terpilih"
            className="h-8 w-8 rounded-md border border-white/10 bg-[#0B0F17] hover:bg-white/10 disabled:opacity-35 text-slate-200 flex items-center justify-center transition-colors shrink-0"
            aria-label="Duplikat klip"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!selectedClip || selectedClip.locked}
            onClick={() => selectedClip && onDeleteClip(selectedClip.id)}
            title="Hapus klip terpilih"
            className="h-8 w-8 rounded-md border border-white/10 bg-[#0B0F17] hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-35 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors shrink-0"
            aria-label="Hapus klip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSnapEnabled((v) => !v)}
            aria-pressed={snapEnabled}
            title="Snap tepi klip ke playhead, klip lain, dan cue audio"
            className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              snapEnabled
                ? 'bg-amber-500/15 border-amber-500/45 text-amber-300'
                : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          <button
            type="button"
            onClick={onToggleAudio}
            aria-pressed={audioEnabled && audioVolume > 0}
            title={
              audioEnabled && audioVolume > 0
                ? 'Matikan Audio Narasi'
                : 'Nyalakan Audio Narasi'
            }
            className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              audioEnabled && audioVolume > 0
                ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300'
                : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {audioEnabled && audioVolume > 0 ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>Audio</span>
          </button>
        </div>

        {/* Center: Timecode & Editable Timeline Duration */}
        <div
          ref={durationMenuRef}
          className="relative flex items-center gap-1.5 font-mono text-xs tabular-nums whitespace-nowrap shrink-0"
        >
          <span className="text-slate-100 font-semibold">
            {formatTimecode(currentFrame, fps)}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="text-slate-400">
            {String(currentFrame).padStart(3, '0')}f
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={() => setDurationMenuOpen((v) => !v)}
            title="Klik untuk atur panjang durasi timeline"
            className={`px-2 py-1 rounded border text-xs font-mono tabular-nums flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              durationMenuOpen
                ? 'bg-blue-600/20 border-blue-500/60 text-white'
                : 'bg-[#0B0F17] border-white/10 text-slate-200 hover:border-white/25'
            }`}
          >
            <Clock className="w-3 h-3 text-blue-400" />
            <span>
              {durationInFrames}f ({(durationInFrames / fps).toFixed(1)}d)
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeDuration(durationInFrames + fps * 5)}
            disabled={durationInFrames >= 5400}
            title="Tambah panjang timeline +5 detik (+150 frame)"
            className="px-2 py-1 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 disabled:opacity-35 text-[11px] font-mono tabular-nums text-blue-300 transition-colors whitespace-nowrap shrink-0"
          >
            +5d
          </button>

          {durationMenuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-10 z-50 w-72 rounded-lg border border-white/15 bg-[#111827] shadow-2xl p-3 flex flex-col gap-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Panjang Timeline (30 fps)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onFitDurationToClips();
                    setDurationMenuOpen(false);
                  }}
                  className="text-[11px] text-blue-300 hover:text-blue-200 underline underline-offset-2"
                >
                  Paskan ke Klip
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '-5d', delta: -150 },
                  { label: '-1d', delta: -30 },
                  { label: '+5d', delta: 150 },
                  { label: '+15d', delta: 450 },
                ].map((step) => (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() =>
                      onChangeDuration(durationInFrames + step.delta)
                    }
                    className="py-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-xs font-mono tabular-nums text-slate-200 transition-colors"
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-slate-400">
                  Preset Cepat (Maks 180 detik)
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[15, 30, 45, 60, 90, 120, 150, 180].map((sec) => {
                    const frames = sec * fps;
                    const active = durationInFrames === frames;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => onChangeDuration(frames)}
                        className={`py-1 rounded border text-[11px] font-mono tabular-nums transition-colors ${
                          active
                            ? 'bg-blue-600/25 border-blue-500 text-white font-semibold'
                            : 'bg-[#0B0F17] border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {sec}d
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400">Detik</span>
                  <input
                    type="number"
                    min={2}
                    max={180}
                    value={Math.round(durationInFrames / fps)}
                    onChange={(e) => {
                      const sec = Math.max(
                        2,
                        Math.min(180, Number(e.target.value) || 2)
                      );
                      onChangeDuration(sec * fps);
                    }}
                    className="rounded bg-[#0B0F17] border border-white/10 px-2 py-1 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400">Frame</span>
                  <input
                    type="number"
                    min={60}
                    max={5400}
                    step={15}
                    value={durationInFrames}
                    onChange={(e) => {
                      const f = Math.max(
                        60,
                        Math.min(5400, Number(e.target.value) || 60)
                      );
                      onChangeDuration(f);
                    }}
                    className="rounded bg-[#0B0F17] border border-white/10 px-2 py-1 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right: Zoom & Playback Rate */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            title="Zoom Timeline (atau Ctrl/Cmd + Scroll)"
            className="flex items-center gap-1 bg-[#0B0F17] px-2 py-1 rounded-md border border-white/10"
          >
            <button
              type="button"
              onClick={() => applyZoom(zoom - 0.5)}
              disabled={zoom <= 1}
              aria-label="Perkecil zoom timeline"
              className="text-slate-400 hover:text-white disabled:opacity-35 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={1}
              max={10}
              step={0.25}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Level zoom timeline"
              className="w-14 accent-blue-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => applyZoom(zoom + 0.5)}
              disabled={zoom >= 10}
              aria-label="Perbesar zoom timeline"
              className="text-slate-400 hover:text-white disabled:opacity-35 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyZoom(1)}
              className="ml-0.5 text-[11px] font-mono tabular-nums text-slate-300 hover:text-white min-w-[30px] text-right"
            >
              {zoom === 1 ? 'Fit' : `${zoom.toFixed(1)}x`}
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-[#0B0F17] p-0.5 rounded-md border border-white/10">
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 ${
                  playbackRate === rate
                    ? 'bg-white/12 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Multi-Track NLE Canvas */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheelZoom}
        className="max-h-64 overflow-auto px-4 py-2.5"
      >
        <div
          style={{ width: labelColWidth + zoomedTrackPx }}
          className="flex flex-col gap-1.5 relative"
        >
          {/* Sticky Ruler */}
          <div className="sticky top-0 z-20 bg-[#0F141F] pb-1 flex items-center">
            <div
              style={{ width: labelColWidth }}
              className="sticky left-0 z-30 shrink-0 bg-[#0F141F] pr-3 text-xs font-medium text-slate-400 flex items-center justify-between"
            >
              <span>Layer Stack</span>
              <span className="font-mono text-[10px] text-slate-500">
                {clips.length} klip
              </span>
            </div>

            <div
              ref={scrubberRef}
              onPointerDown={handleScrubDown}
              onPointerMove={handleScrubMove}
              onPointerUp={handleScrubUp}
              role="slider"
              aria-label="Scrubber frame timeline"
              aria-valuemin={0}
              aria-valuemax={durationInFrames - 1}
              aria-valuenow={currentFrame}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  onSeek(Math.min(durationInFrames - 1, currentFrame + 1));
                } else if (e.key === 'ArrowLeft') {
                  onSeek(Math.max(0, currentFrame - 1));
                }
              }}
              style={{ width: zoomedTrackPx }}
              className="relative shrink-0 h-7 bg-[#0B0F17] border border-white/10 rounded cursor-ew-resize overflow-hidden"
            >
              {rulerTicks.map((tick) => {
                const leftPct = (tick / safeDuration) * 100;
                return (
                  <div
                    key={tick}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-0 bottom-0 border-l border-white/10 pl-1 flex items-center pointer-events-none"
                  >
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {tick}f
                    </span>
                  </div>
                );
              })}

              {/* Audio Cue Beat Markers (when Audio enabled) */}
              {audioEnabled &&
                activeBeatCues.filter((c) => c < durationInFrames).map((cue) => (
                  <div
                    key={`cue-${cue}`}
                    style={{ left: `${(cue / safeDuration) * 100}%` }}
                    className="absolute bottom-0 h-2 w-0.5 bg-emerald-400/70 pointer-events-none"
                  />
                ))}

              <div
                style={{ width: `${progressPct}%` }}
                className="absolute top-0 bottom-0 left-0 bg-blue-500/15 pointer-events-none"
              />
              <div
                style={{ left: `${progressPct}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-blue-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Interactive Track Rows */}
          {orderedClips.map((clip, rowIndex) => {
            const leftPct = (clip.from / durationInFrames) * 100;
            const widthPct = Math.max(
              1.6,
              (clip.durationInFrames / durationInFrames) * 100
            );
            const isSelected = clip.id === selectedClipId;
            const isDraggingThis = dragState?.clipId === clip.id;
            const isActiveAtPlayhead =
              clip.visible &&
              currentFrame >= clip.from &&
              currentFrame < clip.from + clip.durationInFrames;

            const barTone =
              clip.kind === 'custom-layer'
                ? '#A855F7'
                : clip.layerType === 'accent'
                  ? clip.style.accentColor || '#0071E3'
                  : clip.layerType === 'media'
                    ? '#0EA5E9'
                    : '#64748B';

            return (
              <div key={clip.id} className="flex items-center h-8">
                {/* Sticky Track Header Controls */}
                <div
                  style={{ width: labelColWidth }}
                  className={`sticky left-0 z-10 shrink-0 bg-[#0F141F] pr-2 h-full flex items-center justify-between gap-1 border-r border-white/5 ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClip(clip.id);
                      onSeek(clip.from);
                    }}
                    title={`Pilih & lompat ke ${clip.from}f`}
                    className={`flex-1 min-w-0 text-left text-xs truncate px-1.5 py-1 rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-200 font-semibold'
                        : 'hover:bg-white/5'
                    } ${!clip.visible ? 'opacity-45 line-through' : ''}`}
                  >
                    {clip.name}
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={rowIndex === 0}
                      onClick={() => onMoveTrack(clip.id, -1)}
                      title="Naikkan layer (di atas)"
                      aria-label="Naikkan layer"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-25"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={rowIndex === orderedClips.length - 1}
                      onClick={() => onMoveTrack(clip.id, 1)}
                      title="Turunkan layer (di bawah)"
                      aria-label="Turunkan layer"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-25"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(clip.id)}
                      title={clip.visible ? 'Sembunyikan layer' : 'Tampilkan layer'}
                      aria-label="Ubah visibilitas layer"
                      className={`p-1 rounded hover:bg-white/10 ${
                        clip.visible ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {clip.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLock(clip.id)}
                      title={clip.locked ? 'Buka kunci klip' : 'Kunci posisi klip'}
                      aria-label="Kunci atau buka klip"
                      className={`p-1 rounded hover:bg-white/10 ${
                        clip.locked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {clip.locked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Track Lane */}
                <div
                  style={{ width: zoomedTrackPx }}
                  className="relative shrink-0 h-7 bg-[#0B0F17]/75 rounded border border-white/5 overflow-visible"
                >
                  {/* Draggable & Trimmable Clip Block */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectClip(clip.id)}
                    onPointerDown={(e) => startClipDrag(e, clip, 'move')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelectClip(clip.id);
                      }
                    }}
                    title={`${clip.name} · ${clip.from}f–${clip.from + clip.durationInFrames}f (${clip.durationInFrames}f / ${(clip.durationInFrames / fps).toFixed(1)} dtk)${
                      clip.sourceStartOffset > 0
                        ? ` · Trim +${clip.sourceStartOffset}f`
                        : ''
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: isSelected
                        ? `${barTone}55`
                        : isActiveAtPlayhead
                          ? `${barTone}42`
                          : `${barTone}26`,
                      borderColor: isSelected
                        ? '#60A5FA'
                        : isActiveAtPlayhead
                          ? barTone
                          : 'rgba(255,255,255,0.14)',
                    }}
                    className={`absolute top-0.5 bottom-0.5 rounded border flex items-center justify-between gap-2 px-2.5 overflow-hidden transition-colors ${
                      clip.locked ? 'cursor-not-allowed opacity-75' : 'cursor-grab active:cursor-grabbing'
                    } ${isSelected ? 'ring-1 ring-blue-400/70 z-10' : ''} ${
                      !clip.visible ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Left Trim Handle */}
                    {!clip.locked && (
                      <div
                        onPointerDown={(e) => startClipDrag(e, clip, 'trim-left')}
                        title="Seret untuk memotong awal klip"
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/35 rounded-l"
                      />
                    )}

                    <span className="text-[11px] font-medium text-slate-100 truncate pointer-events-none">
                      {clip.name}
                    </span>

                    <span className="font-mono text-[10px] tabular-nums text-slate-300 shrink-0 whitespace-nowrap pointer-events-none">
                      {clip.durationInFrames}f · {(clip.durationInFrames / fps).toFixed(1)}d
                    </span>

                    {/* Right Trim Handle */}
                    {!clip.locked && (
                      <div
                        onPointerDown={(e) => startClipDrag(e, clip, 'trim-right')}
                        title="Seret untuk memotong akhir klip"
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/35 rounded-r"
                      />
                    )}

                    {/* Live Dragging Tooltip */}
                    {isDraggingThis && dragState && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-blue-600 text-[10px] font-mono tabular-nums text-white whitespace-nowrap shadow-lg pointer-events-none z-40">
                        {dragState.currentFrom}f → {dragState.currentFrom + dragState.currentDuration}f ({dragState.currentDuration}f)
                      </div>
                    )}
                  </div>

                  {/* Snap Guide Line */}
                  {dragState && dragState.snappedFrame !== null && (
                    <div
                      style={{
                        left: `${(dragState.snappedFrame / durationInFrames) * 100}%`,
                      }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none z-20"
                    />
                  )}

                  {/* Playhead Vertical Line */}
                  <div
                    style={{ left: `${progressPct}%` }}
                    className="absolute top-0 bottom-0 w-px bg-blue-400/60 pointer-events-none"
                  />
                </div>
              </div>
            );
          })}

          {/* Audio Tracks Section */}
          <div className="pt-1.5 mt-0.5 border-t border-white/10 flex flex-col gap-1.5">
            {/* Audio Track 1: Narasi */}
            {(() => {
              const narrationActive = audioEnabled && audioVolume > 0;
              const narrationFrames = Math.min(resolvedAudioDuration, durationInFrames);
              const narrationWidthPct = Math.max(
                4,
                (narrationFrames / safeDuration) * 100
              );
              const waveBars = [
                26, 48, 72, 40, 82, 65, 32, 74, 88, 52, 68, 42, 78, 60, 35, 84,
                56, 70, 44, 86, 62, 38, 76, 54, 80, 46, 66, 72, 36, 64, 48, 30,
              ];
              const narrationSubject = isSse ? 'Narasi Protokol SSE' : 'Narasi WebSocket';

              return (
                <div className="flex items-center h-8">
                  <div
                    style={{ width: labelColWidth }}
                    className="sticky left-0 z-10 shrink-0 bg-[#0F141F] pr-2 h-full flex items-center justify-between gap-1.5 border-r border-white/5"
                  >
                    <div
                      className={`flex items-center gap-1.5 min-w-0 text-xs ${
                        narrationActive ? 'text-emerald-300' : 'text-slate-500'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {resolvedAudioLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleAudio}
                      aria-pressed={narrationActive}
                      title={
                        narrationActive
                          ? 'Matikan Audio Narasi'
                          : 'Nyalakan Audio Narasi'
                      }
                      className={`px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                        narrationActive
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 hover:bg-emerald-500/25'
                          : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {narrationActive ? (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>On</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Off</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    style={{ width: zoomedTrackPx }}
                    className="relative shrink-0 h-7 bg-[#0B0F17]/75 rounded border border-white/5 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={onToggleAudio}
                      title={
                        narrationActive
                          ? 'Klik untuk mematikan Audio Narasi'
                          : 'Klik untuk menyalakan Audio Narasi'
                      }
                      style={{ width: `${narrationWidthPct}%` }}
                      className={`absolute left-0 top-0.5 bottom-0.5 rounded border px-2.5 flex items-center justify-between gap-2 overflow-hidden transition-colors text-left ${
                        narrationActive
                          ? 'bg-emerald-500/18 border-emerald-500/45 hover:bg-emerald-500/24'
                          : 'bg-slate-800/40 border-white/10 opacity-50 hover:opacity-75'
                      }`}
                    >
                      {/* Subtle waveform bars */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-between px-1 opacity-30 pointer-events-none"
                      >
                        {waveBars.map((h, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${h}%` }}
                            className={`w-[2px] rounded-full ${
                              narrationActive ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                        ))}
                      </div>

                      <span className="relative z-10 text-[11px] font-medium text-slate-100 truncate">
                        {narrationActive
                          ? `${narrationSubject} · Aktif`
                          : `${narrationSubject} · Nonaktif`}
                      </span>
                      <span className="relative z-10 font-mono text-[10px] tabular-nums text-slate-200 shrink-0 whitespace-nowrap">
                        {narrationActive
                          ? `${Math.round(audioVolume * 100)}% · ${narrationFrames}f`
                          : 'Mute'}
                      </span>
                    </button>

                    <div
                      style={{ left: `${progressPct}%` }}
                      className="absolute top-0 bottom-0 w-px bg-blue-400/60 pointer-events-none"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Audio Track 2: Sound FX */}
            {(() => {
              const sfxActive = soundFxEnabled && soundFxVolume > 0;
              return (
                <div className="flex items-center h-8">
                  <div
                    style={{ width: labelColWidth }}
                    className="sticky left-0 z-10 shrink-0 bg-[#0F141F] pr-2 h-full flex items-center justify-between gap-1.5 border-r border-white/5"
                  >
                    <div
                      className={`flex items-center gap-1.5 min-w-0 text-xs ${
                        sfxActive ? 'text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        Sound FX (Cue)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleSoundFx}
                      aria-pressed={sfxActive}
                      title={
                        sfxActive
                          ? 'Matikan Sound FX'
                          : 'Nyalakan Sound FX'
                      }
                      className={`px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                        sfxActive
                          ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-300 hover:bg-cyan-500/25'
                          : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sfxActive ? (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>On</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Off</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    style={{ width: zoomedTrackPx }}
                    className="relative shrink-0 h-7 bg-[#0B0F17]/75 rounded border border-white/5 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={onToggleSoundFx}
                      title={
                        sfxActive
                          ? 'Klik untuk mematikan Sound FX'
                          : 'Klik untuk menyalakan Sound FX'
                      }
                      className={`absolute inset-x-0 top-0.5 bottom-0.5 rounded border px-2.5 flex items-center justify-between gap-2 overflow-hidden transition-colors text-left ${
                        sfxActive
                          ? 'bg-cyan-500/12 border-cyan-500/35 hover:bg-cyan-500/20'
                          : 'bg-slate-800/40 border-white/10 opacity-50 hover:opacity-75'
                      }`}
                    >
                      {activeBeatCues.filter((c) => c < durationInFrames).map(
                        (cue) => (
                          <span
                            key={`sfx-cue-${cue}`}
                            style={{ left: `${(cue / safeDuration) * 100}%` }}
                            className={`absolute top-1 bottom-1 w-0.5 rounded-full pointer-events-none ${
                              sfxActive ? 'bg-cyan-400/75' : 'bg-slate-500/60'
                            }`}
                          />
                        )
                      )}
                      <span className="relative z-10 text-[11px] font-medium text-slate-200 truncate">
                        {sfxActive
                          ? 'Whoosh & Pop Sintesis · Aktif'
                          : 'Sound FX · Nonaktif'}
                      </span>
                      <span className="relative z-10 font-mono text-[10px] tabular-nums text-slate-300 shrink-0 whitespace-nowrap">
                        {sfxActive
                          ? `${Math.round(soundFxVolume * 100)}% · ${durationInFrames}f`
                          : 'Mute'}
                      </span>
                    </button>

                    <div
                      style={{ left: `${progressPct}%` }}
                      className="absolute top-0 bottom-0 w-px bg-blue-400/60 pointer-events-none"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

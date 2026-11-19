import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import {
  Copy,
  Download,
  FilePlus2,
  Film,
  Layers,
  Loader2,
  Move,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { COMPOSITIONS } from './remotion/registry';
import {
  ASPECT_PRESETS,
  type AspectPresetId,
  type CustomLayerType,
  type ScenePresetId,
  type StudioProject,
  type TimelineClip,
} from './remotion/types';
import { generateCompositionTsx } from './remotion/codeGenerator';
import { downloadSoundFxWav } from './audio/soundFxSynthesizer';
import {
  AUDIO_BEAT_CUES,
  SSE_BEAT_CUES,
  createBlankProject,
  createCustomLayerClip,
  createDefaultMqttProject,
  createDefaultSseProject,
  createScenePresetClip,
  exportProjectAsJson,
  loadProjectsFromStorage,
  makeUid,
  parseImportedProjectJson,
  projectToCompositionProps,
  saveProjectsToStorage,
} from './utils/projectStorage';
import { StudioTimeline } from './components/StudioTimeline';
import { PropertiesPanel } from './components/PropertiesPanel';
import { GalleryView } from './components/GalleryView';
import { ExportView } from './components/ExportView';
import { AlphaExportModal } from './components/AlphaExportModal';

type ActiveView = 'studio' | 'gallery' | 'export';

interface HistoryState {
  past: StudioProject[];
  future: StudioProject[];
}

const MAX_HISTORY = 40;

function cloneProject(proj: StudioProject): StudioProject {
  return JSON.parse(JSON.stringify(proj)) as StudioProject;
}

function normalizeTrackRows(clips: TimelineClip[]): TimelineClip[] {
  return [...clips]
    .sort((a, b) => a.trackRow - b.trackRow)
    .map((clip, index) => ({ ...clip, trackRow: index }));
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('studio');
  const [projects, setProjects] = useState<StudioProject[]>(() =>
    loadProjectsFromStorage()
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(
    () => projects[0]?.id ?? 'project-sse-default'
  );
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    () => projects[0]?.clips[0]?.id ?? null
  );
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
  });

  const playerRef = useRef<PlayerRef>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPreSnapshotRef = useRef<StudioProject | null>(null);

  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 720,
    height: 405,
  });
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loop, setLoop] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [previewBackdrop, setPreviewBackdrop] = useState<
    'checker' | 'dark' | 'light' | 'gradient'
  >('checker');
  const [alphaModalOpen, setAlphaModalOpen] = useState<boolean>(false);
  const [sfxDownloading, setSfxDownloading] = useState<boolean>(false);
  const [canvasMode, setCanvasMode] = useState<'play' | 'move'>('play');
  const [canvasDrag, setCanvasDrag] = useState<{
    clipId: string;
    startClientX: number;
    startClientY: number;
    origPosX: number;
    origPosY: number;
    currPosX: number;
    currPosY: number;
    snappedX: boolean;
    snappedY: boolean;
  } | null>(null);
  const [notice, setNotice] = useState<{
    type: 'info' | 'error';
    text: string;
  } | null>(null);

  const showNotice = useCallback((text: string, type: 'info' | 'error' = 'info') => {
    setNotice({ text, type });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Debounced auto-save to browser localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveProjectsToStorage(projects);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [projects]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects]
  );

  // Keep activeProjectId valid if active project was deleted
  useEffect(() => {
    if (activeProject && activeProject.id !== activeProjectId) {
      setActiveProjectId(activeProject.id);
      setSelectedClipId(activeProject.clips[0]?.id ?? null);
    }
  }, [activeProject, activeProjectId]);

  const activeComp =
    COMPOSITIONS[activeProject.compositionId ?? 'MqttWebSocketExplainer'];
  const activeAspect = ASPECT_PRESETS[activeProject.aspectId];
  const fps = 30;
  const durationInFrames = activeProject.durationInFrames;

  const activeProps = useMemo(
    () => projectToCompositionProps(activeProject),
    [activeProject]
  );

  const selectedClip = useMemo(
    () =>
      activeProject.clips.find((c) => c.id === selectedClipId) ??
      activeProject.clips[0] ??
      null,
    [activeProject.clips, selectedClipId]
  );

  // Fit preview canvas inside stage viewport
  useEffect(() => {
    const el = stageRef.current;
    if (!el || activeView !== 'studio') return;

    const updateSize = () => {
      const pad = 40;
      const availW = Math.max(200, el.clientWidth - pad);
      const availH = Math.max(160, el.clientHeight - pad);
      const targetRatio = activeAspect.width / activeAspect.height;
      const availRatio = availW / availH;

      if (availRatio > targetRatio) {
        const h = availH;
        const w = Math.floor(h * targetRatio);
        setStageSize({ width: w, height: Math.floor(h) });
      } else {
        const w = availW;
        const h = Math.floor(w / targetRatio);
        setStageSize({ width: Math.floor(w), height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeAspect.width, activeAspect.height, activeView]);

  // Sync Remotion Player events to React state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    player.addEventListener('frameupdate', handleFrameUpdate);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('ended', handleEnded);

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('ended', handleEnded);
    };
  }, [activeProject.id, activeView, activeProject.aspectId, fps, durationInFrames]);

  const mutateActiveProject = useCallback(
    (
      updater: (proj: StudioProject) => StudioProject,
      commitHistory = true
    ) => {
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === activeProject.id);
        if (idx === -1) return prev;
        const current = prev[idx];
        const updated = {
          ...updater(current),
          fps: 30 as const,
          updatedAt: Date.now(),
        };

        if (commitHistory) {
          const snapshotToPush = dragPreSnapshotRef.current ?? current;
          dragPreSnapshotRef.current = null;
          setHistory((h) => ({
            past: [...h.past.slice(-(MAX_HISTORY - 1)), cloneProject(snapshotToPush)],
            future: [],
          }));
        } else if (!dragPreSnapshotRef.current) {
          dragPreSnapshotRef.current = cloneProject(current);
        }

        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    },
    [activeProject.id]
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const nextPast = h.past.slice(0, -1);
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? cloneProject(previous) : p))
      );
      if (previous.clips.length > 0) {
        setSelectedClipId((sel) =>
          previous.clips.some((c) => c.id === sel) ? sel : previous.clips[0].id
        );
      }
      return {
        past: nextPast,
        future: [cloneProject(activeProject), ...h.future.slice(0, MAX_HISTORY - 1)],
      };
    });
  }, [activeProject]);

  const handleRedo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const nextSnap = h.future[0];
      const nextFuture = h.future.slice(1);
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? cloneProject(nextSnap) : p))
      );
      if (nextSnap.clips.length > 0) {
        setSelectedClipId((sel) =>
          nextSnap.clips.some((c) => c.id === sel) ? sel : nextSnap.clips[0].id
        );
      }
      return {
        past: [...h.past.slice(-(MAX_HISTORY - 1)), cloneProject(activeProject)],
        future: nextFuture,
      };
    });
  }, [activeProject]);

  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  }, []);

  const handleSeek = useCallback(
    (frame: number) => {
      const clamped = Math.max(0, Math.min(durationInFrames - 1, Math.round(frame)));
      setCurrentFrame(clamped);
      playerRef.current?.seekTo(clamped);
    },
    [durationInFrames]
  );

  // Project Management Handlers
  const handleSelectProject = useCallback(
    (projectId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      playerRef.current?.pause();
      setActiveProjectId(target.id);
      setSelectedClipId(target.clips[0]?.id ?? null);
      setHistory({ past: [], future: [] });
      dragPreSnapshotRef.current = null;
      setCurrentFrame(0);
      setIsPlaying(false);
      setActiveView('studio');
    },
    [projects]
  );

  const handleCreateBlankProject = useCallback(() => {
    const count = projects.filter((p) => !p.isDefaultTemplate).length + 1;
    const newProj = createBlankProject(
      `Komposisi Baru ${count}`,
      activeProject.aspectId
    );
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setSelectedClipId(newProj.clips[0]?.id ?? null);
    setHistory({ past: [], future: [] });
    setCurrentFrame(0);
    setIsPlaying(false);
    setActiveView('studio');
    showNotice(`Komposisi "${newProj.title}" dibuat`);
  }, [activeProject.aspectId, projects, showNotice]);

  const handleDuplicateProject = useCallback(
    (projectId: string) => {
      const src = projects.find((p) => p.id === projectId);
      if (!src) return;
      const now = Date.now();
      const copy: StudioProject = {
        ...cloneProject(src),
        id: makeUid('proj'),
        title: `${src.title} (Salinan)`,
        isDefaultTemplate: false,
        createdAt: now,
        updatedAt: now,
        clips: src.clips.map((c) => ({ ...cloneProject(src).clips[0], ...c, id: makeUid('clip') })),
      };
      setProjects((prev) => [copy, ...prev]);
      setActiveProjectId(copy.id);
      setSelectedClipId(copy.clips[0]?.id ?? null);
      setHistory({ past: [], future: [] });
      setCurrentFrame(0);
      setActiveView('studio');
      showNotice(`Komposisi "${copy.title}" diduplikat`);
    },
    [projects, showNotice]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (projects.length <= 1) {
        showNotice('Minimal satu komposisi harus tetap ada', 'error');
        return;
      }
      const target = projects.find((p) => p.id === projectId);
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProjectId === projectId && remaining[0]) {
        setActiveProjectId(remaining[0].id);
        setSelectedClipId(remaining[0].clips[0]?.id ?? null);
        setHistory({ past: [], future: [] });
        setCurrentFrame(0);
      }
      if (target) {
        showNotice(`Komposisi "${target.title}" dihapus`);
      }
    },
    [activeProjectId, projects, showNotice]
  );

  const handleImportJsonFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const text = await file.text();
        const imported = parseImportedProjectJson(text);
        setProjects((prev) => [imported, ...prev]);
        setActiveProjectId(imported.id);
        setSelectedClipId(imported.clips[0]?.id ?? null);
        setHistory({ past: [], future: [] });
        setCurrentFrame(0);
        setActiveView('studio');
        showNotice(`Berhasil mengimpor "${imported.title}"`);
      } catch (err) {
        showNotice(
          err instanceof Error ? err.message : 'Gagal membaca file JSON',
          'error'
        );
      }
    },
    [showNotice]
  );

  // Clip / Timeline Editing Handlers
  const handleUpdateClipTiming = useCallback(
    (
      clipId: string,
      patch: { from: number; durationInFrames: number; sourceStartOffset: number },
      commitHistory: boolean
    ) => {
      const clampedFrom = Math.max(0, Math.round(patch.from));
      const clampedDur = Math.max(6, Math.round(patch.durationInFrames));
      const clampedOffset = Math.max(0, Math.round(patch.sourceStartOffset));

      mutateActiveProject(
        (proj) => {
          const neededEnd = clampedFrom + clampedDur;
          const nextDuration =
            commitHistory && neededEnd > proj.durationInFrames
              ? Math.min(5400, Math.ceil(neededEnd / 30) * 30)
              : proj.durationInFrames;

          return {
            ...proj,
            durationInFrames: nextDuration,
            clips: proj.clips.map((c) =>
              c.id === clipId
                ? {
                    ...c,
                    from: clampedFrom,
                    durationInFrames: clampedDur,
                    sourceStartOffset: clampedOffset,
                  }
                : c
            ),
          };
        },
        commitHistory
      );
    },
    [mutateActiveProject]
  );

  const handleSplitClip = useCallback(
    (clipId: string, atFrame: number) => {
      const clip = activeProject.clips.find((c) => c.id === clipId);
      if (!clip || clip.locked) return;
      if (atFrame <= clip.from + 4 || atFrame >= clip.from + clip.durationInFrames - 4) {
        return;
      }

      const leftDur = atFrame - clip.from;
      const rightDur = clip.durationInFrames - leftDur;
      const baseName = clip.name.replace(/\s*\(Bagian \d+\)$/i, '');

      const clipA: TimelineClip = {
        ...clip,
        name: `${baseName} (Bagian 1)`,
        durationInFrames: leftDur,
      };
      const clipB: TimelineClip = {
        ...JSON.parse(JSON.stringify(clip)),
        id: makeUid('clip'),
        name: `${baseName} (Bagian 2)`,
        trackRow: clip.trackRow + 1,
        from: atFrame,
        durationInFrames: rightDur,
        sourceStartOffset: clip.sourceStartOffset + leftDur,
      };

      mutateActiveProject((proj) => {
        const nextClips = proj.clips.flatMap((c) => {
          if (c.id === clipId) return [clipA, clipB];
          if (c.trackRow > clip.trackRow) {
            return [{ ...c, trackRow: c.trackRow + 1 }];
          }
          return [c];
        });
        return { ...proj, clips: normalizeTrackRows(nextClips) };
      }, true);

      setSelectedClipId(clipB.id);
      showNotice(`Klip dipotong di frame ${atFrame}f`);
    },
    [activeProject.clips, mutateActiveProject, showNotice]
  );

  const handleDuplicateClip = useCallback(
    (clipId: string) => {
      const clip = activeProject.clips.find((c) => c.id === clipId);
      if (!clip) return;
      const copy: TimelineClip = {
        ...(JSON.parse(JSON.stringify(clip)) as TimelineClip),
        id: makeUid('clip'),
        name: `${clip.name} (Salinan)`,
        from: Math.min(
          Math.max(0, activeProject.durationInFrames - clip.durationInFrames),
          clip.from + 12
        ),
        trackRow: clip.trackRow + 1,
        locked: false,
      };

      mutateActiveProject((proj) => {
        const shifted = proj.clips.map((c) =>
          c.trackRow > clip.trackRow ? { ...c, trackRow: c.trackRow + 1 } : c
        );
        return { ...proj, clips: normalizeTrackRows([...shifted, copy]) };
      }, true);

      setSelectedClipId(copy.id);
    },
    [activeProject.clips, activeProject.durationInFrames, mutateActiveProject]
  );

  const handleDeleteClip = useCallback(
    (clipId: string) => {
      const clip = activeProject.clips.find((c) => c.id === clipId);
      if (!clip || clip.locked) return;

      const remaining = normalizeTrackRows(
        activeProject.clips.filter((c) => c.id !== clipId)
      );

      mutateActiveProject((proj) => ({ ...proj, clips: remaining }), true);
      if (selectedClipId === clipId) {
        setSelectedClipId(remaining[0]?.id ?? null);
      }
      showNotice(`Layer "${clip.name}" dihapus`);
    },
    [activeProject.clips, mutateActiveProject, selectedClipId, showNotice]
  );

  const handleMoveTrack = useCallback(
    (clipId: string, direction: -1 | 1) => {
      mutateActiveProject((proj) => {
        const sorted = normalizeTrackRows(proj.clips);
        const idx = sorted.findIndex((c) => c.id === clipId);
        const swapIdx = idx + direction;
        if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return proj;
        const temp = sorted[idx];
        sorted[idx] = sorted[swapIdx];
        sorted[swapIdx] = temp;
        return {
          ...proj,
          clips: sorted.map((c, i) => ({ ...c, trackRow: i })),
        };
      }, true);
    },
    [mutateActiveProject]
  );

  const handleToggleVisibility = useCallback(
    (clipId: string) => {
      mutateActiveProject(
        (proj) => ({
          ...proj,
          clips: proj.clips.map((c) =>
            c.id === clipId ? { ...c, visible: !c.visible } : c
          ),
        }),
        true
      );
    },
    [mutateActiveProject]
  );

  const handleToggleLock = useCallback(
    (clipId: string) => {
      mutateActiveProject(
        (proj) => ({
          ...proj,
          clips: proj.clips.map((c) =>
            c.id === clipId ? { ...c, locked: !c.locked } : c
          ),
        }),
        true
      );
    },
    [mutateActiveProject]
  );

  const handleAddCustomLayer = useCallback(
    (layerType: CustomLayerType) => {
      const newClip = createCustomLayerClip(
        layerType,
        currentFrame,
        0,
        activeProject.appleDarkMode,
        activeProject.accentColor
      );

      mutateActiveProject((proj) => {
        const neededEnd = newClip.from + newClip.durationInFrames;
        const nextDuration = Math.max(proj.durationInFrames, neededEnd);
        const shifted = proj.clips.map((c) => ({ ...c, trackRow: c.trackRow + 1 }));
        return {
          ...proj,
          durationInFrames: nextDuration,
          clips: normalizeTrackRows([newClip, ...shifted]),
        };
      }, true);

      setSelectedClipId(newClip.id);
      showNotice(`Layer "${newClip.name}" ditambahkan di ${currentFrame}f`);
    },
    [
      activeProject.accentColor,
      activeProject.appleDarkMode,
      currentFrame,
      mutateActiveProject,
      showNotice,
    ]
  );

  const handleAddScenePreset = useCallback(
    (sceneId: ScenePresetId) => {
      const newClip = createScenePresetClip(
        sceneId,
        currentFrame,
        0,
        activeProject.appleDarkMode,
        activeProject.accentColor
      );

      mutateActiveProject((proj) => {
        const neededEnd = newClip.from + newClip.durationInFrames;
        const nextDuration = Math.max(proj.durationInFrames, neededEnd);
        const shifted = proj.clips.map((c) => ({ ...c, trackRow: c.trackRow + 1 }));
        return {
          ...proj,
          durationInFrames: nextDuration,
          clips: normalizeTrackRows([newClip, ...shifted]),
        };
      }, true);

      setSelectedClipId(newClip.id);
      showNotice(`Adegan "${newClip.name}" disisipkan di ${currentFrame}f`);
    },
    [
      activeProject.accentColor,
      activeProject.appleDarkMode,
      currentFrame,
      mutateActiveProject,
      showNotice,
    ]
  );

  const handleUpdateClip = useCallback(
    (
      clipId: string,
      updater: (clip: TimelineClip) => TimelineClip,
      commitHistory = true
    ) => {
      mutateActiveProject(
        (proj) => ({
          ...proj,
          clips: proj.clips.map((c) => (c.id === clipId ? updater(c) : c)),
        }),
        commitHistory
      );
    },
    [mutateActiveProject]
  );

  const handleCanvasDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!selectedClip || selectedClip.locked) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setCanvasDrag({
        clipId: selectedClip.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origPosX: selectedClip.style.posX,
        origPosY: selectedClip.style.posY,
        currPosX: selectedClip.style.posX,
        currPosY: selectedClip.style.posY,
        snappedX: selectedClip.style.posX === 50,
        snappedY: selectedClip.style.posY === 50,
      });
    },
    [selectedClip]
  );

  const handleCanvasDragMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasDrag) return;
      const dxPct = ((e.clientX - canvasDrag.startClientX) / Math.max(100, stageSize.width)) * 100;
      const dyPct = ((e.clientY - canvasDrag.startClientY) / Math.max(100, stageSize.height)) * 100;
      const rawX = Math.max(5, Math.min(95, canvasDrag.origPosX + dxPct));
      const rawY = Math.max(5, Math.min(95, canvasDrag.origPosY + dyPct));
      const snappedX = Math.abs(rawX - 50) <= 1.5;
      const snappedY = Math.abs(rawY - 50) <= 1.5;
      const nextX = snappedX ? 50 : Math.round(rawX);
      const nextY = snappedY ? 50 : Math.round(rawY);

      setCanvasDrag((prev) =>
        prev
          ? {
              ...prev,
              currPosX: nextX,
              currPosY: nextY,
              snappedX,
              snappedY,
            }
          : null
      );

      handleUpdateClip(
        canvasDrag.clipId,
        (clip) => ({
          ...clip,
          style: { ...clip.style, posX: nextX, posY: nextY },
        }),
        false
      );
    },
    [canvasDrag, handleUpdateClip, stageSize.height, stageSize.width]
  );

  const handleCanvasDragEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasDrag) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const moved =
        canvasDrag.currPosX !== canvasDrag.origPosX ||
        canvasDrag.currPosY !== canvasDrag.origPosY;
      if (moved) {
        handleUpdateClip(
          canvasDrag.clipId,
          (clip) => ({
            ...clip,
            style: {
              ...clip.style,
              posX: canvasDrag.currPosX,
              posY: canvasDrag.currPosY,
            },
          }),
          true
        );
      } else {
        dragPreSnapshotRef.current = null;
      }
      setCanvasDrag(null);
    },
    [canvasDrag, handleUpdateClip]
  );

  const handleApplyStyleToAllClips = useCallback(
    (sourceClip: TimelineClip) => {
      mutateActiveProject(
        (proj) => ({
          ...proj,
          appleDarkMode: sourceClip.style.appleDarkMode,
          accentColor: sourceClip.style.accentColor,
          clips: proj.clips.map((c) => ({
            ...c,
            style: { ...sourceClip.style },
          })),
        }),
        true
      );
      showNotice('Style & tema diterapkan ke semua layer');
    },
    [mutateActiveProject, showNotice]
  );

  const handleChangeDuration = useCallback(
    (nextFramesRaw: number) => {
      const nextFrames = Math.max(
        60,
        Math.min(5400, Math.round(nextFramesRaw))
      );
      mutateActiveProject(
        (proj) => ({ ...proj, durationInFrames: nextFrames }),
        true
      );
      if (currentFrame >= nextFrames) {
        handleSeek(nextFrames - 1);
      }
      showNotice(
        `Panjang timeline: ${nextFrames}f (${(nextFrames / 30).toFixed(1)} dtk)`
      );
    },
    [currentFrame, handleSeek, mutateActiveProject, showNotice]
  );

  const handleFitDurationToClips = useCallback(() => {
    const maxEnd = activeProject.clips.reduce(
      (max, c) => Math.max(max, c.from + c.durationInFrames),
      60
    );
    const snapped = Math.max(60, Math.min(5400, Math.ceil(maxEnd / 10) * 10));
    mutateActiveProject(
      (proj) => ({ ...proj, durationInFrames: snapped }),
      true
    );
    if (currentFrame >= snapped) {
      handleSeek(snapped - 1);
    }
    showNotice(`Durasi disesuaikan ke ${snapped} frame`);
  }, [activeProject.clips, currentFrame, handleSeek, mutateActiveProject, showNotice]);

  const handleToggleAudio = useCallback(() => {
    const currentlyActive =
      activeProject.audioEnabled && activeProject.audioVolume > 0;
    const nextEnabled = !currentlyActive;
    mutateActiveProject(
      (proj) => ({
        ...proj,
        audioEnabled: nextEnabled,
        audioVolume:
          nextEnabled && proj.audioVolume <= 0 ? 1 : proj.audioVolume,
      }),
      true
    );
    showNotice(
      nextEnabled ? 'Audio Narasi dinyalakan' : 'Audio Narasi dimatikan'
    );
  }, [activeProject.audioEnabled, activeProject.audioVolume, mutateActiveProject, showNotice]);

  const handleToggleSoundFx = useCallback(() => {
    const currentlyActive =
      (activeProject.soundFxEnabled ?? activeProject.soundFxVolume > 0) &&
      activeProject.soundFxVolume > 0;
    const nextEnabled = !currentlyActive;
    mutateActiveProject(
      (proj) => ({
        ...proj,
        soundFxEnabled: nextEnabled,
        soundFxVolume:
          nextEnabled && proj.soundFxVolume <= 0 ? 0.75 : proj.soundFxVolume,
      }),
      true
    );
    showNotice(nextEnabled ? 'Sound FX dinyalakan' : 'Sound FX dimatikan');
  }, [
    activeProject.soundFxEnabled,
    activeProject.soundFxVolume,
    mutateActiveProject,
    showNotice,
  ]);

  const handleResetDefaults = useCallback(() => {
    const isSse = activeProject.compositionId === 'SseProtocolExplainer';
    const fresh = isSse ? createDefaultSseProject() : createDefaultMqttProject();
    mutateActiveProject(
      (proj) => ({
        ...proj,
        durationInFrames: fresh.durationInFrames,
        audioEnabled: true,
        audioVolume: fresh.audioVolume,
        audioSrc: fresh.audioSrc,
        audioLabel: fresh.audioLabel,
        audioDurationFrames: fresh.audioDurationFrames,
        soundFxEnabled: true,
        soundFxVolume: fresh.soundFxVolume,
        appleDarkMode: fresh.appleDarkMode,
        accentColor: fresh.accentColor,
        clips: fresh.clips,
      }),
      true
    );
    setSelectedClipId(fresh.clips[0]?.id ?? null);
    handleSeek(0);
    showNotice(
      isSse
        ? 'Template Protokol SSE direset ke default'
        : 'Template MQTT & WebSocket direset ke default'
    );
  }, [activeProject.compositionId, handleSeek, mutateActiveProject, showNotice]);

  // Studio Keyboard Shortcuts
  useEffect(() => {
    if (activeView !== 'studio') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if (isInput) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (mod && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        (mod && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(currentFrame + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(currentFrame - 1);
      } else if (e.key.toLowerCase() === 's' && !mod) {
        const targetClip =
          selectedClip &&
          !selectedClip.locked &&
          currentFrame > selectedClip.from + 4 &&
          currentFrame < selectedClip.from + selectedClip.durationInFrames - 4
            ? selectedClip
            : activeProject.clips.find(
                (c) =>
                  !c.locked &&
                  currentFrame > c.from + 4 &&
                  currentFrame < c.from + c.durationInFrames - 4
              );
        if (targetClip) {
          e.preventDefault();
          handleSplitClip(targetClip.id, currentFrame);
        }
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedClip &&
        !selectedClip.locked
      ) {
        e.preventDefault();
        handleDeleteClip(selectedClip.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeProject.clips,
    activeView,
    currentFrame,
    handleDeleteClip,
    handleRedo,
    handleSeek,
    handleSplitClip,
    handleTogglePlay,
    handleUndo,
    selectedClip,
  ]);

  const handleDownloadActiveTsx = () => {
    const code = generateCompositionTsx(activeComp, activeProps);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeComp.id}Composition.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSoundFx = useCallback(async () => {
    if (sfxDownloading) return;
    setSfxDownloading(true);
    const preset =
      activeProject.compositionId === 'SseProtocolExplainer' ? 'sse' : 'mqtt';
    try {
      await downloadSoundFxWav(
        Math.max(10, Math.round(durationInFrames / fps)),
        `${activeComp.id.toLowerCase()}-sound-fx.wav`,
        preset
      );
    } finally {
      setSfxDownloading(false);
    }
  }, [
    activeComp.id,
    activeProject.compositionId,
    durationInFrames,
    fps,
    sfxDownloading,
  ]);

  const activeCompositionMeta = useMemo(
    () => ({
      ...activeComp,
      title: activeProject.title,
      description: activeProject.description,
    }),
    [activeComp, activeProject.description, activeProject.title]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Hidden JSON File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.kinetik.json,application/json"
        onChange={handleImportJsonFile}
        className="hidden"
      />

      {/* Top Bar Contract: 3 Zones */}
      <header className="h-14 px-6 border-b border-white/10 bg-[#0F141F] flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveView('studio')}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display hover:text-blue-400 transition-colors"
        >
          Kinetik Studio
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => setActiveView('studio')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'studio'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Studio Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveView('gallery')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'gallery'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua Komposisi ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('export')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'export'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ekspor Proyek
          </button>
        </nav>

        {/* Zone 3: Direct Exports (Sound FX, Alpha Video-Only, TSX) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSoundFx}
            disabled={sfxDownloading}
            title="Unduh trek Sound FX (.wav) terpisah"
            className="px-3 py-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {sfxDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>Unduh Sound FX</span>
          </button>

          <button
            type="button"
            onClick={() => setAlphaModalOpen(true)}
            title="Render & unduh video Alpha transparan (video saja, tanpa audio)"
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Unduh Alpha (Video Only)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadActiveTsx}
            className="px-3 py-2 rounded-md border border-white/15 bg-[#111827] hover:bg-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TSX</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeView === 'gallery' && (
        <GalleryView
          projects={projects}
          activeProjectId={activeProject.id}
          onSelectProject={handleSelectProject}
          onCreateBlankProject={handleCreateBlankProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onExportProjectJson={(proj) => {
            exportProjectAsJson(proj);
            showNotice(`Proyek "${proj.title}" diekspor ke JSON`);
          }}
          onTriggerImportJson={() => fileInputRef.current?.click()}
        />
      )}

      {activeView === 'export' && (
        <ExportView
          composition={activeCompositionMeta}
          props={activeProps}
          aspect={activeAspect}
          fps={fps}
          durationInFrames={durationInFrames}
          onOpenAlphaExport={() => setAlphaModalOpen(true)}
          onDownloadSoundFx={handleDownloadSoundFx}
          sfxDownloading={sfxDownloading}
        />
      )}

      {activeView === 'studio' && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar: Projects, JSON Portability & Canvas Settings */}
          <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0F141F] flex flex-col justify-between overflow-y-auto">
            <div className="p-4 flex flex-col gap-5">
              {/* Projects Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Komposisi</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateBlankProject}
                    title="Buat komposisi baru"
                    className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-[11px] font-semibold text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <FilePlus2 className="w-3 h-3" />
                    <span>Baru</span>
                  </button>
                </div>

                {/* Portability Actions (Duplicate / Export JSON / Import JSON) */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateProject(activeProject.id)}
                    title="Duplikat komposisi aktif"
                    className="px-2 py-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplikat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportProjectAsJson(activeProject);
                      showNotice(`"${activeProject.title}" diekspor (.kinetik.json)`);
                    }}
                    title="Ekspor proyek ke file .kinetik.json"
                    className="px-2 py-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Impor proyek dari file .kinetik.json"
                    className="px-2 py-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-[11px] text-slate-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Impor</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-0.5">
                  {projects.map((proj) => {
                    const isActive = proj.id === activeProject.id;
                    return (
                      <div
                        key={proj.id}
                        className={`group rounded-md border transition-colors flex items-center justify-between gap-1 ${
                          isActive
                            ? 'bg-blue-600/12 border-blue-500/50 text-white'
                            : 'bg-transparent border-transparent hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectProject(proj.id)}
                          className="flex-1 min-w-0 text-left px-2.5 py-2 flex flex-col gap-0.5"
                        >
                          <div className="text-xs font-semibold truncate">
                            {proj.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-1.5 truncate">
                            <span>{proj.aspectId}</span>
                            <span aria-hidden="true">·</span>
                            <span>{proj.clips.length} layer</span>
                            <span aria-hidden="true">·</span>
                            <span>{proj.durationInFrames}f</span>
                          </div>
                        </button>

                        {projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="Hapus komposisi"
                            aria-label={`Hapus ${proj.title}`}
                            className="mr-1.5 p-1 rounded text-slate-500 hover:text-red-300 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio Switcher: Lanskap 16:9 & Vertikal 9:16 */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-slate-300 px-1">
                  Rasio Kanvas
                </span>
                <div className="flex flex-col gap-1">
                  {(Object.keys(ASPECT_PRESETS) as AspectPresetId[]).map(
                    (key) => {
                      const preset = ASPECT_PRESETS[key];
                      const selected = activeProject.aspectId === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            mutateActiveProject(
                              (proj) => ({ ...proj, aspectId: key }),
                              true
                            )
                          }
                          className={`px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                            selected
                              ? 'bg-white/10 text-white font-medium'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span className="font-mono text-[11px] tabular-nums text-slate-400">
                            {preset.width}×{preset.height}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Locked Export Specs: 30 fps & Alpha Only */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-slate-300 px-1">
                  Standar Ekspor (Terkunci)
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="px-3 py-2 rounded-md bg-[#0B0F17] border border-white/10 text-xs flex items-center justify-between text-slate-200">
                    <span>Frame Rate</span>
                    <span className="font-mono text-[11px] tabular-nums text-blue-300 font-semibold">
                      30 fps
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-md bg-[#0B0F17] border border-white/10 text-xs flex items-center justify-between text-slate-200">
                    <span>Mode Ekspor</span>
                    <span className="font-mono text-[11px] text-emerald-300 font-semibold">
                      Alpha Only
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Reference */}
            <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 flex flex-col gap-1.5">
              <div className="font-medium text-slate-300">Pintasan Editor</div>
              <div className="flex justify-between">
                <span>Putar / Jeda</span>
                <span className="font-mono text-slate-300">Spasi</span>
              </div>
              <div className="flex justify-between">
                <span>Split Klip</span>
                <span className="font-mono text-slate-300">S</span>
              </div>
              <div className="flex justify-between">
                <span>Undo / Redo</span>
                <span className="font-mono text-slate-300">⌘Z / ⌘⇧Z</span>
              </div>
              <div className="flex justify-between">
                <span>Geser 1 Frame</span>
                <span className="font-mono text-slate-300">← / →</span>
              </div>
            </div>
          </aside>

          {/* Center Stage: Viewport + Timeline */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#0B0F17] relative">
            {/* Workspace Breadcrumb Strip */}
            <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <Film className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Komposisi</span>
                <span aria-hidden="true">/</span>
                <span className="text-slate-100 font-medium truncate">
                  {activeProject.title}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Canvas Interaction Mode: Click Play vs Drag Position */}
                <div className="flex items-center gap-1 bg-[#0F141F] p-0.5 rounded-md border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCanvasMode('play')}
                    title="Klik kanvas untuk Putar / Jeda (pegangan tengah tetap bisa digeser)"
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors whitespace-nowrap shrink-0 ${
                      canvasMode === 'play'
                        ? 'bg-white/12 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Klik Putar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasMode('move')}
                    title="Seret langsung di kanvas untuk memindah posisi klip terpilih"
                    className={`px-2 py-0.5 text-[11px] rounded flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      canvasMode === 'move'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Move className="w-3 h-3" />
                    <span>Geser Layer</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-[#0F141F] p-0.5 rounded-md border border-white/10">
                  {(
                    [
                      { id: 'checker', label: 'Alpha' },
                      { id: 'gradient', label: 'Simulasi' },
                      { id: 'dark', label: 'Gelap' },
                      { id: 'light', label: 'Terang' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPreviewBackdrop(mode.id)}
                      className={`px-2 py-0.5 text-[11px] rounded transition-colors whitespace-nowrap shrink-0 ${
                        previewBackdrop === mode.id
                          ? 'bg-white/12 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
                  <span>
                    {activeAspect.width}×{activeAspect.height}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{fps} fps</span>
                  <span aria-hidden="true">·</span>
                  <span>{(durationInFrames / fps).toFixed(1)} dtk</span>
                </div>
              </div>
            </div>

            {/* Remotion Player Viewport */}
            <div
              ref={stageRef}
              className="flex-1 min-h-0 p-5 flex items-center justify-center overflow-hidden relative"
            >
              {notice && (
                <div
                  role="status"
                  className={`absolute top-3 right-4 z-30 px-3 py-1.5 rounded-md border text-xs font-medium shadow-lg ${
                    notice.type === 'error'
                      ? 'bg-red-950/90 border-red-500/50 text-red-200'
                      : 'bg-[#111827]/95 border-blue-500/40 text-slate-100'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              <div
                style={{
                  width: stageSize.width,
                  height: stageSize.height,
                  ...(previewBackdrop === 'checker'
                    ? {
                        backgroundImage:
                          'linear-gradient(45deg, #1E293B 25%, transparent 25%), linear-gradient(-45deg, #1E293B 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1E293B 75%), linear-gradient(-45deg, transparent 75%, #1E293B 75%)',
                        backgroundSize: '24px 24px',
                        backgroundPosition:
                          '0 0, 0 12px, 12px -12px, -12px 0px',
                        backgroundColor: '#0F172A',
                      }
                    : previewBackdrop === 'gradient'
                      ? {
                          background:
                            'linear-gradient(135deg, #0F172A 0%, #1D4ED8 52%, #0F766E 100%)',
                        }
                      : previewBackdrop === 'light'
                        ? { backgroundColor: '#E2E8F0' }
                        : { backgroundColor: '#020617' }),
                }}
                className="relative rounded-lg overflow-hidden border border-white/15 shadow-2xl flex items-center justify-center shrink-0"
              >
                <Player
                  ref={playerRef}
                  component={activeComp.component}
                  inputProps={activeProps}
                  durationInFrames={durationInFrames}
                  fps={fps}
                  compositionWidth={activeAspect.width}
                  compositionHeight={activeAspect.height}
                  loop={loop}
                  playbackRate={playbackRate}
                  clickToPlay={canvasMode === 'play'}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                  }}
                />

                {/* Full-Stage Drag Overlay in Move Mode */}
                {canvasMode === 'move' && selectedClip && !selectedClip.locked && (
                  <div
                    onPointerDown={handleCanvasDragStart}
                    onPointerMove={handleCanvasDragMove}
                    onPointerUp={handleCanvasDragEnd}
                    onPointerCancel={handleCanvasDragEnd}
                    title={`Seret untuk menggeser "${selectedClip.name}"`}
                    className="absolute inset-0 z-10 cursor-move"
                  />
                )}

                {/* Center Snap Alignment Guides while Dragging */}
                {canvasDrag?.snappedX && (
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-400/80 pointer-events-none z-20" />
                )}
                {canvasDrag?.snappedY && (
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-amber-400/80 pointer-events-none z-20" />
                )}

                {/* Direct Position Reticle Handle on Selected Active Clip */}
                {selectedClip &&
                  selectedClip.visible &&
                  !selectedClip.locked &&
                  (canvasMode === 'move' ||
                    (currentFrame >= selectedClip.from &&
                      currentFrame <
                        selectedClip.from + selectedClip.durationInFrames)) && (
                    <div
                      onPointerDown={handleCanvasDragStart}
                      onPointerMove={handleCanvasDragMove}
                      onPointerUp={handleCanvasDragEnd}
                      onPointerCancel={handleCanvasDragEnd}
                      style={{
                        left: `${selectedClip.style.posX}%`,
                        top: `${selectedClip.style.posY}%`,
                      }}
                      title={`Geser posisi "${selectedClip.name}" (${selectedClip.style.posX}%, ${selectedClip.style.posY}%)`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full border flex items-center justify-center cursor-move transition-colors ${
                        canvasDrag
                          ? 'bg-blue-600/80 border-white text-white scale-110'
                          : 'bg-[#0F141F]/65 border-blue-400/75 text-blue-200 hover:bg-blue-600/70 hover:text-white'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5 pointer-events-none" />
                    </div>
                  )}

                {/* Live Position HUD while Dragging */}
                {canvasDrag && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 rounded bg-[#0F141F]/95 border border-blue-500/50 font-mono text-[11px] tabular-nums text-white pointer-events-none shadow-lg">
                    X {canvasDrag.currPosX}% · Y {canvasDrag.currPosY}%
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Track NLE Timeline & Transport */}
            <StudioTimeline
              playerRef={playerRef}
              compositionId={activeProject.compositionId}
              currentFrame={currentFrame}
              durationInFrames={durationInFrames}
              fps={fps}
              isPlaying={isPlaying}
              loop={loop}
              playbackRate={playbackRate}
              clips={activeProject.clips}
              selectedClipId={selectedClip?.id ?? null}
              audioEnabled={activeProject.audioEnabled}
              audioVolume={activeProject.audioVolume}
              audioLabel={activeProject.audioLabel}
              audioDurationFrames={activeProject.audioDurationFrames}
              beatCues={
                activeProject.compositionId === 'SseProtocolExplainer'
                  ? SSE_BEAT_CUES
                  : AUDIO_BEAT_CUES
              }
              soundFxEnabled={
                activeProject.soundFxEnabled ?? activeProject.soundFxVolume > 0
              }
              soundFxVolume={activeProject.soundFxVolume}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              onTogglePlay={handleTogglePlay}
              onToggleLoop={() => setLoop((v) => !v)}
              onChangePlaybackRate={setPlaybackRate}
              onSeek={handleSeek}
              onSelectClip={setSelectedClipId}
              onUpdateClipTiming={handleUpdateClipTiming}
              onSplitClip={handleSplitClip}
              onDuplicateClip={handleDuplicateClip}
              onDeleteClip={handleDeleteClip}
              onMoveTrack={handleMoveTrack}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onAddCustomLayer={handleAddCustomLayer}
              onAddScenePreset={handleAddScenePreset}
              onToggleAudio={handleToggleAudio}
              onToggleSoundFx={handleToggleSoundFx}
              onChangeDuration={handleChangeDuration}
              onFitDurationToClips={handleFitDurationToClips}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </main>

          {/* Right Inspector Panel */}
          <PropertiesPanel
            project={activeProject}
            composition={activeCompositionMeta}
            props={activeProps}
            aspect={activeAspect}
            selectedClip={selectedClip}
            onSelectClip={setSelectedClipId}
            onUpdateClip={handleUpdateClip}
            onApplyStyleToAllClips={handleApplyStyleToAllClips}
            onUpdateProject={mutateActiveProject}
            onFitDurationToClips={handleFitDurationToClips}
            onResetDefaults={handleResetDefaults}
            onOpenAlphaExport={() => setAlphaModalOpen(true)}
            onDownloadSoundFx={handleDownloadSoundFx}
            sfxDownloading={sfxDownloading}
          />
        </div>
      )}

      <AlphaExportModal
        isOpen={alphaModalOpen}
        onClose={() => setAlphaModalOpen(false)}
        composition={activeCompositionMeta}
        props={activeProps}
        aspect={activeAspect}
        fps={fps}
        durationInFrames={durationInFrames}
      />
    </div>
  );
}

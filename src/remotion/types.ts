import type React from 'react';

export type CompositionId = 'MqttWebSocketExplainer' | 'SseProtocolExplainer';

export type AspectPresetId = '16:9' | '9:16';

export interface AspectPreset {
  id: AspectPresetId;
  label: string;
  width: number;
  height: number;
}

export const ASPECT_PRESETS: Record<AspectPresetId, AspectPreset> = {
  '16:9': { id: '16:9', label: 'Lanskap 16:9', width: 1920, height: 1080 },
  '9:16': { id: '9:16', label: 'Vertikal 9:16', width: 1080, height: 1920 },
};

export interface DataMetricItem {
  label: string;
  value: number;
  unit: string;
}

export type ScenePresetId =
  | 'scene-1-intro'
  | 'scene-2-mqtt'
  | 'scene-3-ws'
  | 'scene-3b-websocket'
  | 'scene-4-flow'
  | 'scene-5-browser'
  | 'scene-6-outro'
  | 'sse-0-intro'
  | 'sse-1-upload'
  | 'sse-2-axios-xhr'
  | 'sse-3-question'
  | 'sse-4a-intro'
  | 'sse-4-protocol'
  | 'sse-5-vs-ws'
  | 'sse-6a-intro'
  | 'sse-6-one-way'
  | 'sse-7-backend-outro';

export type CustomLayerType =
  | 'glass-card'
  | 'kinetic-text'
  | 'terminal'
  | 'badge-node';

export type ClipIconId =
  | 'mqtt'
  | 'websocket'
  | 'nodejs'
  | 'react'
  | 'hardware'
  | 'sensor';

export type EnterAnimationPreset =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'pop-spring'
  | 'blur-in';

export type ExitAnimationPreset =
  | 'none'
  | 'fade'
  | 'slide-down'
  | 'scale-down';

export type ClipFontFamily =
  | 'Plus Jakarta Sans'
  | 'DM Sans'
  | 'JetBrains Mono';

export interface ClipAnimationConfig {
  enterPreset: EnterAnimationPreset;
  exitPreset: ExitAnimationPreset;
  enterFrames: number;
  exitFrames: number;
  springDamping: number;
  springStiffness: number;
  resetOnTrim: boolean;
}

export interface ClipStyleConfig {
  appleDarkMode: boolean;
  glassOpacity: number;
  blurPx: number;
  borderRadius: number;
  borderOpacity: number;
  accentColor: string;
  textColor: string;
  fontFamily: ClipFontFamily;
  fontSize: number;
  fontWeight: number;
  paddingX: number;
  paddingY: number;
  posX: number;
  posY: number;
  maxWidth: number;
  opacity: number;
  scale: number;
  rotationDeg: number;
}

export interface ClipContentConfig {
  text: string;
  subtext: string;
  highlightWord: string;
  badgeLabel: string;
  iconId: ClipIconId;
}

export interface TimelineClip {
  id: string;
  name: string;
  kind: 'scene-preset' | 'custom-layer';
  scenePresetId?: ScenePresetId;
  customLayerType?: CustomLayerType;
  trackRow: number;
  from: number;
  durationInFrames: number;
  sourceStartOffset: number;
  visible: boolean;
  locked: boolean;
  layerType: 'background' | 'typography' | 'media' | 'accent';
  content: ClipContentConfig;
  animation: ClipAnimationConfig;
  style: ClipStyleConfig;
}

export interface StudioProject {
  id: string;
  compositionId?: CompositionId;
  title: string;
  description: string;
  isDefaultTemplate?: boolean;
  createdAt: number;
  updatedAt: number;
  aspectId: AspectPresetId;
  fps: 30;
  durationInFrames: number;
  audioEnabled: boolean;
  audioVolume: number;
  audioSrc?: string;
  audioLabel?: string;
  audioDurationFrames?: number;
  soundFxEnabled?: boolean;
  soundFxVolume: number;
  appleDarkMode: boolean;
  accentColor: string;
  clips: TimelineClip[];
}

export interface StudioCompositionProps {
  kicker: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  accentColor: string;
  backgroundColor: string;
  springDamping: number;
  springStiffness: number;
  highlightWord: string;
  appleDarkMode: boolean;
  transparentBackground: boolean;
  audioVolume: number;
  audioSrc?: string;
  soundFxVolume: number;
  audioEnabled?: boolean;
  clips?: TimelineClip[];
  metrics: DataMetricItem[];
}

export interface TimelineTrackItem {
  id: string;
  name: string;
  from: number;
  durationInFrames: number;
  layerType: 'background' | 'typography' | 'media' | 'accent';
}

export interface CompositionDefinition {
  id: CompositionId;
  title: string;
  category: string;
  description: string;
  defaultDurationInFrames: number;
  defaultFps: number;
  defaultAspect: AspectPresetId;
  component: React.FC<StudioCompositionProps>;
  defaultProps: StudioCompositionProps;
  tracks: TimelineTrackItem[];
}

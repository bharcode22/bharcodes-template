import type {
  AspectPresetId,
  ClipStyleConfig,
  CompositionId,
  CustomLayerType,
  ScenePresetId,
  StudioCompositionProps,
  StudioProject,
  TimelineClip,
} from '../remotion/types';

export const STORAGE_KEY = 'kinetik_studio_projects_v2';
export const SSE_SEED_FLAG = 'kinetik_seeded_sse_v1';
export const SSE_INTRO_MIGRATE_FLAG = 'kinetik_sse_intro_words_v1';
export const SSE_INTRO_TIMING_V2_FLAG = 'kinetik_sse_intro_timing_v2';
export const SSE_SCENE4_CLEAN_FLAG = 'kinetik_sse_scene4_clean_v1';
export const SSE_SCENE4_SPLIT_V1_FLAG = 'kinetik_sse_scene4_split_v1';
export const SSE_V4_REFINE_FLAG = 'kinetik_sse_v4_refine_v1';
export const SSE_SCENE2_IMPROVE_V1_FLAG = 'kinetik_sse_scene2_improve_v1';
export const SSE_SCENE6_SPLIT_V1_FLAG = 'kinetik_sse_scene6_split_v1';
export const UIUX_SEED_FLAG = 'kinetik_seeded_uiux_v1';

// Cue frames (30fps timebase) used for timeline audio/beat snap markers
export const AUDIO_BEAT_CUES = [
  0, 15, 24, 36, 43, 48, 57, 90, 130, 224, 333, 400, 452, 504, 598, 830,
];

export const SSE_BEAT_CUES = [
  0, 12, 30, 39, 40, 51, 76, 84, 172, 182, 236, 276, 286, 326, 442, 480, 536, 584, 626, 750, 825, 895, 935, 990, 1038, 1098, 1184, 1238, 1284, 1348, 1392,
];

export const UIUX_BEAT_CUES = [
  0, 60, 120, 180, 204, 250, 280, 360, 444, 520, 594, 700, 800, 910, 1000, 1100, 1194, 1300, 1400, 1524, 1620, 1720, 1824, 1920, 2018,
];

export function makeUid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36).slice(-4)}`;
}

export function createDefaultStyle(
  appleDarkMode = true,
  accentColor = '#0071E3',
  overrides?: Partial<ClipStyleConfig>
): ClipStyleConfig {
  return {
    appleDarkMode,
    glassOpacity: appleDarkMode ? 0.52 : 0.56,
    blurPx: 40,
    borderRadius: 30,
    borderOpacity: appleDarkMode ? 0.24 : 0.78,
    accentColor,
    textColor: appleDarkMode ? '#F5F5F7' : '#1D1D1F',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 54,
    fontWeight: 700,
    paddingX: 48,
    paddingY: 32,
    posX: 50,
    posY: 50,
    maxWidth: 960,
    opacity: 1,
    scale: 1,
    rotationDeg: 0,
    ...overrides,
  };
}

export function createDefaultMqttClips(
  appleDarkMode = true,
  accentColor = '#0071E3'
): TimelineClip[] {
  const baseAnim = {
    enterPreset: 'none' as const,
    exitPreset: 'none' as const,
    enterFrames: 12,
    exitFrames: 14,
    springDamping: 14,
    springStiffness: 130,
    resetOnTrim: false,
  };

  return [
    {
      id: 'scene-1-intro',
      name: '01. Kartu Kanan → Kiri',
      kind: 'scene-preset',
      scenePresetId: 'scene-1-intro',
      trackRow: 0,
      from: 0,
      durationInFrames: 98,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'bagaimana cara menampilkan data secara realtime di frontend',
        subtext: '',
        highlightWord: 'realtime',
        badgeLabel: '',
        iconId: 'mqtt',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 58,
        borderRadius: 26,
      }),
    },
    {
      id: 'scene-2-mqtt',
      name: '02. Hardware → MQTT',
      kind: 'scene-preset',
      scenePresetId: 'scene-2-mqtt',
      trackRow: 1,
      from: 90,
      durationInFrames: 142,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'MQTT Broker',
        subtext: '',
        highlightWord: '',
        badgeLabel: '',
        iconId: 'mqtt',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        borderRadius: 34,
      }),
    },
    {
      id: 'scene-3-ws',
      name: '03. Terminal Apple',
      kind: 'scene-preset',
      scenePresetId: 'scene-3-ws',
      trackRow: 2,
      from: 224,
      durationInFrames: 120,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'nah sekarang bagaimana cara mengirimkan data itu ke frontend secara realtime',
        subtext: '~/stream on main',
        highlightWord: 'realtime',
        badgeLabel: 'Terminal — zsh',
        iconId: 'websocket',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontFamily: 'JetBrains Mono',
        fontSize: 48,
        glassOpacity: 0.26,
        blurPx: 38,
        borderRadius: 30,
      }),
    },
    {
      id: 'scene-3b-websocket',
      name: 'WebSocket',
      kind: 'scene-preset',
      scenePresetId: 'scene-3b-websocket',
      trackRow: 3,
      from: 333,
      durationInFrames: 75,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'WebSocket',
        subtext: 'ws://real-time',
        highlightWord: '',
        badgeLabel: '',
        iconId: 'websocket',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 68,
        borderRadius: 48,
      }),
    },
    {
      id: 'scene-4-flow',
      name: '04. MQTT → Node.js → React',
      kind: 'scene-preset',
      scenePresetId: 'scene-4-flow',
      trackRow: 4,
      from: 400,
      durationInFrames: 210,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'MQTT · Node.js Back-End · React Front-End',
        subtext: '',
        highlightWord: '',
        badgeLabel: '',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 32,
        borderRadius: 42,
      }),
    },
    {
      id: 'scene-5-browser',
      name: '05. Grid HB Counting',
      kind: 'scene-preset',
      scenePresetId: 'scene-5-browser',
      trackRow: 5,
      from: 598,
      durationInFrames: 244,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'media',
      content: {
        text: 'HB Counting',
        subtext: 'WS LIVE',
        highlightWord: '',
        badgeLabel: '',
        iconId: 'react',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontFamily: 'JetBrains Mono',
        fontSize: 44,
        borderRadius: 30,
      }),
    },
    {
      id: 'scene-6-outro',
      name: '06. JSON HB → UI',
      kind: 'scene-preset',
      scenePresetId: 'scene-6-outro',
      trackRow: 6,
      from: 830,
      durationInFrames: 190,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'background',
      content: {
        text: 'Front-End UI',
        subtext: 'WebSocket Push',
        highlightWord: '',
        badgeLabel: 'ESP32-01',
        iconId: 'mqtt',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        borderRadius: 28,
      }),
    },
  ];
}

export function createDefaultMqttProject(): StudioProject {
  const now = Date.now();
  return {
    id: 'project-mqtt-default',
    compositionId: 'MqttWebSocketExplainer',
    title: 'Naskah: MQTT & WebSocket',
    description:
      'Template Apple Glassmorphism lengkap dengan 7 adegan interaktif & audio narasi .flac.',
    isDefaultTemplate: true,
    createdAt: now,
    updatedAt: now,
    aspectId: '16:9',
    fps: 30,
    durationInFrames: 1020,
    audioEnabled: true,
    audioVolume: 1,
    audioSrc: '/assets/aistudio/web_socket_7fcd94b2.flac',
    audioLabel: 'Audio Narasi (.flac)',
    audioDurationFrames: 1010,
    soundFxEnabled: true,
    soundFxVolume: 0.75,
    appleDarkMode: true,
    accentColor: '#0071E3',
    clips: createDefaultMqttClips(true, '#0071E3'),
  };
}

export function createDefaultSseClips(
  appleDarkMode = true,
  accentColor = '#0071E3'
): TimelineClip[] {
  const baseAnim = {
    enterPreset: 'none' as const,
    exitPreset: 'none' as const,
    enterFrames: 12,
    exitFrames: 14,
    springDamping: 14,
    springStiffness: 130,
    resetOnTrim: false,
  };

  return [
    {
      id: 'sse-0-intro',
      name: '00. Teks Kata per Kata',
      kind: 'scene-preset',
      scenePresetId: 'sse-0-intro',
      trackRow: 0,
      from: 0,
      durationInFrames: 82,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'pernah gak ketika kamu upload file ke suatu sistem',
        subtext: '',
        highlightWord: 'upload',
        badgeLabel: '',
        iconId: 'react',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 58,
        borderRadius: 26,
      }),
    },
    {
      id: 'sse-1-upload',
      name: '01. Upload Progress Bar',
      kind: 'scene-preset',
      scenePresetId: 'sse-1-upload',
      trackRow: 1,
      from: 76,
      durationInFrames: 112,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'media',
      content: {
        text: 'Upload File ke Sistem',
        subtext: 'video-dataset.mp4 · 128 MB',
        highlightWord: 'progress',
        badgeLabel: 'UPLOAD PROGRESS',
        iconId: 'react',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 52,
        borderRadius: 30,
      }),
    },
    {
      id: 'sse-2-axios-xhr',
      name: '02. Axios & XMLHttpRequest',
      kind: 'scene-preset',
      scenePresetId: 'sse-2-axios-xhr',
      trackRow: 2,
      from: 182,
      durationInFrames: 152,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'Buat Fitur Upload Progress',
        subtext: 'onUploadProgress · xhr.upload.onprogress',
        highlightWord: 'Axios',
        badgeLabel: 'CLIENT-SIDE API',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 44,
        borderRadius: 28,
      }),
    },
    {
      id: 'sse-3-question',
      name: '03. Pertanyaan Realtime',
      kind: 'scene-preset',
      scenePresetId: 'sse-3-question',
      trackRow: 3,
      from: 326,
      durationInFrames: 159,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'bagaimana jika server mengirim data progress bar secara realtime ke client?',
        subtext: '~/upload-stream on main',
        highlightWord: 'realtime',
        badgeLabel: 'Terminal — zsh',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontFamily: 'JetBrains Mono',
        fontSize: 46,
        glassOpacity: 0.28,
        blurPx: 38,
        borderRadius: 30,
      }),
    },
    {
      id: 'sse-4a-intro',
      name: '04a. Perkenalan SSE',
      kind: 'scene-preset',
      scenePresetId: 'sse-4a-intro',
      trackRow: 4,
      from: 480,
      durationInFrames: 112,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'SSE',
        subtext: 'Server-Sent Events',
        highlightWord: 'SSE',
        badgeLabel: 'EVENT STREAM · HTTP',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 64,
        borderRadius: 34,
      }),
    },
    {
      id: 'sse-4-protocol',
      name: '04b. Protokol SSE (1 Arah)',
      kind: 'scene-preset',
      scenePresetId: 'sse-4-protocol',
      trackRow: 5,
      from: 584,
      durationInFrames: 174,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: '',
        subtext: '',
        highlightWord: '1 Arah',
        badgeLabel: '1 ARAH REALTIME',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 54,
        borderRadius: 34,
      }),
    },
    {
      id: 'sse-5-vs-ws',
      name: '05. WebSocket (2 Arah)',
      kind: 'scene-preset',
      scenePresetId: 'sse-5-vs-ws',
      trackRow: 6,
      from: 750,
      durationInFrames: 245,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'Kenapa Tidak Pakai WebSocket?',
        subtext: 'Server ⇄ Client (Komunikasi 2 Arah)',
        highlightWord: 'WebSocket',
        badgeLabel: 'FULL-DUPLEX · 2 ARAH',
        iconId: 'websocket',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 44,
        borderRadius: 30,
      }),
    },
    {
      id: 'sse-6a-intro',
      name: '06a. Cukup 1 Arah Saja',
      kind: 'scene-preset',
      scenePresetId: 'sse-6a-intro',
      trackRow: 7,
      from: 990,
      durationInFrames: 114,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'Komunikasi 1 Arah',
        subtext: 'Untuk fitur seperti ini, cukup 1 arah saja',
        highlightWord: '1 Arah',
        badgeLabel: 'SOLUSI EFISIEN · SSE',
        iconId: 'react',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 58,
        borderRadius: 32,
      }),
    },
    {
      id: 'sse-6-one-way',
      name: '06b. Server Kirim Progress',
      kind: 'scene-preset',
      scenePresetId: 'sse-6-one-way',
      trackRow: 8,
      from: 1098,
      durationInFrames: 92,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'media',
      content: {
        text: 'Server Kirim Progress ke Client',
        subtext: 'Server kirim progress bar ke Client',
        highlightWord: 'Progress',
        badgeLabel: 'SERVER PUSH',
        iconId: 'react',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 44,
        borderRadius: 30,
      }),
    },
    {
      id: 'sse-7-backend-outro',
      name: '07. Backend Kirim Bertahap',
      kind: 'scene-preset',
      scenePresetId: 'sse-7-backend-outro',
      trackRow: 9,
      from: 1184,
      durationInFrames: 271,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'background',
      content: {
        text: 'Bagaimana Implementasinya?',
        subtext: 'Silahkan prompt aja dulu',
        highlightWord: 'prompt',
        badgeLabel: 'IMPLEMENTASI SSE',
        iconId: 'nodejs',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 42,
        borderRadius: 28,
      }),
    },
  ];
}

export function createDefaultSseProject(): StudioProject {
  const now = Date.now();
  return {
    id: 'project-sse-default',
    compositionId: 'SseProtocolExplainer',
    title: 'Naskah: Protokol SSE',
    description:
      'Template Apple Glassmorphism 7 adegan tentang protokol Server-Sent Events (SSE), upload progress realtime, perbandingan WebSocket, & audio Sequence 01.',
    isDefaultTemplate: true,
    createdAt: now,
    updatedAt: now,
    aspectId: '16:9',
    fps: 30,
    durationInFrames: 1455,
    audioEnabled: true,
    audioVolume: 1,
    audioSrc: '/assets/aistudio/Sequence_01_71ffa7aa.mp3',
    audioLabel: 'Audio Narasi (.mp3)',
    audioDurationFrames: 1452,
    soundFxEnabled: true,
    soundFxVolume: 0.75,
    appleDarkMode: true,
    accentColor: '#0071E3',
    clips: createDefaultSseClips(true, '#0071E3'),
  };
}

export function createDefaultUiUxClips(
  appleDarkMode = true,
  accentColor = '#0071E3'
): TimelineClip[] {
  const baseAnim = {
    enterPreset: 'none' as const,
    exitPreset: 'none' as const,
    enterFrames: 12,
    exitFrames: 14,
    springDamping: 14,
    springStiffness: 130,
    resetOnTrim: false,
  };

  return [
    {
      id: 'uiux-0-hook',
      name: '00. Hook: Tebak Kepala Atasan',
      kind: 'scene-preset',
      scenePresetId: 'uiux-0-hook',
      trackRow: 0,
      from: 0,
      durationInFrames: 210,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'Menjadi software engineer di perusahaan yang tidak memiliki UI/UX itu ibarat kita menebak isi kepala atasan menggunakan kode',
        subtext: 'Software Engineer vs Isi Kepala Atasan',
        highlightWord: 'UI/UX',
        badgeLabel: 'REALITY CHECK',
        iconId: 'code',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 48,
        borderRadius: 36,
      }),
    },
    {
      id: 'uiux-1-prompting',
      name: '01. Walaupun Nge-prompt Aja',
      kind: 'scene-preset',
      scenePresetId: 'uiux-1-prompting',
      trackRow: 1,
      from: 204,
      durationInFrames: 85,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'Yaa walaupun aku nge-prompt aja sih',
        subtext: 'Prompting tetap butuh panduan UX yang jelas',
        highlightWord: 'nge-prompt',
        badgeLabel: 'AI PROMPT',
        iconId: 'sparkles',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#AF52DE', {
        fontSize: 44,
        borderRadius: 32,
      }),
    },
    {
      id: 'uiux-2-request',
      name: '02. Request Upload via AI',
      kind: 'scene-preset',
      scenePresetId: 'uiux-2-request',
      trackRow: 2,
      from: 280,
      durationInFrames: 170,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'media',
      content: {
        text: 'Diminta membuat fitur upload file multimedia dengan AI agent',
        subtext: 'Video, Audio & Image multi-modal handling',
        highlightWord: 'AI agent',
        badgeLabel: 'NEW REQUIREMENT',
        iconId: 'brain',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 42,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-3-webapp',
      name: '03. Fitur Sudah Ada di Web App',
      kind: 'scene-preset',
      scenePresetId: 'uiux-3-webapp',
      trackRow: 3,
      from: 444,
      durationInFrames: 156,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'media',
      content: {
        text: 'Sebelumnya sudah membuat fitur upload multimedia di dalam web app',
        subtext: 'Status: 100% Upload Berfungsi',
        highlightWord: 'web app',
        badgeLabel: 'ALREADY BUILT',
        iconId: 'code',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#34C759', {
        fontSize: 42,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-4-conflict',
      name: '04. Experience Kurang Sesuai',
      kind: 'scene-preset',
      scenePresetId: 'uiux-4-conflict',
      trackRow: 4,
      from: 594,
      durationInFrames: 321,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'Experience web app kurang sesuai dengan apa yang diinginkan oleh atasan',
        subtext: 'Ekspektasi rasa dan interaksi berbeda',
        highlightWord: 'experience',
        badgeLabel: 'UX GAP',
        iconId: 'design',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#FF2D55', {
        fontSize: 40,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-5-improve',
      name: '05. Improve UX Dulu',
      kind: 'scene-preset',
      scenePresetId: 'uiux-5-improve',
      trackRow: 5,
      from: 910,
      durationInFrames: 290,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'accent',
      content: {
        text: 'Kita bisa improve experience web tersebut terlebih dahulu sebelum mengubah ke AI agent',
        subtext: 'Selesaikan masalah akar UX sebelum ganti arsitektur',
        highlightWord: 'improve',
        badgeLabel: 'BEST PRACTICE',
        iconId: 'design',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#34C759', {
        fontSize: 40,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-6-dilemma',
      name: '06. Dev UX ≠ Atasan UX',
      kind: 'scene-preset',
      scenePresetId: 'uiux-6-dilemma',
      trackRow: 6,
      from: 1194,
      durationInFrames: 336,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'Experience dari sisi developer belum tentu sesuai dengan yang diinginkan oleh atasan',
        subtext: 'Developer fokus pada fungsi teknis, atasan fokus pada flow & rasa',
        highlightWord: 'developer',
        badgeLabel: 'TWO WORLDS',
        iconId: 'brain',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#FF9500', {
        fontSize: 40,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-7-role',
      name: '07. Tiga Tugas Utama UI/UX',
      kind: 'scene-preset',
      scenePresetId: 'uiux-7-role',
      trackRow: 7,
      from: 1524,
      durationInFrames: 306,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'background',
      content: {
        text: 'Tugas UI/UX: membuat tampilan menarik serta menyusun flow experience yang bagus',
        subtext: 'Visual Menarik · User Flow Terstruktur · Experience Bagus',
        highlightWord: 'UI/UX',
        badgeLabel: 'ROLE ESSENTIALS',
        iconId: 'design',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, accentColor, {
        fontSize: 42,
        borderRadius: 34,
      }),
    },
    {
      id: 'uiux-8-bridge',
      name: '08. Jembatan Ide Sebelum Coding',
      kind: 'scene-preset',
      scenePresetId: 'uiux-8-bridge',
      trackRow: 8,
      from: 1824,
      durationInFrames: 196,
      sourceStartOffset: 0,
      visible: true,
      locked: false,
      layerType: 'typography',
      content: {
        text: 'UI/UX memungkinkan untuk menampung ide-ide atasan sebelum developer development',
        subtext: 'Jembatan visi bisnis & implementasi teknis',
        highlightWord: 'ide',
        badgeLabel: 'THE BRIDGE',
        iconId: 'sparkles',
      },
      animation: { ...baseAnim },
      style: createDefaultStyle(appleDarkMode, '#AF52DE', {
        fontSize: 42,
        borderRadius: 36,
      }),
    },
  ];
}

export function createDefaultUiUxProject(): StudioProject {
  const now = Date.now();
  return {
    id: 'project-uiux-default',
    compositionId: 'UiUxEngineerExplainer',
    title: 'Naskah: Pentingnya UI/UX',
    description:
      'Animasi Apple Glassmorphism tentang relasi Software Engineer, Atasan, & pentingnya peran UI/UX sebagai jembatan ide sebelum proses development.',
    isDefaultTemplate: true,
    createdAt: now,
    updatedAt: now,
    aspectId: '16:9',
    fps: 30,
    durationInFrames: 2020,
    audioEnabled: true,
    audioVolume: 1,
    audioSrc: '/assets/aistudio/ui_ux_engineer_voiceover.mp3',
    audioLabel: 'Audio Narasi UI/UX (.mp3)',
    audioDurationFrames: 2018,
    soundFxEnabled: true,
    soundFxVolume: 0.75,
    appleDarkMode: true,
    accentColor: '#0071E3',
    clips: createDefaultUiUxClips(true, '#0071E3'),
  };
}

export function createCustomLayerClip(
  layerType: CustomLayerType,
  from: number,
  trackRow: number,
  appleDarkMode = true,
  accentColor = '#0071E3'
): TimelineClip {
  const names: Record<CustomLayerType, string> = {
    'glass-card': 'Kartu Kaca Baru',
    'kinetic-text': 'Teks Kinetik',
    terminal: 'Terminal Kustom',
    'badge-node': 'Badge Node Ikon',
  };

  const defaultContent: Record<CustomLayerType, TimelineClip['content']> = {
    'glass-card': {
      text: 'Data Mengalir Real-Time',
      subtext: 'Tanpa refresh halaman melalui koneksi WebSocket aktif.',
      highlightWord: 'Real-Time',
      badgeLabel: 'LIVE',
      iconId: 'websocket',
    },
    'kinetic-text': {
      text: 'Koneksi Penuh Dua Arah',
      subtext: 'Latensi rendah · 30 fps Alpha',
      highlightWord: 'Dua Arah',
      badgeLabel: '',
      iconId: 'react',
    },
    terminal: {
      text: 'npm run stream -- --protocol=ws',
      subtext: '~/studio on main',
      highlightWord: 'ws',
      badgeLabel: 'Terminal — zsh',
      iconId: 'nodejs',
    },
    'badge-node': {
      text: 'MQTT Broker',
      subtext: 'ws://broker.local:8083',
      highlightWord: '',
      badgeLabel: 'ACTIVE',
      iconId: 'mqtt',
    },
  };

  return {
    id: makeUid('clip'),
    name: names[layerType],
    kind: 'custom-layer',
    customLayerType: layerType,
    trackRow,
    from: Math.max(0, Math.round(from)),
    durationInFrames: 90,
    sourceStartOffset: 0,
    visible: true,
    locked: false,
    layerType:
      layerType === 'kinetic-text'
        ? 'typography'
        : layerType === 'terminal'
          ? 'media'
          : 'accent',
    content: defaultContent[layerType],
    animation: {
      enterPreset: 'pop-spring',
      exitPreset: 'fade',
      enterFrames: 14,
      exitFrames: 12,
      springDamping: 14,
      springStiffness: 150,
      resetOnTrim: false,
    },
    style: createDefaultStyle(appleDarkMode, accentColor, {
      fontFamily: layerType === 'terminal' ? 'JetBrains Mono' : 'Plus Jakarta Sans',
      fontSize: layerType === 'kinetic-text' ? 68 : layerType === 'terminal' ? 40 : 48,
      glassOpacity: layerType === 'terminal' ? 0.34 : 0.52,
      borderRadius: layerType === 'badge-node' ? 24 : 30,
      maxWidth: layerType === 'badge-node' ? 560 : 960,
    }),
  };
}

export function createScenePresetClip(
  scenePresetId: ScenePresetId,
  from: number,
  trackRow: number,
  appleDarkMode = true,
  accentColor = '#0071E3'
): TimelineClip {
  const template = [
    ...createDefaultUiUxClips(appleDarkMode, accentColor),
    ...createDefaultMqttClips(appleDarkMode, accentColor),
    ...createDefaultSseClips(appleDarkMode, accentColor),
  ].find((c) => c.scenePresetId === scenePresetId);
  if (!template) {
    return createCustomLayerClip('glass-card', from, trackRow, appleDarkMode, accentColor);
  }
  return {
    ...template,
    id: makeUid('scene'),
    trackRow,
    from: Math.max(0, Math.round(from)),
    sourceStartOffset: 0,
  };
}

export function createBlankProject(
  title: string,
  aspectId: AspectPresetId = '16:9',
  compositionId: CompositionId = 'MqttWebSocketExplainer'
): StudioProject {
  const now = Date.now();
  const introClip = createCustomLayerClip('glass-card', 0, 0, true, '#0071E3');
  introClip.name = 'Judul Pembuka';
  introClip.durationInFrames = 120;
  introClip.content = {
    text: title || 'Komposisi Baru',
    subtext: 'Edit teks, animasi, dan style kartu kaca di panel kanan.',
    highlightWord: 'Baru',
    badgeLabel: 'INTRO',
    iconId: 'websocket',
  };

  return {
    id: makeUid('proj'),
    compositionId,
    title: title.trim() || 'Komposisi Baru',
    description: 'Komposisi kustom dengan layer bebas & ekspor Alpha 30 fps.',
    isDefaultTemplate: false,
    createdAt: now,
    updatedAt: now,
    aspectId,
    fps: 30,
    durationInFrames: 180,
    audioEnabled: false,
    audioVolume: 1,
    soundFxEnabled: true,
    soundFxVolume: 0.75,
    appleDarkMode: true,
    accentColor: '#0071E3',
    clips: [introClip],
  };
}

export function projectToCompositionProps(
  project: StudioProject
): StudioCompositionProps {
  const compId = project.compositionId ?? 'MqttWebSocketExplainer';
  const firstScene = project.clips.find(
    (c) =>
      c.scenePresetId === 'uiux-0-hook' ||
      c.scenePresetId === 'scene-1-intro' ||
      c.scenePresetId === 'sse-0-intro' ||
      c.scenePresetId === 'sse-1-upload'
  );
  const lastScene = project.clips.find(
    (c) =>
      c.scenePresetId === 'uiux-8-bridge' ||
      c.scenePresetId === 'scene-6-outro' ||
      c.scenePresetId === 'sse-7-backend-outro'
  );

  return {
    kicker: '',
    headline:
      firstScene?.content.text ||
      (compId === 'UiUxEngineerExplainer'
        ? 'Menjadi software engineer di suatu perusahaan yang tidak memiliki UI/UX...'
        : compId === 'SseProtocolExplainer'
          ? 'pernah gak ketika kamu upload file ke suatu sistem'
          : 'bagaimana cara menampilkan data secara realtime di frontend'),
    subtitle: project.description,
    ctaLabel: lastScene?.content.badgeLabel === 'ESP32-01' ? '' : '',
    accentColor: project.accentColor,
    backgroundColor: '#05070B',
    springDamping: 14,
    springStiffness: 130,
    highlightWord: 'realtime',
    appleDarkMode: project.appleDarkMode,
    transparentBackground: true,
    audioVolume: project.audioEnabled ? project.audioVolume : 0,
    audioSrc: project.audioSrc,
    soundFxVolume:
      (project.soundFxEnabled ?? project.soundFxVolume > 0)
        ? project.soundFxVolume
        : 0,
    audioEnabled: project.audioEnabled,
    clips: project.clips,
    metrics: [
      { label: 'Layer Aktif', value: project.clips.length, unit: ' klip' },
      { label: 'Frame Rate', value: 30, unit: ' fps' },
      {
        label: 'Durasi',
        value: Math.round(project.durationInFrames / 30),
        unit: ' dtk',
      },
      { label: 'Mode Ekspor', value: 100, unit: '% Alpha' },
    ],
  };
}

export function loadProjectsFromStorage(): StudioProject[] {
  const defaultSet = () => [
    createDefaultUiUxProject(),
    createDefaultSseProject(),
    createDefaultMqttProject(),
  ];
  if (typeof window === 'undefined') {
    return defaultSet();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(SSE_SEED_FLAG, '1');
      window.localStorage.setItem(UIUX_SEED_FLAG, '1');
      return defaultSet();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(SSE_SEED_FLAG, '1');
      window.localStorage.setItem(UIUX_SEED_FLAG, '1');
      return defaultSet();
    }
    const valid = parsed
      .filter(
        (item): item is StudioProject =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as StudioProject).id === 'string' &&
          Array.isArray((item as StudioProject).clips)
      )
      .map((proj) => {
        const compId: CompositionId =
          proj.compositionId ??
          (proj.clips.some((c) => c.scenePresetId?.startsWith('uiux-'))
            ? 'UiUxEngineerExplainer'
            : proj.clips.some((c) => c.scenePresetId?.startsWith('sse-'))
              ? 'SseProtocolExplainer'
              : 'MqttWebSocketExplainer');
        return {
          ...proj,
          compositionId: compId,
          audioSrc:
            proj.audioSrc ??
            (compId === 'UiUxEngineerExplainer'
              ? '/assets/aistudio/ui_ux_engineer_voiceover.mp3'
              : compId === 'SseProtocolExplainer'
                ? '/assets/aistudio/Sequence_01_71ffa7aa.mp3'
                : '/assets/aistudio/web_socket_7fcd94b2.flac'),
          audioLabel:
            proj.audioLabel ??
            (compId === 'UiUxEngineerExplainer'
              ? 'Audio Narasi UI/UX (.mp3)'
              : compId === 'SseProtocolExplainer'
                ? 'Audio Narasi (.mp3)'
                : 'Audio Narasi (.flac)'),
          audioDurationFrames:
            proj.audioDurationFrames ??
            (compId === 'UiUxEngineerExplainer'
              ? 2018
              : compId === 'SseProtocolExplainer'
                ? 1452
                : 1010),
          clips: proj.clips.map((clip) => ({
            ...clip,
            style: {
              ...createDefaultStyle(
                clip.style?.appleDarkMode ?? proj.appleDarkMode ?? true,
                clip.style?.accentColor ?? proj.accentColor ?? '#0071E3'
              ),
              ...clip.style,
              opacity:
                typeof clip.style?.opacity === 'number' ? clip.style.opacity : 1,
              scale: typeof clip.style?.scale === 'number' ? clip.style.scale : 1,
              rotationDeg:
                typeof clip.style?.rotationDeg === 'number'
                  ? clip.style.rotationDeg
                  : 0,
            },
          })),
        };
      });

    if (valid.length === 0) {
      window.localStorage.setItem(SSE_SEED_FLAG, '1');
      window.localStorage.setItem(UIUX_SEED_FLAG, '1');
      window.localStorage.setItem(SSE_INTRO_MIGRATE_FLAG, '1');
      return defaultSet();
    }

    const alreadySeeded = window.localStorage.getItem(SSE_SEED_FLAG) === '1';
    let result: StudioProject[] = valid;
    if (!alreadySeeded) {
      window.localStorage.setItem(SSE_SEED_FLAG, '1');
      window.localStorage.setItem(SSE_INTRO_MIGRATE_FLAG, '1');
      window.localStorage.setItem(SSE_INTRO_TIMING_V2_FLAG, '1');
      window.localStorage.setItem(SSE_SCENE4_CLEAN_FLAG, '1');
      window.localStorage.setItem(SSE_SCENE4_SPLIT_V1_FLAG, '1');
      window.localStorage.setItem(SSE_V4_REFINE_FLAG, '1');
      window.localStorage.setItem(SSE_SCENE2_IMPROVE_V1_FLAG, '1');
      window.localStorage.setItem(SSE_SCENE6_SPLIT_V1_FLAG, '1');
      if (!result.some((p) => p.id === 'project-sse-default')) {
        result = [createDefaultSseProject(), ...result];
      }
    }

    const alreadySeededUiUx = window.localStorage.getItem(UIUX_SEED_FLAG) === '1';
    if (!alreadySeededUiUx) {
      window.localStorage.setItem(UIUX_SEED_FLAG, '1');
      if (!result.some((p) => p.id === 'project-uiux-default')) {
        result = [createDefaultUiUxProject(), ...result];
      }
    }

    // One-time upgrade for existing cached project-sse-default to include sse-0-intro word-by-word clip
    const introMigrated =
      window.localStorage.getItem(SSE_INTRO_MIGRATE_FLAG) === '1';
    if (!introMigrated) {
      window.localStorage.setItem(SSE_INTRO_MIGRATE_FLAG, '1');
      window.localStorage.setItem(SSE_INTRO_TIMING_V2_FLAG, '1');
      result = result.map((proj) => {
        if (
          proj.id !== 'project-sse-default' ||
          proj.clips.some((c) => c.scenePresetId === 'sse-0-intro')
        ) {
          return proj;
        }
        const freshIntro = createDefaultSseClips(
          proj.appleDarkMode,
          proj.accentColor
        )[0];
        const updatedClips = [
          freshIntro,
          ...proj.clips.map((c, idx) => {
            if (c.scenePresetId === 'sse-1-upload' && c.from === 0) {
              return {
                ...c,
                from: 76,
                durationInFrames: 112,
                trackRow: idx + 1,
              };
            }
            if (c.scenePresetId === 'sse-2-axios-xhr' && c.from === 165) {
              return {
                ...c,
                from: 182,
                durationInFrames: 140,
                trackRow: idx + 1,
              };
            }
            return { ...c, trackRow: idx + 1 };
          }),
        ];
        return { ...proj, clips: updatedClips };
      });
    }

    // One-time timing update for cached project-sse-default to match [0, 12, 30, 39, 40, 51] + 76..188f progress bar
    const timingV2Migrated =
      window.localStorage.getItem(SSE_INTRO_TIMING_V2_FLAG) === '1';
    if (!timingV2Migrated) {
      window.localStorage.setItem(SSE_INTRO_TIMING_V2_FLAG, '1');
      result = result.map((proj) => {
        if (proj.id !== 'project-sse-default') return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) => {
            if (c.scenePresetId === 'sse-0-intro' && c.durationInFrames === 118) {
              return { ...c, from: 0, durationInFrames: 82 };
            }
            if (
              c.scenePresetId === 'sse-1-upload' &&
              c.from === 112 &&
              c.durationInFrames === 76
            ) {
              return { ...c, from: 76, durationInFrames: 112 };
            }
            return c;
          }),
        };
      });
    }

    // One-time cleanup for cached project-sse-default Scene 4 subtext
    const scene4Cleaned =
      window.localStorage.getItem(SSE_SCENE4_CLEAN_FLAG) === '1';
    if (!scene4Cleaned) {
      window.localStorage.setItem(SSE_SCENE4_CLEAN_FLAG, '1');
      result = result.map((proj) => {
        if (proj.id !== 'project-sse-default') return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) =>
            c.scenePresetId === 'sse-4-protocol' &&
            c.content.subtext === 'Protokol Komunikasi 1 Arah · text/event-stream'
              ? { ...c, content: { ...c.content, subtext: '' } }
              : c
          ),
        };
      });
    }

    // One-time split upgrade for cached project-sse-default Scene 4 into 04a + 04b
    const scene4SplitDone =
      window.localStorage.getItem(SSE_SCENE4_SPLIT_V1_FLAG) === '1';
    if (!scene4SplitDone) {
      window.localStorage.setItem(SSE_SCENE4_SPLIT_V1_FLAG, '1');
      result = result.map((proj) => {
        if (
          proj.id !== 'project-sse-default' ||
          proj.clips.some((c) => c.scenePresetId === 'sse-4a-intro')
        ) {
          return proj;
        }
        const defaults = createDefaultSseClips(
          proj.appleDarkMode,
          proj.accentColor
        );
        const intro4a = defaults.find((c) => c.scenePresetId === 'sse-4a-intro');
        if (!intro4a) return proj;

        const nextClips: TimelineClip[] = [];
        for (const c of proj.clips) {
          if (c.scenePresetId === 'sse-4-protocol') {
            nextClips.push({ ...intro4a, trackRow: nextClips.length });
            nextClips.push({
              ...c,
              name: '04b. Protokol SSE (1 Arah)',
              from: c.from === 480 ? 584 : c.from,
              durationInFrames:
                c.durationInFrames === 275 ? 174 : c.durationInFrames,
              content: {
                ...c.content,
                text:
                  c.content.text === 'SSE · Server-Sent Events'
                    ? 'Protokol Komunikasi 1 Arah'
                    : c.content.text,
                subtext: '',
              },
              trackRow: nextClips.length,
            });
          } else {
            nextClips.push({ ...c, trackRow: nextClips.length });
          }
        }
        return { ...proj, clips: nextClips };
      });
    }

    // One-time refine for cached project-sse-default: clear 04b title, update 05 WebSocket label, align 07 (1184..1455f)
    const v4Refined =
      window.localStorage.getItem(SSE_V4_REFINE_FLAG) === '1';
    if (!v4Refined) {
      window.localStorage.setItem(SSE_V4_REFINE_FLAG, '1');
      result = result.map((proj) => {
        if (proj.id !== 'project-sse-default') return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) => {
            if (c.scenePresetId === 'sse-4-protocol') {
              return {
                ...c,
                content: {
                  ...c.content,
                  text:
                    c.content.text === 'Protokol Komunikasi 1 Arah' ||
                    c.content.text === 'SSE · Server-Sent Events'
                      ? ''
                      : c.content.text,
                  subtext: '',
                },
              };
            }
            if (c.scenePresetId === 'sse-5-vs-ws') {
              return {
                ...c,
                name: '05. WebSocket (2 Arah)',
                content: {
                  ...c.content,
                  subtext: 'Server ⇄ Client (Komunikasi 2 Arah)',
                  badgeLabel: 'FULL-DUPLEX · 2 ARAH',
                },
              };
            }
            if (c.scenePresetId === 'sse-7-backend-outro') {
              return {
                ...c,
                from: 1184,
                durationInFrames: 271,
                content: {
                  ...c.content,
                  text:
                    c.content.text === 'Front-End UI'
                      ? 'Bagaimana Implementasinya?'
                      : c.content.text,
                  subtext: 'Silahkan prompt aja dulu',
                },
              };
            }
            return c;
          }),
        };
      });
    }

    // One-time Scene 2 upgrade for cached project-sse-default (Axios & XMLHttpRequest beat alignment)
    const scene2Improved =
      window.localStorage.getItem(SSE_SCENE2_IMPROVE_V1_FLAG) === '1';
    if (!scene2Improved) {
      window.localStorage.setItem(SSE_SCENE2_IMPROVE_V1_FLAG, '1');
      result = result.map((proj) => {
        if (proj.id !== 'project-sse-default') return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) => {
            if (c.scenePresetId === 'sse-2-axios-xhr') {
              return {
                ...c,
                from: c.from === 182 ? 182 : c.from,
                durationInFrames:
                  c.durationInFrames === 140 ? 152 : c.durationInFrames,
                content: {
                  ...c.content,
                  text:
                    c.content.text === 'Progress Upload di Sisi Client'
                      ? 'Buat Fitur Upload Progress'
                      : c.content.text,
                  badgeLabel:
                    c.content.badgeLabel === 'CLIENT API'
                      ? 'CLIENT-SIDE API'
                      : c.content.badgeLabel,
                },
              };
            }
            if (
              c.scenePresetId === 'sse-3-question' &&
              c.from === 315 &&
              c.durationInFrames === 170
            ) {
              return { ...c, from: 326, durationInFrames: 159 };
            }
            return c;
          }),
        };
      });
    }

    // One-time Scene 6 split upgrade for cached project-sse-default into 06a + 06b
    const scene6SplitDone =
      window.localStorage.getItem(SSE_SCENE6_SPLIT_V1_FLAG) === '1';
    if (!scene6SplitDone) {
      window.localStorage.setItem(SSE_SCENE6_SPLIT_V1_FLAG, '1');
      result = result.map((proj) => {
        if (
          proj.id !== 'project-sse-default' ||
          proj.clips.some((c) => c.scenePresetId === 'sse-6a-intro')
        ) {
          return proj;
        }
        const defaults = createDefaultSseClips(
          proj.appleDarkMode,
          proj.accentColor
        );
        const intro6a = defaults.find((c) => c.scenePresetId === 'sse-6a-intro');
        if (!intro6a) return proj;

        const nextClips: TimelineClip[] = [];
        for (const c of proj.clips) {
          if (c.scenePresetId === 'sse-6-one-way') {
            nextClips.push({ ...intro6a, trackRow: nextClips.length });
            nextClips.push({
              ...c,
              name: '06b. Server Kirim Progress',
              from: c.from === 990 ? 1098 : c.from,
              durationInFrames:
                c.durationInFrames === 200 ? 92 : c.durationInFrames,
              content: {
                ...c.content,
                text:
                  c.content.text === 'Cukup Komunikasi 1 Arah Saja'
                    ? 'Server Kirim Progress ke Client'
                    : c.content.text,
              },
              trackRow: nextClips.length,
            });
          } else {
            nextClips.push({ ...c, trackRow: nextClips.length });
          }
        }
        return { ...proj, clips: nextClips };
      });
    }

    return result;
  } catch {
    return defaultSet();
  }
}

export function saveProjectsToStorage(projects: StudioProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function exportProjectAsJson(project: StudioProject): void {
  const payload = {
    schema: 'kinetik-studio-project',
    version: 2,
    exportedAt: new Date().toISOString(),
    project,
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const slug =
    project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'komposisi';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.kinetik.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedProjectJson(rawText: string): StudioProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('File bukan format JSON yang valid');
  }

  const candidate =
    parsed &&
    typeof parsed === 'object' &&
    'project' in parsed &&
    (parsed as { project?: unknown }).project
      ? (parsed as { project: unknown }).project
      : parsed;

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    typeof (candidate as StudioProject).title !== 'string' ||
    !Array.isArray((candidate as StudioProject).clips)
  ) {
    throw new Error('Struktur JSON proyek Kinetik Studio tidak dikenali');
  }

  const src = candidate as StudioProject;
  const now = Date.now();
  return {
    ...src,
    id: makeUid('proj'),
    title: `${src.title} (Impor)`,
    isDefaultTemplate: false,
    aspectId: src.aspectId === '9:16' ? '9:16' : '16:9',
    fps: 30,
    durationInFrames: Math.max(60, Math.min(5400, Number(src.durationInFrames) || 300)),
    createdAt: now,
    updatedAt: now,
    clips: src.clips.map((clip, idx) => ({
      ...clip,
      id: makeUid('clip'),
      trackRow: typeof clip.trackRow === 'number' ? clip.trackRow : idx,
      from: Math.max(0, Math.round(Number(clip.from) || 0)),
      durationInFrames: Math.max(6, Math.round(Number(clip.durationInFrames) || 60)),
      sourceStartOffset: Math.max(0, Math.round(Number(clip.sourceStartOffset) || 0)),
      visible: clip.visible !== false,
      locked: Boolean(clip.locked),
      style: {
        ...createDefaultStyle(
          clip.style?.appleDarkMode ?? src.appleDarkMode ?? true,
          clip.style?.accentColor ?? src.accentColor ?? '#0071E3'
        ),
        ...clip.style,
        opacity:
          typeof clip.style?.opacity === 'number' ? clip.style.opacity : 1,
        scale: typeof clip.style?.scale === 'number' ? clip.style.scale : 1,
        rotationDeg:
          typeof clip.style?.rotationDeg === 'number'
            ? clip.style.rotationDeg
            : 0,
      },
    })),
  };
}

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {
  ScenePresetId,
  StudioCompositionProps,
  TimelineClip,
} from '../types';
import {
  CustomLayerRenderer,
  buildGlassSurfaceStyle,
  computeClipMotionStyles,
} from '../components/CustomLayerRenderer';
import { useSoundFxUrl } from '../../audio/soundFxSynthesizer';
import {
  Brain,
  Code2,
  Sparkles,
  Lightbulb,
  Workflow,
  Palette,
  FileVideo,
  FileAudio,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Terminal,
  FileUp,
  Sliders,
  Star,
  Check,
  Zap,
} from 'lucide-react';

export const UIUX_SCENE_NATIVE_BASE: Partial<
  Record<ScenePresetId, { start: number; end: number }>
> = {
  'uiux-0-hook': { start: 0, end: 210 },
  'uiux-1-prompting': { start: 204, end: 289 },
  'uiux-2-request': { start: 280, end: 450 },
  'uiux-3-webapp': { start: 444, end: 600 },
  'uiux-4-conflict': { start: 594, end: 915 },
  'uiux-5-improve': { start: 910, end: 1200 },
  'uiux-6-dilemma': { start: 1194, end: 1530 },
  'uiux-7-role': { start: 1524, end: 1830 },
  'uiux-8-bridge': { start: 1824, end: 2020 },
};

function getClipFadeEnvelope(
  clipLocalFrame: number,
  clipDuration: number
): number {
  const fadeIn = interpolate(clipLocalFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    clipLocalFrame,
    [Math.max(0, clipDuration - 10), clipDuration],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  return Math.min(fadeIn, fadeOut);
}

interface UiUxSceneProps {
  clip: TimelineClip;
  clipLocalFrame: number;
  sourceFrame: number;
  fps: number;
  isPortrait: boolean;
}

const UiUxScenePresetRenderer: React.FC<UiUxSceneProps> = ({
  clip,
  clipLocalFrame,
  sourceFrame,
  fps,
  isPortrait,
}) => {
  const sceneId = clip.scenePresetId ?? 'uiux-0-hook';
  const nativeSpan = UIUX_SCENE_NATIVE_BASE[sceneId] ?? { start: 0, end: 210 };
  const tFrame = nativeSpan.start + sourceFrame;

  const { style, animation } = clip;
  const appleDarkMode = style.appleDarkMode;
  const appleBlue = style.accentColor || '#0071E3';
  const purple = '#AF52DE';
  const emerald = '#34C759';
  const amber = '#FF9500';
  const rose = '#FF2D55';
  const cyan = '#00C7BE';

  const textPrimary =
    style.textColor || (appleDarkMode ? '#F5F5F7' : '#1D1D1F');
  const textSecondary = appleDarkMode ? '#B4B7C2' : '#6E6E73';
  const fontStack = `${style.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;

  const springCfg = {
    damping: Math.max(12, animation.springDamping),
    stiffness: Math.max(80, animation.springStiffness),
  };

  const customMotion = computeClipMotionStyles(clip, clipLocalFrame, fps);
  const baseEnvelope = getClipFadeEnvelope(clipLocalFrame, clip.durationInFrames);
  const layerOpacity = typeof style.opacity === 'number' ? style.opacity : 1;
  const layerScale = typeof style.scale === 'number' ? style.scale : 1;
  const layerRotation =
    typeof style.rotationDeg === 'number' ? style.rotationDeg : 0;
  const offsetTransform =
    style.posX !== 50 || style.posY !== 50
      ? `translate(${style.posX - 50}%, ${style.posY - 50}%) `
      : '';

  const wrapStyle: React.CSSProperties = {
    opacity: baseEnvelope * customMotion.opacity * layerOpacity,
    transform: `${offsetTransform}${customMotion.transform} scale(${layerScale}) rotate(${layerRotation}deg)`,
    transformOrigin: '50% 50%',
    filter: customMotion.filter,
    fontFamily: fontStack,
    color: textPrimary,
  };

  // Glass helper
  const frostedSurface = (
    accent = 'rgba(255,255,255,0.08)',
    border = 'rgba(255,255,255,0.18)'
  ): React.CSSProperties => ({
    background: appleDarkMode ? accent : 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(30px) saturate(190%)',
    WebkitBackdropFilter: 'blur(30px) saturate(190%)',
    border: `1px solid ${border}`,
    boxShadow: appleDarkMode
      ? '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
      : '0 12px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
  });

  // ============================================================================
  // SCENE 0: Hook - Teks Muncul 1 per 1 Card + Animasi Ketikan + Otak Pulsing (0-210)
  // ============================================================================
  if (sceneId === 'uiux-0-hook') {
    // Word-by-word kinetic rolling cards
    const kineticTokens = [
      { text: 'Software Engineer', cue: 0, highlight: appleBlue },
      { text: 'di Perusahaan', cue: 28, highlight: '' },
      { text: 'Tanpa UI/UX', cue: 54, highlight: rose },
      { text: 'Ibarat Menebak', cue: 88, highlight: '' },
      { text: 'Isi Kepala Atasan', cue: 122, highlight: purple },
      { text: 'Pakai Kode', cue: 160, highlight: cyan },
    ];

    const cardWidths = kineticTokens.map((t) => Math.max(160, t.text.length * (isPortrait ? 22 : 26) + 60));
    const cardCenters: number[] = [];
    let accX = 0;
    for (let i = 0; i < cardWidths.length; i++) {
      cardCenters.push(accX + cardWidths[i] / 2);
      accX += cardWidths[i] + 16;
    }

    let cameraX = cardCenters[0];
    let activeProgress = 0;
    for (let i = 1; i < kineticTokens.length; i++) {
      const step =
        tFrame >= kineticTokens[i].cue
          ? spring({
            frame: tFrame - kineticTokens[i].cue,
            fps: 30,
            config: { damping: 15, stiffness: 210, mass: 0.7 },
          })
          : 0;
      cameraX += step * (cardCenters[i] - cardCenters[i - 1]);
      activeProgress += step;
    }

    // Typewriter effect on bottom code box
    const fullCode = `const result = guessBossMind({ mode: 'code' }); // undefined ???`;
    const charsTyped = Math.min(
      fullCode.length,
      Math.floor(interpolate(tFrame, [20, 150], [0, fullCode.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
    );
    const typedCode = fullCode.slice(0, charsTyped);

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPortrait ? 28 : 38,
          padding: isPortrait ? '24px' : '40px 60px',
          overflow: 'hidden',
        }}
      >
        {/* Center: Dynamic Kinetic Horizontal Slider (Teks Muncul 1/1 Card) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isPortrait ? 130 : 150,
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              transform: `translateX(${-cameraX}px)`,
              transition: 'transform 0.05s ease-out',
            }}
          >
            {kineticTokens.map((token, idx) => {
              const isVisible = tFrame >= token.cue;
              const sp = isVisible
                ? spring({
                  frame: tFrame - token.cue,
                  fps: 30,
                  config: { damping: 14, stiffness: 190 },
                })
                : 0;
              const distBehind = Math.max(0, activeProgress - idx);
              const scale = interpolate(distBehind, [0, 1, 2.5], [isPortrait ? 1.08 : 1.1, 0.9, 0.76], {
                extrapolateRight: 'clamp',
              });
              const opacity = isVisible
                ? interpolate(distBehind, [0, 1, 3], [1, 0.65, 0.15], { extrapolateRight: 'clamp' })
                : 0;

              return (
                <div
                  key={`${token.text}-${idx}`}
                  style={{
                    ...(token.highlight
                      ? {
                        background: `linear-gradient(135deg, ${token.highlight}CC 0%, ${token.highlight}88 100%)`,
                        border: '1px solid rgba(255,255,255,0.4)',
                        boxShadow: `0 16px 40px ${token.highlight}45`,
                        color: '#FFFFFF',
                      }
                      : frostedSurface()),
                    width: cardWidths[idx],
                    flexShrink: 0,
                    padding: isPortrait ? '18px 24px' : '22px 32px',
                    borderRadius: isPortrait ? 24 : 28,
                    fontSize: isPortrait ? 28 : 36,
                    fontWeight: 800,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    opacity: opacity * sp,
                    transform: `scale(${scale * sp})`,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {token.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Centered Developer Code Typing Box */}
        <div
          style={{
            ...frostedSurface('rgba(0,0,0,0.55)', 'rgba(255,255,255,0.14)'),
            width: isPortrait ? '100%' : '80%',
            maxWidth: 960,
            borderRadius: 24,
            padding: isPortrait ? '20px 22px' : '26px 34px',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
            <span style={{ fontSize: 13, color: textSecondary, marginLeft: 8 }}>engineer.ts</span>
          </div>
          <div style={{ fontSize: isPortrait ? 17 : 22, color: '#F5F5F7', lineHeight: 1.5 }}>
            <span style={{ color: '#FF7B72' }}>&gt;</span> {typedCode}
            <span
              style={{
                display: 'inline-block',
                width: 9,
                height: 20,
                background: appleBlue,
                marginLeft: 4,
                verticalAlign: 'text-bottom',
                opacity: tFrame % 16 > 8 ? 1 : 0,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 1: Humorous Aside - Animated Terminal Prompt & Popping Stickers (204-285)
  // ============================================================================
  // SCENE 1: "ANIMASI NGE-PROMPT" (204 - 289)
  // ============================================================================
  if (sceneId === 'uiux-1-prompting') {
    const cardSp = spring({ frame: tFrame - 204, fps: 30, config: springCfg });

    const promptText = `tolong bikinin fitur ini ya, yang bagus...`;
    const charIndex = Math.min(
      promptText.length,
      Math.floor(
        interpolate(tFrame, [212, 260], [0, promptText.length], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      )
    );
    const typedPrompt = promptText.slice(0, charIndex);
    const isTypingDone = tFrame >= 260;
    const submitPulse = isTypingDone
      ? spring({ frame: tFrame - 260, fps: 30, config: { damping: 10, stiffness: 200 } })
      : 1;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? 24 : 80,
        }}
      >
        <div
          style={{
            ...frostedSurface('rgba(15,15,22,0.85)', `${purple}50`),
            width: isPortrait ? '94%' : '75%',
            maxWidth: 820,
            padding: isPortrait ? '26px 20px' : '34px 38px',
            borderRadius: isPortrait ? 24 : 28,
            transform: `scale(${cardSp})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxShadow: `0 24px 70px ${purple}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {/* Top Bar: AI Model Info & Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${purple} 0%, ${appleBlue} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${purple}50`,
                }}
              >
                <Sparkles size={18} color="#FFF" />
              </div>
              <div
                style={{
                  fontSize: isPortrait ? 15 : 17,
                  fontWeight: 700,
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                AI Prompt
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.1)',
                    color: textSecondary,
                  }}
                >
                  Copilot
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: isTypingDone ? `${emerald}20` : `${amber}20`,
                border: `1px solid ${isTypingDone ? emerald : amber}40`,
                color: isTypingDone ? emerald : amber,
                fontSize: isPortrait ? 12 : 13,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isTypingDone ? emerald : amber,
                  boxShadow: `0 0 8px ${isTypingDone ? emerald : amber}`,
                }}
              />
              {isTypingDone ? 'Ready to Send' : 'Typing Prompt...'}
            </div>
          </div>

          {/* Main Prompt Input Area with Typing Animation */}
          <div
            style={{
              minHeight: isPortrait ? 110 : 130,
              padding: isPortrait ? '18px 18px' : '22px 24px',
              borderRadius: 18,
              background: 'rgba(0, 0, 0, 0.45)',
              border: `1px solid ${purple}35`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: isPortrait ? 18 : 23,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#F8FAFC',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: `${purple}99`, marginRight: 8 }}>&gt;</span>
              {typedPrompt}
              <span
                style={{
                  display: 'inline-block',
                  width: 9,
                  height: isPortrait ? 18 : 23,
                  background: amber,
                  marginLeft: 4,
                  verticalAlign: 'middle',
                  opacity: tFrame % 14 > 7 ? 1 : 0,
                }}
              />
            </div>

            {/* Bottom bar inside input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {charIndex}/{promptText.length} chars
              </div>

              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isTypingDone
                    ? `linear-gradient(135deg, ${appleBlue} 0%, ${purple} 100%)`
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isTypingDone ? `scale(${submitPulse})` : 'scale(1)',
                  boxShadow: isTypingDone ? `0 4px 16px ${purple}60` : 'none',
                }}
              >
                <ArrowRight size={18} color={isTypingDone ? '#FFF' : 'rgba(255,255,255,0.3)'} />
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 2: The Brief - iOS Push Notification + Multi-File Flying Stream (280-450)
  // ============================================================================
  if (sceneId === 'uiux-2-request') {
    // Sliding iOS Notification banner from top
    const bannerY = interpolate(
      spring({ frame: tFrame - 280, fps: 30, config: { damping: 13, stiffness: 140 } }),
      [0, 1],
      [-100, 0]
    );

    // Staggered files popping in
    const f1 = spring({ frame: tFrame - 305, fps: 30, config: { damping: 12, stiffness: 160 } });
    const f2 = spring({ frame: tFrame - 325, fps: 30, config: { damping: 12, stiffness: 160 } });
    const f3 = spring({ frame: tFrame - 345, fps: 30, config: { damping: 12, stiffness: 160 } });

    // Animated particle stream traveling along arrow
    const streamT = ((tFrame - 330) % 36) / 36;
    const packetX = interpolate(streamT, [0, 1], [0, 100]);

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPortrait ? 28 : 40,
          padding: isPortrait ? '24px' : '40px 60px',
        }}
      >
        {/* Top: Sliding iOS Notification Banner */}
        <div
          style={{
            ...frostedSurface('rgba(255,255,255,0.12)', 'rgba(255,255,255,0.25)'),
            width: isPortrait ? '96%' : '70%',
            maxWidth: 820,
            padding: '16px 22px',
            borderRadius: 22,
            transform: `translateY(${bannerY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${purple} 0%, ${rose} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              flexShrink: 0,
            }}
          >
            <Lightbulb size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: purple }}>TASK FROM ATASAN</span>
              <span style={{ fontSize: 11, color: textSecondary }}>Baru Saja</span>
            </div>
            <div style={{ fontSize: isPortrait ? 15 : 17, fontWeight: 800, color: textPrimary, marginTop: 2 }}>
              "Tolong bikin fitur upload multimedia pake AI agent ya!"
            </div>
          </div>
        </div>

        {/* Center: Interactive File Stream to AI Agent Pipeline */}
        <div
          style={{
            width: isPortrait ? '96%' : '85%',
            maxWidth: 1100,
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 20 : 36,
          }}
        >
          {/* Multi-Format Floating Badges */}
          <div style={{ display: 'flex', flexDirection: isPortrait ? 'row' : 'column', gap: 12 }}>
            <div
              style={{
                ...frostedSurface(`${appleBlue}20`, `${appleBlue}45`),
                transform: `scale(${f1})`,
                padding: '12px 20px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: appleBlue,
                fontWeight: 800,
                fontSize: isPortrait ? 15 : 18,
              }}
            >
              <FileVideo size={22} /> Video (.mp4)
            </div>

            <div
              style={{
                ...frostedSurface(`${emerald}20`, `${emerald}45`),
                transform: `scale(${f2})`,
                padding: '12px 20px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: emerald,
                fontWeight: 800,
                fontSize: isPortrait ? 15 : 18,
              }}
            >
              <FileAudio size={22} /> Audio (.wav)
            </div>

            <div
              style={{
                ...frostedSurface(`${amber}20`, `${amber}45`),
                transform: `scale(${f3})`,
                padding: '12px 20px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: amber,
                fontWeight: 800,
                fontSize: isPortrait ? 15 : 18,
              }}
            >
              <FileImage size={22} /> Gambar (.png)
            </div>
          </div>

          {/* Animated Stream Arrow with Flowing Pulse */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: purple,
            }}
          >
            <div
              style={{
                width: isPortrait ? 2 : 120,
                height: isPortrait ? 60 : 2,
                background: `linear-gradient(90deg, ${appleBlue} 0%, ${purple} 100%)`,
                borderRadius: 999,
                position: 'relative',
              }}
            >
              {/* Traveling energy orb */}
              <div
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#FFF',
                  boxShadow: `0 0 12px ${purple}`,
                  left: isPortrait ? -4 : `${packetX}%`,
                  top: isPortrait ? `${packetX}%` : -4,
                }}
              />
            </div>
            <ArrowRight size={28} style={{ transform: isPortrait ? 'rotate(90deg)' : 'none' }} />
          </div>

          {/* Animated AI Agent Core with Rotating Orbit */}
          <div
            style={{
              ...frostedSurface(`${purple}25`, `${purple}50`),
              padding: isPortrait ? '24px 28px' : '32px 36px',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              boxShadow: `0 20px 50px ${purple}35`,
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 22,
                background: `linear-gradient(135deg, ${purple} 0%, ${appleBlue} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                boxShadow: `0 12px 28px ${purple}50`,
                transform: `rotate(${tFrame * 0.8}deg)`,
              }}
            >
              <Workflow size={36} />
            </div>
            <div>
              <div style={{ fontSize: isPortrait ? 20 : 26, fontWeight: 900, color: textPrimary }}>
                AI Agent Pipeline
              </div>
              <div style={{ fontSize: isPortrait ? 13 : 15, color: textSecondary, marginTop: 4 }}>
                Autonomous Multi-Modal Engine
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 3: The Web App - Realistic Browser Simulation, Mouse Click & Upload (444-600)
  // ============================================================================
  if (sceneId === 'uiux-3-webapp') {
    const cardSp = spring({ frame: tFrame - 444, fps: 30, config: springCfg });

    // Upload begins smoothly at frame 485
    const isUploading = tFrame >= 485;

    // Progress bar running smoothly from 0% to 100%
    const progressVal = Math.min(
      100,
      Math.floor(interpolate(tFrame, [485, 565], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
    );
    const isDone = progressVal >= 100;
    const checkSp = spring({ frame: tFrame - 565, fps: 30, config: { damping: 9, stiffness: 180 } });

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? 24 : 80,
        }}
      >
        <div
          style={{
            ...frostedSurface('rgba(0,0,0,0.55)', 'rgba(255,255,255,0.2)'),
            width: isPortrait ? '96%' : '85%',
            maxWidth: 1100,
            borderRadius: 32,
            overflow: 'hidden',
            transform: `scale(${cardSp})`,
            boxShadow: `0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          {/* Safari / Browser Mockup Title Bar */}
          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
            </div>
            <div
              style={{
                padding: '4px 24px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.4)',
                fontSize: 12,
                color: textSecondary,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              https://internal-app.dev/multimedia-upload
            </div>
            <div style={{ width: 40 }} />
          </div>

          {/* Browser Body */}
          <div
            style={{
              padding: isPortrait ? '26px 20px' : '36px 44px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: isPortrait ? 22 : 32, fontWeight: 900, margin: 0, color: textPrimary }}>
                Fitur Sudah Selesai di Web App
              </h3>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: `${emerald}20`,
                  color: emerald,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} /> v1.0 Production
              </div>
            </div>

            {/* Interactive Dropzone with animated cursor */}
            <div
              style={{
                border: `2px dashed ${appleBlue}60`,
                borderRadius: 20,
                padding: isPortrait ? '24px 16px' : '28px 24px',
                background: isUploading ? `${appleBlue}20` : `${appleBlue}0A`,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: `${appleBlue}20`,
                  color: appleBlue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileUp size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isPortrait ? 16 : 19, fontWeight: 800, color: textPrimary }}>
                  media_presentation_final.mp4
                </div>
                <div style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>
                  48.5 MB · Upload Selesai Tanpa Masalah Teknis
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: emerald }}>
                {progressVal}%
              </div>
            </div>

            {/* Live Progress Bar Meter */}
            <div style={{ height: 12, width: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressVal}%`,
                  background: `linear-gradient(90deg, ${appleBlue} 0%, ${emerald} 100%)`,
                  borderRadius: 999,
                }}
              />
            </div>

            {/* Success Celebration Pill */}
            {isDone && (
              <div
                style={{
                  transform: `scale(${checkSp})`,
                  ...frostedSurface(`${emerald}25`, `${emerald}50`),
                  padding: '10px 20px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: isPortrait ? 14 : 16,
                  width: 'fit-content',
                  margin: '0 auto',
                }}
              >
                <Check size={20} color={emerald} /> Fitur Upload Berfungsi 100%!
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 4: Terminal Typing - Narasi Pivot AI Agent & Experience Gap (594-915)
  // ============================================================================
  if (sceneId === 'uiux-4-conflict') {
    const cardSp = spring({ frame: tFrame - 594, fps: 30, config: springCfg });

    const line1Tokens = [
      { text: 'Alasan kenapa ' },
      { text: 'fitur web app', color: appleBlue, bold: true },
      { text: ' yang sudah aku kembangkan diganti menjadi ' },
      { text: 'AI agent', color: purple, bold: true },
      { text: ',' },
    ];
    const line1Full = line1Tokens.map((t) => t.text).join('');

    const line2Tokens = [
      { text: 'Karena ' },
      { text: 'experience', color: amber, bold: true },
      { text: ' dari web app yang aku kembangkan itu, ' },
      { text: 'kurang sesuai', color: rose, bold: true },
      { text: ' dengan apa yang diinginkan oleh ' },
      { text: 'atasan aku', color: '#FFFFFF', bold: true },
      { text: '.' },
    ];
    const line2Full = line2Tokens.map((t) => t.text).join('');

    // Typing progress calculations matching the voiceover narration
    const charCount1 = Math.floor(
      interpolate(tFrame, [598, 725], [0, line1Full.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );

    const charCount2 = Math.floor(
      interpolate(tFrame, [735, 895], [0, line2Full.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );

    const isLine2Active = tFrame >= 735;
    const cursorVisible = tFrame % 14 > 7;

    const renderTypedTokens = (
      tokens: Array<{ text: string; color?: string; bold?: boolean }>,
      maxChars: number
    ) => {
      let remaining = maxChars;
      return tokens.map((token, idx) => {
        if (remaining <= 0) return null;
        const take = Math.min(token.text.length, remaining);
        remaining -= take;
        const visibleText = token.text.slice(0, take);
        return (
          <span
            key={idx}
            style={{
              color: token.color || textPrimary,
              fontWeight: token.bold ? 900 : 700,
              textShadow: token.color ? `0 0 16px ${token.color}40` : undefined,
            }}
          >
            {visibleText}
          </span>
        );
      });
    };

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? 20 : 60,
        }}
      >
        <div
          style={{
            ...frostedSurface('rgba(13, 17, 23, 0.88)', 'rgba(255, 255, 255, 0.16)'),
            width: isPortrait ? '96%' : '88%',
            maxWidth: 1120,
            borderRadius: isPortrait ? 26 : 32,
            overflow: 'hidden',
            transform: `scale(${cardSp})`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,113,227,0.15)',
          }}
        >
          {/* Terminal Title Bar */}
          <div
            style={{
              padding: isPortrait ? '14px 18px' : '16px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
              <span
                style={{
                  marginLeft: 10,
                  fontSize: isPortrait ? 12 : 14,
                  color: textSecondary,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                zsh — retrospective.sh
              </span>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: isLine2Active ? `${rose}22` : `${appleBlue}20`,
                border: `1px solid ${isLine2Active ? rose : appleBlue}40`,
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                color: isLine2Active ? rose : appleBlue,
                fontWeight: 700,
              }}
            >
              <Terminal size={14} />
              <span>{isLine2Active ? 'EXPERIENCE GAP DETECTED' : 'ANALYZING REQUIREMENTS'}</span>
            </div>
          </div>

          {/* Terminal Body */}
          <div
            style={{
              padding: isPortrait ? '26px 20px' : '38px 44px',
              display: 'flex',
              flexDirection: 'column',
              gap: isPortrait ? 20 : 26,
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: isPortrait ? 20 : 28,
              lineHeight: 1.55,
              letterSpacing: '-0.01em',
            }}
          >
            {/* Command Header Prompt */}
            <div
              style={{
                fontSize: isPortrait ? 13 : 16,
                color: textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: 14,
              }}
            >
              <span style={{ color: emerald, fontWeight: 900 }}>➜</span>
              <span style={{ color: appleBlue }}>project</span>
              <span style={{ color: textSecondary }}>git:(feature/upload)</span>
              <span style={{ color: amber }}>$</span>
              <span style={{ color: textPrimary, fontWeight: 800 }}>explain-pivot --verbose</span>
            </div>

            {/* Line 1 Typing Output */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isPortrait ? 10 : 16 }}>
              <span style={{ color: purple, fontWeight: 900, userSelect: 'none' }}>❯</span>
              <div style={{ flex: 1 }}>
                {renderTypedTokens(line1Tokens, charCount1)}
                {!isLine2Active && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: isPortrait ? 9 : 12,
                      height: isPortrait ? 20 : 28,
                      background: appleBlue,
                      marginLeft: 4,
                      verticalAlign: 'text-bottom',
                      opacity: cursorVisible ? 1 : 0,
                      boxShadow: `0 0 10px ${appleBlue}`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Line 2 Typing Output */}
            {tFrame >= 730 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: isPortrait ? 10 : 16 }}>
                <span style={{ color: rose, fontWeight: 900, userSelect: 'none' }}>❯</span>
                <div style={{ flex: 1 }}>
                  {renderTypedTokens(line2Tokens, charCount2)}
                  {isLine2Active && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: isPortrait ? 9 : 12,
                        height: isPortrait ? 20 : 28,
                        background: rose,
                        marginLeft: 4,
                        verticalAlign: 'text-bottom',
                        opacity: cursorVisible ? 1 : 0,
                        boxShadow: `0 0 10px ${rose}`,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Terminal Live Diagnostics Footer */}
            {tFrame >= 750 && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 16,
                  borderTop: '1px dashed rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: isPortrait ? 12 : 14,
                  color: textSecondary,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isLine2Active ? rose : emerald,
                      boxShadow: `0 0 8px ${isLine2Active ? rose : emerald}`,
                    }}
                  />
                  <span>ROOT CAUSE: EXPERIENCE_GAP</span>
                </div>
                <div>
                  DIFF:{' '}
                  <span style={{ color: rose, fontWeight: 700 }}>- WEB_APP</span>{' '}
                  <span style={{ color: purple, fontWeight: 700 }}>+ AI_AGENT</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 5: Pendapat -> Masalah -> Solusi (910-1193)
  // Naskah:
  // "Menurut aku, kalo memang masalahnya di experience dari web tersebut,
  //  Kita bisa improve experience tersebut terlebih dahulu"
  // ============================================================================
  if (sceneId === 'uiux-5-improve') {
    // 01. Pendapat: "Menurut aku..." (frame 912+)
    const sp1 = spring({ frame: tFrame - 912, fps: 30, config: { damping: 12, stiffness: 170 } });

    // 02. Masalah: "kalo memang masalahnya di experience dari web tersebut..." (frame 960+)
    const isStep2 = tFrame >= 960;
    const sp2 = isStep2 ? spring({ frame: tFrame - 960, fps: 30, config: { damping: 12, stiffness: 170 } }) : 0;
    const arrow1Sp = isStep2 ? spring({ frame: tFrame - 960, fps: 30, config: { damping: 14, stiffness: 200 } }) : 0;

    // 03. Solusi: "Kita bisa improve experience tersebut terlebih dahulu" (frame 1055+)
    const isStep3 = tFrame >= 1055;
    const sp3 = isStep3 ? spring({ frame: tFrame - 1055, fps: 30, config: { damping: 11, stiffness: 180 } }) : 0;
    const arrow2Sp = isStep3 ? spring({ frame: tFrame - 1055, fps: 30, config: { damping: 14, stiffness: 200 } }) : 0;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? 20 : 60,
        }}
      >
        <div
          style={{
            width: isPortrait ? '94%' : '88%',
            maxWidth: 1080,
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 12 : 16,
          }}
        >
          {/* 01. PENDAPAT */}
          <div
            style={{
              transform: `scale(${sp1})`,
              ...frostedSurface('rgba(168, 85, 247, 0.12)', `${purple}45`),
              borderRadius: isPortrait ? 20 : 26,
              padding: isPortrait ? '18px 20px' : '32px 24px',
              display: 'flex',
              flexDirection: isPortrait ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: isPortrait ? 'flex-start' : 'center',
              textAlign: isPortrait ? 'left' : 'center',
              gap: isPortrait ? 16 : 14,
              flex: 1,
              width: isPortrait ? '100%' : 'auto',
              boxShadow: `0 16px 40px ${purple}20`,
            }}
          >
            <div
              style={{
                width: isPortrait ? 48 : 56,
                height: isPortrait ? 48 : 56,
                borderRadius: 16,
                background: `${purple}25`,
                border: `1px solid ${purple}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lightbulb size={isPortrait ? 24 : 28} color={purple} />
            </div>
            <div>
              <div
                style={{
                  display: 'inline-block',
                  background: `${purple}25`,
                  color: purple,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                01. PENDAPAT
              </div>
              <div style={{ fontSize: isPortrait ? 19 : 24, fontWeight: 900, color: '#FFF', lineHeight: 1.25 }}>
                "Menurut aku..."
              </div>
              <div style={{ fontSize: isPortrait ? 12 : 14, color: textSecondary, marginTop: 4 }}>
                Sudut pandang developer
              </div>
            </div>
          </div>

          {/* Arrow 1 */}
          {isStep2 && (
            <div
              style={{
                transform: `scale(${arrow1Sp})`,
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPortrait ? <ArrowDown size={22} /> : <ArrowRight size={24} />}
            </div>
          )}

          {/* 02. MASALAH */}
          {isStep2 && (
            <div
              style={{
                transform: `scale(${sp2})`,
                ...frostedSurface('rgba(255, 149, 0, 0.12)', `${amber}45`),
                borderRadius: isPortrait ? 20 : 26,
                padding: isPortrait ? '18px 20px' : '32px 24px',
                display: 'flex',
                flexDirection: isPortrait ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isPortrait ? 'flex-start' : 'center',
                textAlign: isPortrait ? 'left' : 'center',
                gap: isPortrait ? 16 : 14,
                flex: 1,
                width: isPortrait ? '100%' : 'auto',
                boxShadow: `0 16px 40px ${amber}20`,
              }}
            >
              <div
                style={{
                  width: isPortrait ? 48 : 56,
                  height: isPortrait ? 48 : 56,
                  borderRadius: 16,
                  background: `${amber}25`,
                  border: `1px solid ${amber}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={isPortrait ? 24 : 28} color={amber} />
              </div>
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    background: `${amber}25`,
                    color: amber,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  02. MASALAH
                </div>
                <div style={{ fontSize: isPortrait ? 19 : 24, fontWeight: 900, color: '#FFF', lineHeight: 1.25 }}>
                  Experience Web
                </div>
                <div style={{ fontSize: isPortrait ? 12 : 14, color: textSecondary, marginTop: 4 }}>
                  Kurang sesuai ekspektasi
                </div>
              </div>
            </div>
          )}

          {/* Arrow 2 */}
          {isStep3 && (
            <div
              style={{
                transform: `scale(${arrow2Sp})`,
                color: emerald,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPortrait ? <ArrowDown size={22} /> : <ArrowRight size={24} />}
            </div>
          )}

          {/* 03. SOLUSI */}
          {isStep3 && (
            <div
              style={{
                transform: `scale(${sp3})`,
                ...frostedSurface('rgba(52, 199, 89, 0.16)', `${emerald}60`),
                borderRadius: isPortrait ? 20 : 26,
                padding: isPortrait ? '18px 20px' : '32px 24px',
                display: 'flex',
                flexDirection: isPortrait ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isPortrait ? 'flex-start' : 'center',
                textAlign: isPortrait ? 'left' : 'center',
                gap: isPortrait ? 16 : 14,
                flex: 1,
                width: isPortrait ? '100%' : 'auto',
                border: `2px solid ${emerald}`,
                boxShadow: `0 20px 50px ${emerald}35`,
              }}
            >
              <div
                style={{
                  width: isPortrait ? 48 : 56,
                  height: isPortrait ? 48 : 56,
                  borderRadius: 16,
                  background: emerald,
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 6px 18px ${emerald}50`,
                }}
              >
                <CheckCircle2 size={isPortrait ? 24 : 28} />
              </div>
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    background: `${emerald}25`,
                    color: emerald,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  03. SOLUSI
                </div>
                <div style={{ fontSize: isPortrait ? 19 : 24, fontWeight: 900, color: '#FFF', lineHeight: 1.25 }}>
                  Improve Experience
                </div>
                <div style={{ fontSize: isPortrait ? 12 : 14, color: '#D1D1D6', marginTop: 4 }}>
                  Perbaiki terlebih dahulu
                </div>
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 6: Kinetic Word-by-Word Dilemma (1194-1524)
  // ============================================================================
  if (sceneId === 'uiux-6-dilemma') {
    // Sentence 1 Word-by-Word Tokens (1196 - 1345)
    // "Dizaman AI seperti sekarang, developer mungkin mungkin saja membuat improvement dari software yang dikembangkan"
    const sentence1Words = [
      { word: 'Dizaman', cue: 1196 },
      { word: 'AI', cue: 1206, highlight: purple, isSpecial: true },
      { word: 'seperti', cue: 1216 },
      { word: 'sekarang,', cue: 1224 },
      { word: 'developer', cue: 1238, highlight: appleBlue, isSpecial: true },
      { word: 'mungkin', cue: 1252 },
      { word: 'mungkin', cue: 1262 },
      { word: 'saja', cue: 1272 },
      { word: 'membuat', cue: 1282 },
      { word: 'improvement', cue: 1294, highlight: emerald, isSpecial: true },
      { word: 'dari', cue: 1308 },
      { word: 'software', cue: 1318, highlight: appleBlue },
      { word: 'yang', cue: 1328 },
      { word: 'dikembangkan.', cue: 1336 },
    ];

    // Sentence 2 Word-by-Word Tokens (1360 - 1515)
    // "Cuman, experience dari sisi developer, belum tentu sesuai dengan experience yang diinginkan oleh atasan kita"
    const sentence2Words = [
      { word: 'Cuman,', cue: 1360, highlight: amber, isSpecial: true },
      { word: 'experience', cue: 1370, highlight: amber, isSpecial: true },
      { word: 'dari', cue: 1384 },
      { word: 'sisi', cue: 1392 },
      { word: 'developer,', cue: 1400, highlight: appleBlue },
      { word: 'belum', cue: 1414, highlight: rose, isSpecial: true },
      { word: 'tentu', cue: 1422, highlight: rose, isSpecial: true },
      { word: 'sesuai', cue: 1432, highlight: rose, isSpecial: true },
      { word: 'dengan', cue: 1446 },
      { word: 'experience', cue: 1456, highlight: amber, isSpecial: true },
      { word: 'yang', cue: 1470 },
      { word: 'diinginkan', cue: 1478 },
      { word: 'oleh', cue: 1490 },
      { word: 'atasan', cue: 1498, highlight: purple, isSpecial: true },
      { word: 'kita.', cue: 1508, highlight: purple, isSpecial: true },
    ];

    const activeIdx1 = sentence1Words.findIndex(
      (w, i) => tFrame >= w.cue && (i === sentence1Words.length - 1 || tFrame < sentence1Words[i + 1].cue)
    );

    const isSentence2Started = tFrame >= 1355;
    const activeIdx2 = isSentence2Started
      ? sentence2Words.findIndex(
        (w, i) => tFrame >= w.cue && (i === sentence2Words.length - 1 || tFrame < sentence2Words[i + 1].cue)
      )
      : -1;

    const s1Opacity = isSentence2Started
      ? interpolate(tFrame, [1355, 1380], [1, 0.6], { extrapolateRight: 'clamp' })
      : 1;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '24px 20px' : '40px 80px',
          gap: isPortrait ? 28 : 40,
        }}
      >
        {/* Sentence 1 Word-by-Word Container */}
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: s1Opacity,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: isPortrait ? '10px 10px' : '14px 18px',
              lineHeight: 1.4,
            }}
          >
            {sentence1Words.map((item, idx) => {
              const isVisible = tFrame >= item.cue;
              const sp = isVisible
                ? spring({
                  frame: tFrame - item.cue,
                  fps: 30,
                  config: { damping: 11, stiffness: 220, mass: 0.6 },
                })
                : 0;
              const isActive = activeIdx1 === idx;

              if (!isVisible) return null;

              return (
                <span
                  key={`s1-${item.word}-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: isPortrait ? 26 : 40,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    opacity: sp,
                    transform: `scale(${sp * (isActive ? 1.15 : 1)})`,
                    transition: 'transform 0.12s ease',
                    ...(item.isSpecial && item.highlight
                      ? {
                        background: isActive
                          ? item.highlight
                          : `${item.highlight}25`,
                        color: isActive ? '#FFFFFF' : item.highlight,
                        padding: isPortrait ? '4px 14px' : '6px 20px',
                        borderRadius: 14,
                        border: `1px solid ${item.highlight}50`,
                        boxShadow: isActive
                          ? `0 0 24px ${item.highlight}80`
                          : `0 4px 14px ${item.highlight}20`,
                      }
                      : {
                        color: isActive ? '#FFFFFF' : textPrimary,
                        textShadow: isActive ? '0 0 20px rgba(255,255,255,0.85)' : '0 2px 10px rgba(0,0,0,0.5)',
                        padding: '2px 4px',
                      }),
                  }}
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sentence 2 Word-by-Word Container */}
        {isSentence2Started && (
          <div
            style={{
              width: '100%',
              maxWidth: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isPortrait ? '10px 10px' : '14px 18px',
                lineHeight: 1.4,
              }}
            >
              {sentence2Words.map((item, idx) => {
                const isVisible = tFrame >= item.cue;
                const sp = isVisible
                  ? spring({
                    frame: tFrame - item.cue,
                    fps: 30,
                    config: { damping: 11, stiffness: 220, mass: 0.6 },
                  })
                  : 0;
                const isActive = activeIdx2 === idx;

                if (!isVisible) return null;

                return (
                  <span
                    key={`s2-${item.word}-${idx}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: isPortrait ? 28 : 42,
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      opacity: sp,
                      transform: `scale(${sp * (isActive ? 1.15 : 1)})`,
                      transition: 'transform 0.12s ease',
                      ...(item.isSpecial && item.highlight
                        ? {
                          background: isActive
                            ? item.highlight
                            : `${item.highlight}25`,
                          color: isActive ? '#FFFFFF' : item.highlight,
                          padding: isPortrait ? '4px 14px' : '6px 20px',
                          borderRadius: 14,
                          border: `1px solid ${item.highlight}50`,
                          boxShadow: isActive
                            ? `0 0 24px ${item.highlight}80`
                            : `0 4px 14px ${item.highlight}20`,
                        }
                        : {
                          color: isActive ? '#FFFFFF' : textPrimary,
                          textShadow: isActive ? '0 0 20px rgba(255,255,255,0.85)' : '0 2px 10px rgba(0,0,0,0.5)',
                          padding: '2px 4px',
                        }),
                    }}
                  >
                    {item.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 7: The Value of UI/UX - Figma Design Canvas Simulation with Live Cursors (1524-1830)
  // ============================================================================
  if (sceneId === 'uiux-7-role') {
    const cardSp = spring({ frame: tFrame - 1524, fps: 30, config: springCfg });

    // 3 Cards popping sequentially
    const c1 = spring({ frame: tFrame - 1535, fps: 30, config: { damping: 11, stiffness: 160 } });
    const c2 = spring({ frame: tFrame - 1565, fps: 30, config: { damping: 11, stiffness: 160 } });
    const c3 = spring({ frame: tFrame - 1595, fps: 30, config: { damping: 11, stiffness: 160 } });

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '24px 20px' : '40px 60px',
          overflow: 'hidden',
        }}
      >
        {/* Interactive Figma Canvas with 3 Distinct Cards */}
        <div
          style={{
            position: 'relative',
            width: isPortrait ? '100%' : '90%',
            maxWidth: 1150,
            display: 'grid',
            gridTemplateColumns: isPortrait ? '1fr' : 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {/* Card 1: Desain Tampilan Menarik */}
          <div
            style={{
              ...frostedSurface('rgba(255,45,85,0.12)', `${rose}40`),
              transform: `scale(${c1})`,
              borderRadius: 24,
              padding: isPortrait ? 20 : 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `${rose}25`,
                color: rose,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={26} />
            </div>
            <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
              Tampilan Menarik
            </div>
            <div style={{ fontSize: isPortrait ? 13 : 15, color: textSecondary, lineHeight: 1.4 }}>
              Estetika visual modern, warna harmonis, &amp; konsistensi desain sistem.
            </div>
          </div>

          {/* Card 2: Menyusun Flow */}
          <div
            style={{
              ...frostedSurface('rgba(0,113,227,0.12)', `${appleBlue}40`),
              transform: `scale(${c2})`,
              borderRadius: 24,
              padding: isPortrait ? 20 : 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `${appleBlue}25`,
                color: appleBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Workflow size={26} />
            </div>
            <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
              Menyusun Flow
            </div>
            <div style={{ fontSize: isPortrait ? 13 : 15, color: textSecondary, lineHeight: 1.4 }}>
              Merancang alur wireframe agar pengguna tidak tersesat di aplikasi.
            </div>
          </div>

          {/* Card 3: Experience Bagus */}
          <div
            style={{
              ...frostedSurface('rgba(52,199,89,0.12)', `${emerald}40`),
              transform: `scale(${c3})`,
              borderRadius: 24,
              padding: isPortrait ? 20 : 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `${emerald}25`,
                color: emerald,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={26} />
            </div>
            <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
              Experience Bagus
            </div>
            <div style={{ fontSize: isPortrait ? 13 : 15, color: textSecondary, lineHeight: 1.4 }}>
              Interaksi responsif, minim friksi, &amp; memuaskan harapan pengguna.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 8: The Conclusion - Animated 3-Station Assembly Line (1824-2020)
  // ============================================================================
  if (sceneId === 'uiux-8-bridge') {
    const cardSp = spring({ frame: tFrame - 1824, fps: 30, config: springCfg });

    // Traveling light beam along the 3 stations
    const lightT = ((tFrame - 1830) % 45) / 45;
    const lightPos = interpolate(lightT, [0, 1], [0, 100]);

    const s1 = spring({ frame: tFrame - 1830, fps: 30, config: { damping: 11, stiffness: 160 } });
    const s2 = spring({ frame: tFrame - 1855, fps: 30, config: { damping: 11, stiffness: 160 } });
    const s3 = spring({ frame: tFrame - 1880, fps: 30, config: { damping: 11, stiffness: 160 } });

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '24px 20px' : '40px 60px',
        }}
      >
        {/* 3-Station Pipeline Assembly with Traveling Light Pulses */}
        <div
          style={{
            position: 'relative',
            width: isPortrait ? '100%' : '92%',
            maxWidth: 1200,
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 18 : 24,
          }}
        >
          {/* Station 1: Ide Atasan */}
          <div
            style={{
              ...frostedSurface('rgba(255,149,0,0.14)', `${amber}45`),
              transform: `scale(${s1})`,
              borderRadius: 24,
              padding: isPortrait ? '22px 24px' : '28px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: 1,
              width: isPortrait ? '100%' : 'auto',
              boxShadow: `0 12px 35px ${amber}20`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: `${amber}25`,
                color: amber,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lightbulb size={30} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: amber }}>TAHAP 1</div>
              <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
                Ide Atasan
              </div>
            </div>
          </div>

          {/* Cable Connector */}
          <div
            style={{
              color: textSecondary,
              fontWeight: 900,
              fontSize: 24,
              transform: isPortrait ? 'rotate(90deg)' : 'none',
            }}
          >
            ➔
          </div>

          {/* Station 2: UI/UX Bridge */}
          <div
            style={{
              ...frostedSurface('rgba(175,82,222,0.18)', `${purple}55`),
              transform: `scale(${s2})`,
              borderRadius: 24,
              padding: isPortrait ? '22px 24px' : '28px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: 1,
              width: isPortrait ? '100%' : 'auto',
              border: `1.5px solid ${purple}80`,
              boxShadow: `0 14px 40px ${purple}28`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${purple} 0%, ${appleBlue} 100%)`,
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Palette size={30} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: purple }}>JEMBATAN UTAMA</div>
              <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
                UI/UX Validation
              </div>
            </div>
          </div>

          {/* Cable Connector */}
          <div
            style={{
              color: textSecondary,
              fontWeight: 900,
              fontSize: 24,
              transform: isPortrait ? 'rotate(90deg)' : 'none',
            }}
          >
            ➔
          </div>

          {/* Station 3: Developer Code */}
          <div
            style={{
              ...frostedSurface('rgba(52,199,89,0.14)', `${emerald}45`),
              transform: `scale(${s3})`,
              borderRadius: 24,
              padding: isPortrait ? '22px 24px' : '28px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: 1,
              width: isPortrait ? '100%' : 'auto',
              boxShadow: `0 12px 35px ${emerald}20`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: `${emerald}25`,
                color: emerald,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Code2 size={30} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: emerald }}>TAHAP 3</div>
              <div style={{ fontSize: isPortrait ? 19 : 22, fontWeight: 900, color: textPrimary }}>
                Coding Developer
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return null;
};

export const UiUxEngineerComposition: React.FC<StudioCompositionProps> = ({
  accentColor,
  appleDarkMode,
  transparentBackground,
  audioVolume = 1,
  audioSrc,
  soundFxVolume = 0.75,
  audioEnabled = true,
  clips,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const isPortrait = height > width;
  const sfxUrl = useSoundFxUrl(
    soundFxVolume > 0,
    Math.max(10, Math.round(durationInFrames / fps)),
    'uiux'
  );

  const tFrame = (frame / fps) * 30;
  const rootBg = transparentBackground
    ? 'transparent'
    : appleDarkMode
      ? '#05070B'
      : '#E9EEF5';
  const textPrimary = appleDarkMode ? '#F5F5F7' : '#1D1D1F';

  // Clips list
  const activeClips = clips && clips.length > 0 ? clips : [];
  const renderOrder = [...activeClips].sort((a, b) => b.trackRow - a.trackRow);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: rootBg,
        color: textPrimary,
        fontFamily:
          'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Voice-Over Audio Track */}
      {audioEnabled && audioVolume > 0 && (
        <Audio
          src={audioSrc || '/assets/aistudio/ui_ux_engineer_voiceover.mp3'}
          volume={audioVolume}
        />
      )}

      {/* Synthesized Sound FX */}
      {soundFxVolume > 0 && sfxUrl && (
        <Audio src={sfxUrl} volume={soundFxVolume} />
      )}

      {/* Render Timeline Clips */}
      {renderOrder.map((clip) => {
        if (!clip.visible) return null;
        if (tFrame < clip.from || tFrame >= clip.from + clip.durationInFrames) {
          return null;
        }
        const clipLocalFrame = tFrame - clip.from;
        const sourceFrame = clip.animation.resetOnTrim
          ? clipLocalFrame
          : clipLocalFrame + clip.sourceStartOffset;

        if (clip.kind === 'custom-layer') {
          return (
            <CustomLayerRenderer
              key={clip.id}
              clip={clip}
              clipLocalFrame={clipLocalFrame}
              sourceFrame={sourceFrame}
              fps={30}
              isPortrait={isPortrait}
            />
          );
        }

        return (
          <UiUxScenePresetRenderer
            key={clip.id}
            clip={clip}
            clipLocalFrame={clipLocalFrame}
            sourceFrame={sourceFrame}
            fps={30}
            isPortrait={isPortrait}
          />
        );
      })}
    </AbsoluteFill>
  );
};

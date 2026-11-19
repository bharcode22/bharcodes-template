import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
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
  NodeJsIcon,
  ReactIcon,
  WebSocketIcon,
} from '../components/TechIcons';
import {
  CustomLayerRenderer,
  buildGlassSurfaceStyle,
  computeClipMotionStyles,
} from '../components/CustomLayerRenderer';
import { createDefaultSseClips } from '../../utils/projectStorage';
import { useSoundFxUrl } from '../../audio/soundFxSynthesizer';

const SSE_SCENE_NATIVE_BASE: Partial<
  Record<ScenePresetId, { start: number; end: number }>
> = {
  'sse-0-intro': { start: 0, end: 82 },
  'sse-1-upload': { start: 76, end: 188 },
  'sse-2-axios-xhr': { start: 182, end: 334 },
  'sse-3-question': { start: 326, end: 485 },
  'sse-4a-intro': { start: 480, end: 592 },
  'sse-4-protocol': { start: 584, end: 758 },
  'sse-5-vs-ws': { start: 750, end: 995 },
  'sse-6a-intro': { start: 990, end: 1104 },
  'sse-6-one-way': { start: 1098, end: 1190 },
  'sse-7-backend-outro': { start: 1184, end: 1455 },
};

function getClipFadeEnvelope(
  clipLocalFrame: number,
  clipDuration: number
): number {
  const fadeIn = interpolate(clipLocalFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    clipLocalFrame,
    [Math.max(0, clipDuration - 14), clipDuration],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  return Math.min(fadeIn, fadeOut);
}

const UploadCloudIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 44,
  color = '#0071E3',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M20 46H46C51.523 46 56 41.523 56 36C56 30.89 52.165 26.678 47.216 26.074C45.736 18.617 39.156 13 31.25 13C22.275 13 15 20.275 15 29.25C15 29.596 15.011 29.94 15.032 30.281C11.031 31.592 8 35.357 8 39.8C8 43.224 10.776 46 14.2 46H20Z"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32 50V29M32 29L24 37M32 29L40 37"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ServerRackIcon: React.FC<{
  size?: number;
  color?: string;
  accentColor?: string;
}> = ({ size = 48, color = '#F5F5F7', accentColor = '#34C759' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect
      x="10"
      y="10"
      width="44"
      height="18"
      rx="5"
      stroke={color}
      strokeWidth="3"
    />
    <rect
      x="10"
      y="36"
      width="44"
      height="18"
      rx="5"
      stroke={color}
      strokeWidth="3"
    />
    <circle cx="20" cy="19" r="3" fill={accentColor} />
    <circle cx="20" cy="45" r="3" fill={accentColor} />
    <path
      d="M30 19H44M30 45H44"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const SseStreamIcon: React.FC<{
  size?: number;
  color?: string;
  accentColor?: string;
}> = ({ size = 56, color = '#0071E3', accentColor = '#34C759' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect
      x="8"
      y="12"
      width="48"
      height="40"
      rx="10"
      stroke={color}
      strokeWidth="3"
      fill={color}
      fillOpacity="0.12"
    />
    <path
      d="M17 32H47M47 32L37 22M47 32L37 42"
      stroke={accentColor}
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="17" cy="22" r="2.6" fill={color} />
    <circle cx="17" cy="42" r="2.6" fill={color} />
  </svg>
);

interface SseSceneProps {
  clip: TimelineClip;
  clipLocalFrame: number;
  sourceFrame: number;
  fps: number;
  isPortrait: boolean;
}

const SseScenePresetRenderer: React.FC<SseSceneProps> = ({
  clip,
  clipLocalFrame,
  sourceFrame,
  fps,
  isPortrait,
}) => {
  const sceneId = clip.scenePresetId ?? 'sse-1-upload';
  const nativeSpan = SSE_SCENE_NATIVE_BASE[sceneId] ?? { start: 0, end: 170 };
  const tFrame = nativeSpan.start + sourceFrame;

  const { style, content, animation } = clip;
  const appleDarkMode = style.appleDarkMode;
  const appleBlue = style.accentColor || '#0071E3';
  const emerald = '#34C759';
  const cyan = '#0EA5E9';
  const amber = '#F59E0B';

  const glassStyle = buildGlassSurfaceStyle(clip);
  const innerGlassStyle: React.CSSProperties = {
    background: appleDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.48)',
    backdropFilter: `blur(${Math.max(12, Math.round(style.blurPx * 0.6))}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${Math.max(12, Math.round(style.blurPx * 0.6))}px) saturate(180%)`,
    border: appleDarkMode
      ? '1px solid rgba(255, 255, 255, 0.16)'
      : '1px solid rgba(255, 255, 255, 0.72)',
  };

  const textPrimary =
    style.textColor || (appleDarkMode ? '#F5F5F7' : '#1D1D1F');
  const textSecondary = appleDarkMode ? '#B4B7C2' : '#4B5563';
  const openShadow = appleDarkMode
    ? '0 4px 28px rgba(0, 0, 0, 0.7)'
    : '0 2px 18px rgba(255, 255, 255, 0.68)';
  const fontStack = `${style.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;

  const springCfg = {
    damping: Math.max(11, animation.springDamping),
    stiffness: Math.max(60, animation.springStiffness),
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

  // ============================================================================
  // SCENE 0 (0 - 82f): Word/Phrase-by-Phrase Kinetic Glass Cards
  // ============================================================================
  if (sceneId === 'sse-0-intro') {
    const defaultScript =
      'pernah gak ketika kamu upload file ke suatu sistem';
    const headline = content.text.trim() || defaultScript;
    const normalizedHeadline = headline.replace(/\s+/g, ' ').toLowerCase();

    const defaultPhrases = [
      'pernah',
      'gak',
      'ketika',
      'kamu',
      'upload file',
      'ke suatu sistem',
    ];
    const defaultPhraseCues = [0, 12, 30, 39, 40, 51];

    const tokens =
      normalizedHeadline === defaultScript
        ? defaultPhrases
        : headline.includes('|')
          ? headline
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : headline.trim().split(/\s+/).filter(Boolean);

    const tokenCues =
      tokens.length === 6
        ? defaultPhraseCues
        : tokens.map((_, idx) =>
            Math.round((idx * 51) / Math.max(1, tokens.length - 1))
          );

    const cardFontSize = isPortrait
      ? Math.max(64, Math.round(style.fontSize * 1.28))
      : style.fontSize || 58;
    const cardPadX = isPortrait ? 50 : style.paddingX || 40;
    const cardGap = isPortrait ? 28 : 24;

    const cardWidths = tokens.map((word) => {
      let units = 0;
      for (const ch of word) {
        if ('iljtfrI1!., '.includes(ch)) units += 0.34;
        else if ('mwMW'.includes(ch)) units += 0.84;
        else units += 0.56;
      }
      return Math.round(units * cardFontSize + cardPadX * 2 + 18);
    });

    const cardCenters: number[] = [];
    let accumX = 0;
    for (let i = 0; i < cardWidths.length; i++) {
      cardCenters.push(accumX + cardWidths[i] / 2);
      accumX += cardWidths[i] + cardGap;
    }

    const s0SpringCfg = {
      damping: Math.max(14, animation.springDamping + 4),
      stiffness: Math.max(230, animation.springStiffness * 1.85),
      mass: 0.65,
    };

    let cameraX = cardCenters[0] ?? 0;
    let activeProgress = 0;
    for (let i = 1; i < tokens.length; i++) {
      const cueFrame = tokenCues[i];
      const step =
        tFrame >= cueFrame
          ? spring({
              frame: tFrame - cueFrame,
              fps: 30,
              config: s0SpringCfg,
            })
          : 0;
      cameraX += step * (cardCenters[i] - cardCenters[i - 1]);
      activeProgress += step;
    }

    const highlightTarget = (content.highlightWord || 'upload').toLowerCase();

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isPortrait ? 300 : 210,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: cardGap,
              transform: `translateX(${-cameraX}px)`,
            }}
          >
            {tokens.map((word, idx) => {
              const startAt = tokenCues[idx];
              const isVisible = tFrame >= startAt;

              const enterSpring = isVisible
                ? spring({
                    frame: tFrame - startAt,
                    fps: 30,
                    config: s0SpringCfg,
                  })
                : 0;

              const enterX = isVisible
                ? interpolate(enterSpring, [0, 1], [280, 0])
                : 280;
              const enterScale = isVisible
                ? interpolate(enterSpring, [0, 1], [0.86, 1])
                : 0.86;
              const enterOpacity = isVisible
                ? interpolate(enterSpring, [0, 0.35], [0, 1], {
                    extrapolateRight: 'clamp',
                  })
                : 0;

              const distBehind = Math.max(0, activeProgress - idx);
              const focusScale = interpolate(
                distBehind,
                [0, 1, 2.5],
                [isPortrait ? 1.08 : 1.06, 0.88, 0.74],
                { extrapolateRight: 'clamp' }
              );
              const trailOpacity = interpolate(
                distBehind,
                [0, 1, 2.5, 4.2],
                [1, 0.62, 0.3, 0],
                { extrapolateRight: 'clamp' }
              );
              const trailY = interpolate(distBehind, [0, 2], [0, 6], {
                extrapolateRight: 'clamp',
              });

              const lower = word.toLowerCase().replace(/[?.,!]/g, '');
              const isHighlight =
                (Boolean(highlightTarget) &&
                  (lower === highlightTarget ||
                    lower.split(/\s+/).includes(highlightTarget))) ||
                lower.split(/\s+/).includes('upload');

              return (
                <div
                  key={`${word}-${idx}`}
                  style={{
                    ...(isHighlight
                      ? {
                          background: appleDarkMode
                            ? `linear-gradient(145deg, ${appleBlue}AD 0%, ${appleBlue}6B 100%)`
                            : `linear-gradient(145deg, ${appleBlue}BD 0%, ${appleBlue}7A 100%)`,
                          backdropFilter: `blur(${style.blurPx}px) saturate(200%)`,
                          WebkitBackdropFilter: `blur(${style.blurPx}px) saturate(200%)`,
                          border: '1px solid rgba(255, 255, 255, 0.48)',
                          boxShadow: `0 22px 50px ${appleBlue}40, inset 0 1px 0 rgba(255, 255, 255, 0.45)`,
                          color: '#FFFFFF',
                        }
                      : glassStyle),
                    width: cardWidths[idx],
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    borderRadius: isPortrait
                      ? Math.max(28, style.borderRadius + 8)
                      : style.borderRadius,
                    padding: `${isPortrait ? 34 : 22}px ${cardPadX}px`,
                    fontSize: cardFontSize,
                    fontWeight: style.fontWeight || 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    opacity: enterOpacity * trailOpacity,
                    transform: `translate3d(${enterX}px, ${trailY}px, 0) scale(${enterScale * focusScale})`,
                  }}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 1 (76 - 188f): Upload File + Animated Progress Bar
  // ============================================================================
  if (sceneId === 'sse-1-upload') {
    const cardSp = spring({ frame: tFrame - 76, fps: 30, config: springCfg });
    const uploadPct = Math.round(
      interpolate(tFrame, [84, 172], [0, 100], {
        easing: Easing.bezier(0.25, 0.85, 0.35, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const done = uploadPct >= 100;
    const statusGlow = interpolate(tFrame, [170, 184], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 140px',
        }}
      >
        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 920 : 980,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '52px 44px' : '48px 56px',
            display: 'flex',
            flexDirection: 'column',
            gap: isPortrait ? 32 : 28,
            opacity: interpolate(cardSp, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(cardSp, [0, 1], [48, 0])}px) scale(${interpolate(cardSp, [0, 1], [0.92, 1])})`,
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <div
                style={{
                  ...innerGlassStyle,
                  width: isPortrait ? 92 : 80,
                  height: isPortrait ? 92 : 80,
                  borderRadius: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${done ? emerald : appleBlue}`,
                }}
              >
                <UploadCloudIcon
                  size={isPortrait ? 50 : 44}
                  color={done ? emerald : appleBlue}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{
                    fontSize: isPortrait ? 40 : style.fontSize * 0.72 || 38,
                    fontWeight: style.fontWeight || 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.15,
                  }}
                >
                  {content.text || 'Upload File ke Sistem'}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: isPortrait ? 22 : 20,
                    fontWeight: 500,
                    color: textSecondary,
                  }}
                >
                  {content.subtext || 'video-dataset.mp4 · 128 MB'}
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 52 : 48,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: done ? emerald : appleBlue,
                textShadow: `0 0 24px ${done ? emerald : appleBlue}55`,
                flexShrink: 0,
              }}
            >
              {uploadPct}%
            </div>
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              position: 'relative',
              height: isPortrait ? 30 : 24,
              borderRadius: 99,
              backgroundColor: appleDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(15, 23, 42, 0.1)',
              overflow: 'hidden',
              border: appleDarkMode
                ? '1px solid rgba(255, 255, 255, 0.14)'
                : '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <div
              style={{
                width: `${uploadPct}%`,
                height: '100%',
                borderRadius: 99,
                background: done
                  ? `linear-gradient(90deg, ${appleBlue} 0%, ${emerald} 100%)`
                  : `linear-gradient(90deg, ${appleBlue} 0%, ${cyan} 100%)`,
                boxShadow: `0 0 24px ${done ? emerald : appleBlue}88`,
              }}
            />
          </div>

          {/* Status Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isPortrait ? 22 : 19,
              fontWeight: 600,
              color: done ? emerald : textSecondary,
            }}
          >
            <span>
              {done
                ? '✓ File berhasil diterima sistem'
                : 'Mengirim chunk data ke server...'}
            </span>
            <span
              style={{
                opacity: 0.7 + statusGlow * 0.3,
                color: done ? emerald : appleBlue,
              }}
            >
              {content.badgeLabel || 'UPLOAD PROGRESS'}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 2 (182 - 334f): "kita bisa membuat fitur ini dengan menggunakan axios maupun xmlhttprequest"
  // ============================================================================
  if (sceneId === 'sse-2-axios-xhr') {
    const headerSp = spring({ frame: tFrame - 185, fps: 30, config: springCfg });
    const axiosSp = spring({ frame: tFrame - 236, fps: 30, config: springCfg });
    const orSp = spring({ frame: tFrame - 274, fps: 30, config: springCfg });
    const xhrSp = spring({ frame: tFrame - 284, fps: 30, config: springCfg });

    const axiosPct = Math.round(
      interpolate(tFrame, [242, 304], [0, 100], {
        easing: Easing.bezier(0.22, 0.85, 0.35, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const xhrPct = Math.round(
      interpolate(tFrame, [290, 328], [0, 100], {
        easing: Easing.bezier(0.22, 0.85, 0.35, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );

    const axiosFocus =
      tFrame < 284
        ? interpolate(axiosSp, [0, 1], [0.94, 1.02], {
            extrapolateRight: 'clamp',
          })
        : interpolate(tFrame, [284, 296], [1.02, 0.97], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
    const xhrFocus =
      tFrame >= 284
        ? interpolate(xhrSp, [0, 1], [0.94, 1.02], {
            extrapolateRight: 'clamp',
          })
        : 0.96;

    const cardWidth = isPortrait ? 860 : 540;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 76px',
          gap: isPortrait ? 26 : 30,
        }}
      >
        {/* Top Header + Client Upload Pill */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: interpolate(headerSp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(headerSp, [0, 1], [28, 0])}px)`,
          }}
        >
          <div
            style={{
              ...glassStyle,
              borderRadius: 999,
              padding: '8px 22px',
              border: `1px solid ${appleBlue}66`,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isPortrait ? 19 : 16,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: cyan,
            }}
          >
            {content.badgeLabel || 'CLIENT-SIDE API'}
          </div>
          <div
            style={{
              fontSize: isPortrait ? 48 : 44,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              textShadow: openShadow,
              textAlign: 'center',
            }}
          >
            {content.text || 'Buat Fitur Upload Progress'}
          </div>
        </div>

        {/* Cards Row: Axios + "atau" + XMLHttpRequest */}
        <div
          style={{
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 18 : 22,
            width: '100%',
          }}
        >
          {/* Card 1: Axios (pops at 236f) */}
          <div
            style={{
              ...glassStyle,
              width: cardWidth,
              borderRadius: style.borderRadius,
              padding: isPortrait ? '34px 36px' : '32px 34px',
              border: `1.5px solid ${tFrame < 286 ? appleBlue : `${appleBlue}88`}`,
              boxShadow:
                tFrame < 286
                  ? `0 26px 64px ${appleBlue}36`
                  : `0 16px 38px ${appleBlue}18`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: interpolate(axiosSp, [0, 0.35], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(axiosSp, [0, 1], [44, 0])}px) scale(${axiosFocus})`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    ...innerGlassStyle,
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    border: `1px solid ${appleBlue}77`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M17.5 4L7 18H15.5L14.5 28L25 14H16.5L17.5 4Z"
                      stroke={appleBlue}
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontSize: isPortrait ? 40 : 36,
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      color: textPrimary,
                      lineHeight: 1.05,
                    }}
                  >
                    Axios
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      color: textSecondary,
                    }}
                  >
                    Promise HTTP Client
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 24,
                  fontWeight: 800,
                  color: axiosPct >= 100 ? emerald : appleBlue,
                }}
              >
                {axiosPct}%
              </span>
            </div>

            <div
              style={{
                ...innerGlassStyle,
                borderRadius: 16,
                padding: '14px 18px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 19 : 17,
                lineHeight: 1.5,
                fontWeight: 600,
                color: cyan,
              }}
            >
              <div>axios.post(&apos;/upload&apos;, file, &#123;</div>
              <div style={{ paddingLeft: 16, color: textPrimary }}>
                onUploadProgress: (e) =&gt; ...
              </div>
              <div>&#125;)</div>
            </div>

            <div
              style={{
                height: 12,
                borderRadius: 99,
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${axiosPct}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${appleBlue}, ${cyan})`,
                  boxShadow: `0 0 16px ${appleBlue}88`,
                }}
              />
            </div>
          </div>

          {/* Middle Connector Pill: "atau" (274f) */}
          <div
            style={{
              ...glassStyle,
              borderRadius: 999,
              padding: isPortrait ? '10px 26px' : '12px 20px',
              border: `1px solid ${appleDarkMode ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.14)'}`,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              fontWeight: 800,
              color: textSecondary,
              flexShrink: 0,
              opacity: interpolate(orSp, [0, 0.45], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `scale(${interpolate(orSp, [0, 1], [0.7, 1])})`,
            }}
          >
            ATAU
          </div>

          {/* Card 2: XMLHttpRequest (pops at 284f) */}
          <div
            style={{
              ...glassStyle,
              width: cardWidth,
              borderRadius: style.borderRadius,
              padding: isPortrait ? '34px 36px' : '32px 34px',
              border: `1.5px solid ${tFrame >= 284 ? emerald : `${emerald}77`}`,
              boxShadow:
                tFrame >= 284
                  ? `0 26px 64px ${emerald}36`
                  : `0 16px 38px ${emerald}18`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: interpolate(xhrSp, [0, 0.35], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(xhrSp, [0, 1], [44, 0])}px) scale(${xhrFocus})`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    ...innerGlassStyle,
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    border: `1px solid ${emerald}77`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M11 10L5 16L11 22M21 10L27 16L21 22M18 7L14 25"
                      stroke={emerald}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontSize: isPortrait ? 38 : 33,
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      color: textPrimary,
                      lineHeight: 1.05,
                    }}
                  >
                    XMLHttpRequest
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      color: textSecondary,
                    }}
                  >
                    Native Browser API
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 24,
                  fontWeight: 800,
                  color: emerald,
                }}
              >
                {xhrPct}%
              </span>
            </div>

            <div
              style={{
                ...innerGlassStyle,
                borderRadius: 16,
                padding: '14px 18px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 19 : 17,
                lineHeight: 1.5,
                fontWeight: 600,
                color: emerald,
              }}
            >
              <div>const xhr = new XMLHttpRequest();</div>
              <div style={{ color: textPrimary }}>
                xhr.upload.onprogress = (e) =&gt; ...
              </div>
              <div>xhr.send(formData);</div>
            </div>

            <div
              style={{
                height: 12,
                borderRadius: 99,
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${xhrPct}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${emerald}, #2DD4BF)`,
                  boxShadow: `0 0 16px ${emerald}88`,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 3 (326 - 485f): Realtime Question Terminal (Server -> Client)
  // ============================================================================
  if (sceneId === 'sse-3-question') {
    const termSp = spring({ frame: tFrame - 326, fps: 30, config: springCfg });
    const fullText =
      content.text ||
      'bagaimana jika server mengirim data progress bar secara realtime ke client?';
    const typedChars = Math.floor(
      interpolate(tFrame, [328, 436], [0, fullText.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const typedText = fullText.slice(0, typedChars);
    const cursorOn =
      tFrame < 436 ? true : Math.floor((tFrame - 436) / 10) % 2 === 0;
    const underlineProgress = interpolate(tFrame, [425, 448], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const termFontSize = isPortrait
      ? Math.max(36, Math.round(style.fontSize * 0.88))
      : style.fontSize || 46;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 140px',
        }}
      >
        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 940 : 1220,
            borderRadius: style.borderRadius,
            overflow: 'hidden',
            opacity: interpolate(termSp, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(termSp, [0, 1], [44, 0])}px) scale(${interpolate(termSp, [0, 1], [0.93, 1])})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isPortrait ? '24px 30px' : '22px 32px',
              background: appleDarkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.24)',
              borderBottom: appleDarkMode
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#FF5F57' }} />
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#FEBC2E' }} />
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#28C840' }} />
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 22 : 20,
                fontWeight: 600,
                color: textSecondary,
              }}
            >
              {content.badgeLabel || 'Terminal — zsh'}
            </div>
            <div style={{ width: 70 }} />
          </div>

          <div
            style={{
              padding: isPortrait ? '52px 42px 60px' : '58px 56px 66px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: isPortrait ? 340 : 290,
              justifyContent: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 20 : 19,
                fontWeight: 600,
                color: emerald,
                opacity: 0.9,
              }}
            >
              {content.subtext || '~/upload-stream on main'}
            </div>

            <div
              style={{
                fontFamily: `${style.fontFamily}, JetBrains Mono, monospace`,
                fontSize: termFontSize,
                fontWeight: style.fontWeight || 600,
                lineHeight: 1.46,
                letterSpacing: '-0.028em',
                color: textPrimary,
                textShadow: openShadow,
              }}
            >
              <span
                style={{
                  color: emerald,
                  marginRight: 16,
                  fontWeight: 800,
                }}
              >
                ❯
              </span>
              {typedText.split(/(\s+)/).map((part, idx) => {
                if (!part) return null;
                const lower = part.toLowerCase().replace(/[?.,!]/g, '');
                const hl = (content.highlightWord || 'realtime').toLowerCase();
                if (lower === 'server' || lower === 'client') {
                  return (
                    <span
                      key={`t-${idx}`}
                      style={{
                        color: cyan,
                        fontWeight: 700,
                        textShadow: `0 0 20px ${cyan}55`,
                      }}
                    >
                      {part}
                    </span>
                  );
                }
                if (lower === hl || lower === 'realtime') {
                  return (
                    <span
                      key={`t-${idx}`}
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        color: emerald,
                        fontWeight: 800,
                      }}
                    >
                      {part}
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 2,
                          height: 4,
                          borderRadius: 99,
                          background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
                          transformOrigin: 'left center',
                          transform: `scaleX(${underlineProgress})`,
                        }}
                      />
                    </span>
                  );
                }
                return <span key={`t-${idx}`}>{part}</span>;
              })}
              <span
                style={{
                  display: 'inline-block',
                  width: isPortrait ? 14 : 16,
                  height: isPortrait ? 44 : 48,
                  background: `linear-gradient(180deg, ${appleBlue} 0%, ${emerald} 100%)`,
                  marginLeft: 8,
                  verticalAlign: 'text-bottom',
                  borderRadius: 4,
                  opacity: cursorOn ? 0.96 : 0,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 4a (480 - 592f): Perkenalan SSE (Server-Sent Events)
  // ============================================================================
  if (sceneId === 'sse-4a-intro') {
    const heroSp = spring({
      frame: tFrame - 483,
      fps: 30,
      config: {
        damping: Math.max(12, animation.springDamping),
        stiffness: Math.max(170, animation.springStiffness * 1.35),
        mass: 0.78,
      },
    });
    const expandSp = spring({
      frame: tFrame - 536,
      fps: 30,
      config: springCfg,
    });
    const chipSp = spring({
      frame: tFrame - 488,
      fps: 30,
      config: springCfg,
    });
    const pulseRing = ((Math.max(0, tFrame - 486)) % 36) / 36;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 120px',
          gap: isPortrait ? 32 : 28,
        }}
      >
        {/* Top Protocol Pill */}
        <div
          style={{
            ...glassStyle,
            borderRadius: 999,
            padding: isPortrait ? '14px 30px' : '12px 26px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            border: `1px solid ${appleBlue}66`,
            opacity: interpolate(chipSp, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(chipSp, [0, 1], [-22, 0])}px) scale(${interpolate(chipSp, [0, 1], [0.9, 1])})`,
          }}
        >
          <SseStreamIcon
            size={isPortrait ? 36 : 30}
            color={appleBlue}
            accentColor={emerald}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isPortrait ? 22 : 18,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: textPrimary,
            }}
          >
            {content.badgeLabel || 'EVENT STREAM · HTTP'}
          </span>
        </div>

        {/* Center Hero Glass Emblem: SSE */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: interpolate(heroSp, [0, 0.35], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(heroSp, [0, 1], [0.76, 1])}) translateY(${interpolate(heroSp, [0, 1], [28, 0])}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: isPortrait ? -18 : -14,
              borderRadius: isPortrait ? 48 : 42,
              border: `2px solid ${appleBlue}`,
              transform: `scale(${interpolate(pulseRing, [0, 1], [0.97, 1.12])})`,
              opacity: interpolate(pulseRing, [0, 0.25, 1], [0.55, 0.28, 0]),
            }}
          />
          <div
            style={{
              ...glassStyle,
              background: appleDarkMode
                ? `linear-gradient(145deg, ${appleBlue}52 0%, rgba(28, 28, 34, 0.62) 100%)`
                : `linear-gradient(145deg, ${appleBlue}33 0%, rgba(255, 255, 255, 0.72) 100%)`,
              border: `1.5px solid ${appleBlue}99`,
              boxShadow: `0 28px 70px ${appleBlue}38, inset 0 1px 0 rgba(255, 255, 255, 0.42)`,
              borderRadius: isPortrait ? 40 : 34,
              padding: isPortrait ? '34px 74px' : '26px 68px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: isPortrait ? 132 : Math.max(108, style.fontSize + 52),
                fontWeight: 900,
                letterSpacing: '-0.05em',
                lineHeight: 0.95,
                color: '#FFFFFF',
                textShadow: `0 8px 34px ${appleBlue}88`,
              }}
            >
              {content.text || 'SSE'}
            </span>
          </div>
        </div>

        {/* Expanded Name Reveal on Beat 2 (536f): Server-Sent Events */}
        <div
          style={{
            ...glassStyle,
            borderRadius: isPortrait ? 26 : 22,
            padding: isPortrait ? '22px 44px' : '18px 38px',
            border: `1px solid ${emerald}66`,
            opacity: interpolate(expandSp, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(expandSp, [0, 1], [28, 0])}px) scale(${interpolate(expandSp, [0, 1], [0.92, 1])})`,
          }}
        >
          <span
            style={{
              fontSize: isPortrait ? 44 : 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: textPrimary,
            }}
          >
            {content.subtext || 'Server-Sent Events'}
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 4b (584 - 758f): Protokol SSE (1 Arah) Server -> Client Stream
  // ============================================================================
  if (sceneId === 'sse-4-protocol') {
    const heroSp = spring({ frame: tFrame - 586, fps: 30, config: springCfg });
    const lineProg = interpolate(tFrame, [602, 642], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const dotPhase = ((Math.max(0, tFrame - 624)) % 30) / 30;
    const dotPhase2 = ((Math.max(0, tFrame - 639)) % 30) / 30;
    const pulsePhase = ((Math.max(0, tFrame - 590)) % 30) / 30;
    const liveVal = Math.round(
      interpolate(tFrame, [618, 745], [15, 100], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );

    const boxSize = isPortrait ? 186 : 168;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 100px',
          gap: isPortrait ? 40 : 38,
        }}
      >
        {/* Top Hero Title (optional, hidden when blank) */}
        {content.text.trim() || content.subtext.trim() ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              opacity: interpolate(heroSp, [0, 0.45], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(heroSp, [0, 1], [32, 0])}px)`,
            }}
          >
            {content.text.trim() ? (
              <div
                style={{
                  fontSize: isPortrait ? 68 : style.fontSize + 18 || 72,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                  textShadow: openShadow,
                  textAlign: 'center',
                }}
              >
                {content.text}
              </div>
            ) : null}
            {content.subtext.trim() ? (
              <div
                style={{
                  ...glassStyle,
                  borderRadius: 16,
                  padding: '10px 26px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: isPortrait ? 24 : 22,
                  fontWeight: 700,
                  color: emerald,
                  border: `1px solid ${emerald}66`,
                }}
              >
                {content.subtext}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 1-Way Conduit: Server -> EventSource Client */}
        <div
          style={{
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 26 : 32,
            width: '100%',
            maxWidth: 1280,
          }}
        >
          {/* Server Node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              opacity: interpolate(heroSp, [0, 0.5], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <div
              style={{
                ...glassStyle,
                width: boxSize,
                height: boxSize,
                borderRadius: style.borderRadius,
                border: `1.5px solid ${appleBlue}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ServerRackIcon
                size={isPortrait ? 92 : 84}
                color={textPrimary}
                accentColor={emerald}
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, textShadow: openShadow }}>
              Server
            </div>
          </div>

          {/* 1-Way Stream Pipe */}
          <div
            style={{
              position: 'relative',
              width: isPortrait ? 10 : 380,
              height: isPortrait ? 160 : 10,
              borderRadius: 99,
              backgroundColor: 'rgba(148, 163, 184, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 99,
                background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
                transformOrigin: isPortrait ? 'top center' : 'left center',
                transform: isPortrait
                  ? `scaleY(${lineProg})`
                  : `scaleX(${lineProg})`,
              }}
            />
            {lineProg > 0.85 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: `0 0 22px ${emerald}`,
                    left: isPortrait ? -6 : `${dotPhase * 100}%`,
                    top: isPortrait ? `${dotPhase * 100}%` : -6,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: emerald,
                    boxShadow: `0 0 18px ${appleBlue}`,
                    left: isPortrait ? -4 : `${dotPhase2 * 100}%`,
                    top: isPortrait ? `${dotPhase2 * 100}%` : -4,
                  }}
                />
              </>
            )}

            {!isPortrait && lineProg > 0.7 && (
              <div
                style={{
                  ...glassStyle,
                  position: 'absolute',
                  top: -58,
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 19,
                  fontWeight: 700,
                  color: textPrimary,
                  whiteSpace: 'nowrap',
                }}
              >
                data: {`{"progress": ${liveVal}}`} →
              </div>
            )}
          </div>

          {/* Client Node */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              opacity: interpolate(heroSp, [0, 0.5], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <div style={{ position: 'relative', width: boxSize, height: boxSize }}>
              <div
                style={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: style.borderRadius + 8,
                  border: `2.5px solid ${emerald}`,
                  transform: `scale(${interpolate(pulsePhase, [0, 1], [0.96, 1.15])})`,
                  opacity: interpolate(pulsePhase, [0, 0.25, 1], [0.55, 0.3, 0]),
                }}
              />
              <div
                style={{
                  ...glassStyle,
                  width: '100%',
                  height: '100%',
                  borderRadius: style.borderRadius,
                  border: `1.5px solid ${emerald}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <SseStreamIcon
                  size={isPortrait ? 78 : 70}
                  color={appleBlue}
                  accentColor={emerald}
                />
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 22,
                    fontWeight: 800,
                    color: emerald,
                  }}
                >
                  {liveVal}%
                </span>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, textShadow: openShadow }}>
              Client (EventSource)
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 5 (750 - 995f): WebSocket Only — Komunikasi 2 Arah
  // ============================================================================
  if (sceneId === 'sse-5-vs-ws') {
    const titleSp = spring({ frame: tFrame - 754, fps: 30, config: springCfg });
    const cardSp = spring({ frame: tFrame - 774, fps: 30, config: springCfg });
    const badgeSp = spring({ frame: tFrame - 825, fps: 30, config: springCfg });
    const lane1Sp = spring({ frame: tFrame - 895, fps: 30, config: springCfg });
    const lane2Sp = spring({ frame: tFrame - 935, fps: 30, config: springCfg });

    const arrowShift = Math.sin((tFrame - 750) * 0.26) * 5;
    const sToCDot = ((Math.max(0, tFrame - 895)) % 28) / 28;
    const cToSDot = ((Math.max(0, tFrame - 935)) % 28) / 28;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 100px',
          gap: isPortrait ? 32 : 34,
        }}
      >
        {/* Question Headline */}
        <div
          style={{
            fontSize: isPortrait ? 48 : 44,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textShadow: openShadow,
            textAlign: 'center',
            opacity: interpolate(titleSp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(titleSp, [0, 1], [28, 0])}px)`,
          }}
        >
          {content.text || 'Kenapa Tidak Pakai WebSocket?'}
        </div>

        {/* Single Centered WebSocket Glass Card */}
        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 900 : 1020,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '44px 36px' : '42px 52px',
            border: `1.5px solid ${amber}99`,
            boxShadow: `0 26px 64px ${amber}22`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isPortrait ? 28 : 26,
            opacity: interpolate(cardSp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(cardSp, [0, 1], [36, 0])}px) scale(${interpolate(cardSp, [0, 1], [0.94, 1])})`,
          }}
        >
          {/* Header Row: WebSocket Icon + Name + 2-Way Badge */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  ...innerGlassStyle,
                  width: isPortrait ? 84 : 74,
                  height: isPortrait ? 84 : 74,
                  borderRadius: 22,
                  border: `1px solid ${amber}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WebSocketIcon
                  size={isPortrait ? 56 : 50}
                  color={amber}
                  accentColor={appleBlue}
                  shift={arrowShift}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: isPortrait ? 40 : 36, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  WebSocket
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: isPortrait ? 19 : 17,
                    fontWeight: 600,
                    color: textSecondary,
                  }}
                >
                  {content.subtext || 'Server ⇄ Client (Komunikasi 2 Arah)'}
                </span>
              </div>
            </div>

            <div
              style={{
                ...innerGlassStyle,
                borderRadius: 999,
                padding: '10px 22px',
                border: `1px solid ${amber}88`,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 20 : 18,
                fontWeight: 800,
                color: amber,
                opacity: interpolate(badgeSp, [0, 0.45], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `scale(${interpolate(badgeSp, [0, 1], [0.9, 1])})`,
              }}
            >
              {content.badgeLabel || 'FULL-DUPLEX · 2 ARAH'}
            </div>
          </div>

          {/* 2-Way Channel Diagram: Server ⇄ Client */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isPortrait ? 22 : 28,
            }}
          >
            {/* Server Node */}
            <div
              style={{
                ...innerGlassStyle,
                borderRadius: 22,
                padding: isPortrait ? '22px 30px' : '22px 28px',
                border: `1.5px solid ${appleBlue}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minWidth: isPortrait ? 260 : 210,
                justifyContent: 'center',
              }}
            >
              <ServerRackIcon size={44} color={textPrimary} accentColor={amber} />
              <span style={{ fontSize: 28, fontWeight: 800 }}>Server</span>
            </div>

            {/* Dual Bidirectional Lanes */}
            <div
              style={{
                flex: 1,
                width: isPortrait ? '100%' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Lane 1: Server -> Client (895f) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  opacity: interpolate(lane1Sp, [0, 0.45], [0.25, 1], {
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: isPortrait ? 19 : 17,
                    fontWeight: 700,
                    color: appleBlue,
                  }}
                >
                  <span>Server → Client</span>
                  <span>PUSH</span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    height: 10,
                    borderRadius: 99,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)',
                  }}
                >
                  <div
                    style={{
                      width: `${interpolate(lane1Sp, [0, 1], [15, 100])}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${appleBlue}, ${cyan})`,
                    }}
                  />
                  {tFrame >= 895 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        left: `${sToCDot * 100}%`,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        boxShadow: `0 0 18px ${appleBlue}`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Lane 2: Client -> Server (935f) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  opacity: interpolate(lane2Sp, [0, 0.45], [0.25, 1], {
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: isPortrait ? 19 : 17,
                    fontWeight: 700,
                    color: amber,
                  }}
                >
                  <span>SEND</span>
                  <span>← Client ke Server</span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    height: 10,
                    borderRadius: 99,
                    backgroundColor: 'rgba(148, 163, 184, 0.22)',
                  }}
                >
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: `${interpolate(lane2Sp, [0, 1], [15, 100])}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: `linear-gradient(270deg, ${amber}, #FB923C)`,
                    }}
                  />
                  {tFrame >= 935 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        left: `${(1 - cToSDot) * 100}%`,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        boxShadow: `0 0 18px ${amber}`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Client Node */}
            <div
              style={{
                ...innerGlassStyle,
                borderRadius: 22,
                padding: isPortrait ? '22px 30px' : '22px 28px',
                border: `1.5px solid ${amber}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minWidth: isPortrait ? 260 : 210,
                justifyContent: 'center',
              }}
            >
              <ReactIcon size={44} color={cyan} rotationDeg={(tFrame - 750) * 1.4} />
              <span style={{ fontSize: 28, fontWeight: 800 }}>Client</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 6a (990 - 1104f): "untuk fitur seperti ini, kita hanya perlu komunikasi 1 arah saja"
  // ============================================================================
  if (sceneId === 'sse-6a-intro') {
    const pillSp = spring({ frame: tFrame - 993, fps: 30, config: springCfg });
    const heroSp = spring({
      frame: tFrame - 1002,
      fps: 30,
      config: {
        damping: Math.max(12, animation.springDamping),
        stiffness: Math.max(165, animation.springStiffness * 1.3),
        mass: 0.78,
      },
    });
    const arrowSp = spring({ frame: tFrame - 1038, fps: 30, config: springCfg });
    const dotFlow = ((Math.max(0, tFrame - 1042)) % 24) / 24;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 100px',
          gap: isPortrait ? 30 : 28,
        }}
      >
        {/* Top Tag Pill */}
        <div
          style={{
            ...glassStyle,
            borderRadius: 999,
            padding: isPortrait ? '12px 28px' : '10px 24px',
            border: `1px solid ${emerald}77`,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: isPortrait ? 20 : 17,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: emerald,
            opacity: interpolate(pillSp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(pillSp, [0, 1], [-20, 0])}px)`,
          }}
        >
          {content.badgeLabel || 'SOLUSI EFISIEN · SSE'}
        </div>

        {/* Main Apple Glass Card */}
        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 900 : 980,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '46px 40px' : '42px 56px',
            border: `1.5px solid ${emerald}99`,
            boxShadow: `0 28px 72px ${emerald}28`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isPortrait ? 24 : 22,
            opacity: interpolate(heroSp, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(heroSp, [0, 1], [34, 0])}px) scale(${interpolate(heroSp, [0, 1], [0.9, 1])})`,
          }}
        >
          <div
            style={{
              fontSize: isPortrait ? 72 : Math.max(60, style.fontSize + 6),
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              textAlign: 'center',
              textShadow: openShadow,
            }}
          >
            {content.text || 'Komunikasi 1 Arah'}
          </div>

          <div
            style={{
              fontSize: isPortrait ? 30 : 26,
              fontWeight: 600,
              color: textSecondary,
              textAlign: 'center',
            }}
          >
            {content.subtext || 'Untuk fitur seperti ini, cukup 1 arah saja'}
          </div>

          {/* 1-Way Visual Indicator Strip */}
          <div
            style={{
              ...innerGlassStyle,
              width: '100%',
              maxWidth: isPortrait ? 760 : 680,
              borderRadius: 20,
              padding: isPortrait ? '20px 26px' : '16px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              border: `1px solid ${appleBlue}55`,
              opacity: interpolate(arrowSp, [0, 0.45], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `scale(${interpolate(arrowSp, [0, 1], [0.92, 1])})`,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 24 : 21,
                fontWeight: 800,
                color: appleBlue,
              }}
            >
              Server
            </span>

            <div
              style={{
                position: 'relative',
                flex: 1,
                height: 8,
                borderRadius: 99,
                backgroundColor: 'rgba(148, 163, 184, 0.22)',
              }}
            >
              <div
                style={{
                  width: `${interpolate(arrowSp, [0, 1], [10, 100])}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
                }}
              />
              {tFrame >= 1042 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: `${dotFlow * 100}%`,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: `0 0 18px ${emerald}`,
                  }}
                />
              )}
            </div>

            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 24 : 21,
                fontWeight: 800,
                color: emerald,
              }}
            >
              Client →
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 6b (1098 - 1190f): "yaitu dari server mengirimkan progress bar nya ke client"
  // ============================================================================
  if (sceneId === 'sse-6-one-way') {
    const sp = spring({ frame: tFrame - 1100, fps: 30, config: springCfg });
    const progressPct = Math.round(
      interpolate(tFrame, [1114, 1180], [0, 100], {
        easing: Easing.bezier(0.22, 0.85, 0.35, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const packetDot = ((Math.max(0, tFrame - 1106)) % 22) / 22;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 100px',
          gap: isPortrait ? 34 : 36,
        }}
      >
        <div
          style={{
            fontSize: isPortrait ? 46 : 44,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textShadow: openShadow,
            textAlign: 'center',
            opacity: interpolate(sp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(sp, [0, 1], [24, 0])}px)`,
          }}
        >
          {content.text || 'Server Kirim Progress ke Client'}
        </div>

        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 900 : 1200,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '44px 38px' : '44px 52px',
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isPortrait ? 32 : 36,
            opacity: interpolate(sp, [0, 0.45], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(sp, [0, 1], [0.92, 1])})`,
          }}
        >
          {/* Server Box */}
          <div
            style={{
              ...innerGlassStyle,
              borderRadius: 24,
              padding: '26px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              border: `1.5px solid ${appleBlue}`,
              flexShrink: 0,
            }}
          >
            <NodeJsIcon size={58} color={emerald} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Server</div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  color: textSecondary,
                }}
              >
                Kirim Progress
              </div>
            </div>
          </div>

          {/* One-Way Animated Channel */}
          <div
            style={{
              position: 'relative',
              flex: isPortrait ? undefined : 1,
              width: isPortrait ? 10 : '100%',
              height: isPortrait ? 110 : 8,
              borderRadius: 99,
              background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: `0 0 18px ${emerald}`,
                left: isPortrait ? -5 : `${packetDot * 100}%`,
                top: isPortrait ? `${packetDot * 100}%` : -6,
              }}
            />
            {!isPortrait && (
              <div
                style={{
                  ...glassStyle,
                  position: 'absolute',
                  top: -54,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '6px 16px',
                  borderRadius: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  color: emerald,
                  whiteSpace: 'nowrap',
                }}
              >
                progress: {progressPct}% →
              </div>
            )}
          </div>

          {/* Client Progress Box */}
          <div
            style={{
              ...innerGlassStyle,
              borderRadius: 24,
              padding: '26px 32px',
              width: isPortrait ? '100%' : 400,
              border: `1.5px solid ${emerald}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ReactIcon
                  size={40}
                  color={cyan}
                  rotationDeg={(tFrame - 1098) * 1.6}
                />
                <span style={{ fontSize: 26, fontWeight: 800 }}>Client UI</span>
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 28,
                  fontWeight: 800,
                  color: emerald,
                }}
              >
                {progressPct}%
              </span>
            </div>
            <div
              style={{
                height: 16,
                borderRadius: 99,
                backgroundColor: 'rgba(148, 163, 184, 0.22)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 7 (1184 - 1455f): Backend Stepped Progress (1184-1347f) + Closing Prompt (1348-1455f)
  // ============================================================================
  const s1 = spring({ frame: tFrame - 1190, fps: 30, config: springCfg });
  const s2 = spring({ frame: tFrame - 1235, fps: 30, config: springCfg });
  const s3 = spring({ frame: tFrame - 1280, fps: 30, config: springCfg });
  const steppedProgress =
    tFrame < 1230 ? 25 : tFrame < 1275 ? 50 : tFrame < 1315 ? 75 : 100;

  const pipelineFade = interpolate(tFrame, [1334, 1348], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pipelineScale = interpolate(tFrame, [1334, 1348], [1, 0.94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const promptQSp = spring({ frame: tFrame - 1348, fps: 30, config: springCfg });
  const promptBoxSp = spring({ frame: tFrame - 1388, fps: 30, config: springCfg });
  const promptCmdText = content.subtext || 'Silahkan prompt aja dulu';
  const typedLen = Math.round(
    interpolate(tFrame, [1394, 1432], [0, promptCmdText.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const showCursor =
    tFrame >= 1390 && (tFrame < 1434 || Math.floor((tFrame - 1390) / 10) % 2 === 0);

  return (
    <AbsoluteFill
      style={{
        ...wrapStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isPortrait ? '64px 48px' : '0 84px',
      }}
    >
      {/* Part A (1184 - 1347f): 3-Step Pipeline */}
      {tFrame < 1350 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isPortrait ? '64px 48px' : '0 84px',
            opacity: pipelineFade,
            transform: `scale(${pipelineScale})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isPortrait ? 20 : 28,
              width: '100%',
              maxWidth: 1460,
            }}
          >
            {/* Step 1: Server Terima File */}
            <div
              style={{
                ...glassStyle,
                width: isPortrait ? 860 : 380,
                borderRadius: style.borderRadius,
                padding: '28px 32px',
                border: `1.5px solid ${appleBlue}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                opacity: interpolate(s1, [0, 0.45], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `translateY(${interpolate(s1, [0, 1], [32, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <UploadCloudIcon size={40} color={appleBlue} />
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    color: appleBlue,
                  }}
                >
                  01 · TERIMA FILE
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                Server Terima Upload
              </div>
            </div>

            {/* Step 2: Backend Kirim Bertahap */}
            <div
              style={{
                ...glassStyle,
                width: isPortrait ? 860 : 410,
                borderRadius: style.borderRadius,
                padding: '28px 32px',
                border: `1.5px solid ${emerald}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                opacity: interpolate(s2, [0, 0.45], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `translateY(${interpolate(s2, [0, 1], [32, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <NodeJsIcon size={40} color={emerald} />
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    color: emerald,
                  }}
                >
                  02 · KIRIM BERTAHAP
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                Backend Stream SSE
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  color: textSecondary,
                }}
              >
                25% → 50% → 75% → 100%
              </div>
            </div>

            {/* Step 3: Front-End Live Progress */}
            <div
              style={{
                ...glassStyle,
                width: isPortrait ? 860 : 410,
                borderRadius: style.borderRadius,
                padding: '28px 32px',
                border: `1.5px solid ${cyan}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                opacity: interpolate(s3, [0, 0.45], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `translateY(${interpolate(s3, [0, 1], [32, 0])}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ReactIcon
                    size={38}
                    color={cyan}
                    rotationDeg={(tFrame - 1184) * 1.5}
                  />
                  <span style={{ fontSize: 28, fontWeight: 800 }}>
                    Front-End UI
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 26,
                    fontWeight: 800,
                    color: steppedProgress === 100 ? emerald : cyan,
                  }}
                >
                  {steppedProgress}%
                </span>
              </div>
              <div
                style={{
                  height: 14,
                  borderRadius: 99,
                  backgroundColor: 'rgba(148, 163, 184, 0.22)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${steppedProgress}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${appleBlue}, ${emerald})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part B (1348 - 1455f): "bagaimana implementasinya..? silahkan prompt aja dulu" */}
      {tFrame >= 1346 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 30 : 28,
            width: '100%',
            maxWidth: isPortrait ? 900 : 980,
          }}
        >
          <div
            style={{
              fontSize: isPortrait ? 60 : 56,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              textShadow: openShadow,
              textAlign: 'center',
              opacity: interpolate(promptQSp, [0, 0.4], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(promptQSp, [0, 1], [28, 0])}px) scale(${interpolate(promptQSp, [0, 1], [0.94, 1])})`,
            }}
          >
            {content.text || 'Bagaimana Implementasinya?'}
          </div>

          <div
            style={{
              ...glassStyle,
              width: '100%',
              maxWidth: isPortrait ? 840 : 760,
              borderRadius: isPortrait ? 28 : 24,
              padding: isPortrait ? '28px 34px' : '24px 36px',
              border: `1.5px solid ${emerald}`,
              boxShadow: `0 24px 60px ${emerald}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              opacity: interpolate(promptBoxSp, [0, 0.4], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(promptBoxSp, [0, 1], [26, 0])}px) scale(${interpolate(promptBoxSp, [0, 1], [0.94, 1])})`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: isPortrait ? 30 : 28,
                  fontWeight: 800,
                  color: emerald,
                }}
              >
                ❯
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: isPortrait ? 32 : 30,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: textPrimary,
                }}
              >
                {promptCmdText.slice(0, typedLen)}
                {showCursor && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: isPortrait ? 32 : 30,
                      backgroundColor: appleBlue,
                      marginLeft: 6,
                      verticalAlign: 'middle',
                      borderRadius: 3,
                    }}
                  />
                )}
              </span>
            </div>

            <div
              style={{
                borderRadius: 14,
                padding: '10px 18px',
                background: `linear-gradient(135deg, ${appleBlue}, ${emerald})`,
                color: '#FFFFFF',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 18 : 16,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              PROMPT
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const SseProtocolComposition: React.FC<StudioCompositionProps> = ({
  accentColor,
  appleDarkMode,
  transparentBackground,
  audioVolume,
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
    'sse'
  );

  const tFrame = (frame / fps) * 30;
  const rootBg = transparentBackground
    ? 'transparent'
    : appleDarkMode
      ? '#05070B'
      : '#E9EEF5';
  const textPrimary = appleDarkMode ? '#F5F5F7' : '#1D1D1F';

  const activeClips =
    clips && clips.length > 0
      ? clips
      : createDefaultSseClips(appleDarkMode, accentColor);

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
      {/* Synchronized SSE Voice-Over MP3 */}
      {audioEnabled && audioVolume > 0 && (
        <Audio
          src={audioSrc || '/assets/aistudio/Sequence_01_71ffa7aa.mp3'}
          volume={audioVolume}
        />
      )}

      {/* Synchronized Synthesized SSE Sound FX Track */}
      {soundFxVolume > 0 && sfxUrl && (
        <Audio src={sfxUrl} volume={soundFxVolume} />
      )}

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
          <SseScenePresetRenderer
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

import React from 'react';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import type { ClipIconId, TimelineClip } from '../types';
import {
  HardwareChipIcon,
  MqttIcon,
  NodeJsIcon,
  ReactIcon,
  SensorModuleIcon,
  WebSocketIcon,
} from './TechIcons';

export function renderClipIcon(
  iconId: ClipIconId,
  size: number,
  color: string,
  accentColor: string,
  frame: number
): React.ReactNode {
  switch (iconId) {
    case 'mqtt':
      return <MqttIcon size={size} color={color} />;
    case 'websocket':
      return (
        <WebSocketIcon
          size={size}
          color={color}
          accentColor={accentColor}
          shift={Math.sin(frame * 0.25) * 3.5}
        />
      );
    case 'nodejs':
      return <NodeJsIcon size={size} color={color} />;
    case 'react':
      return (
        <ReactIcon size={size} color={color} rotationDeg={frame * 1.6} />
      );
    case 'hardware':
      return (
        <HardwareChipIcon size={size} color={color} accentColor={accentColor} />
      );
    case 'sensor':
      return (
        <SensorModuleIcon size={size} color={color} accentColor={accentColor} />
      );
  }
}

export function computeClipMotionStyles(
  clip: TimelineClip,
  clipLocalFrame: number,
  fps: number
): {
  opacity: number;
  transform: string;
  filter?: string;
} {
  const {
    enterPreset,
    exitPreset,
    enterFrames,
    exitFrames,
    springDamping,
    springStiffness,
  } = clip.animation;

  const enterDur = Math.max(4, enterFrames || 12);
  const exitDur = Math.max(4, exitFrames || 14);

  const sCfg = {
    damping: Math.max(8, springDamping || 14),
    stiffness: Math.max(50, springStiffness || 140),
  };

  let enterOpacity = 1;
  let enterX = 0;
  let enterY = 0;
  let enterScale = 1;
  let enterBlur = 0;

  if (enterPreset !== 'none') {
    const sp = spring({
      frame: clipLocalFrame,
      fps,
      config: sCfg,
    });
    const lin = interpolate(clipLocalFrame, [0, enterDur], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    if (enterPreset === 'fade') {
      enterOpacity = lin;
    } else if (enterPreset === 'slide-up') {
      enterOpacity = interpolate(lin, [0, 0.5], [0, 1], {
        extrapolateRight: 'clamp',
      });
      enterY = interpolate(sp, [0, 1], [64, 0]);
    } else if (enterPreset === 'slide-left') {
      enterOpacity = interpolate(lin, [0, 0.5], [0, 1], {
        extrapolateRight: 'clamp',
      });
      enterX = interpolate(sp, [0, 1], [140, 0]);
    } else if (enterPreset === 'slide-right') {
      enterOpacity = interpolate(lin, [0, 0.5], [0, 1], {
        extrapolateRight: 'clamp',
      });
      enterX = interpolate(sp, [0, 1], [-140, 0]);
    } else if (enterPreset === 'pop-spring') {
      enterOpacity = interpolate(lin, [0, 0.4], [0, 1], {
        extrapolateRight: 'clamp',
      });
      enterScale = interpolate(sp, [0, 1], [0.76, 1]);
    } else if (enterPreset === 'blur-in') {
      enterOpacity = lin;
      enterBlur = interpolate(lin, [0, 1], [14, 0]);
      enterScale = interpolate(sp, [0, 1], [0.94, 1]);
    }
  }

  let exitOpacity = 1;
  let exitY = 0;
  let exitScale = 1;

  if (exitPreset !== 'none') {
    const exitStart = Math.max(0, clip.durationInFrames - exitDur);
    const outProgress = interpolate(
      clipLocalFrame,
      [exitStart, clip.durationInFrames],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    if (exitPreset === 'fade') {
      exitOpacity = 1 - outProgress;
    } else if (exitPreset === 'slide-down') {
      exitOpacity = 1 - outProgress;
      exitY = interpolate(outProgress, [0, 1], [0, 48]);
    } else if (exitPreset === 'scale-down') {
      exitOpacity = 1 - outProgress;
      exitScale = interpolate(outProgress, [0, 1], [1, 0.85]);
    }
  }

  return {
    opacity: enterOpacity * exitOpacity,
    transform: `translate3d(${enterX}px, ${enterY + exitY}px, 0) scale(${enterScale * exitScale})`,
    filter: enterBlur > 0.2 ? `blur(${enterBlur.toFixed(1)}px)` : undefined,
  };
}

export function buildGlassSurfaceStyle(
  clip: TimelineClip
): React.CSSProperties {
  const { appleDarkMode, glassOpacity, blurPx, borderRadius, borderOpacity } =
    clip.style;
  const topA = Math.min(0.95, Math.max(0.05, glassOpacity));
  const botA = Math.max(0.03, topA * 0.68);
  const brdA = Math.min(1, Math.max(0, borderOpacity));

  return {
    background: appleDarkMode
      ? `linear-gradient(145deg, rgba(22, 26, 38, ${topA}) 0%, rgba(12, 15, 24, ${botA}) 100%)`
      : `linear-gradient(145deg, rgba(255, 255, 255, ${topA}) 0%, rgba(240, 245, 255, ${botA}) 100%)`,
    backdropFilter: `blur(${blurPx}px) saturate(200%)`,
    WebkitBackdropFilter: `blur(${blurPx}px) saturate(200%)`,
    border: appleDarkMode
      ? `1px solid rgba(255, 255, 255, ${brdA})`
      : `1px solid rgba(255, 255, 255, ${brdA})`,
    boxShadow: appleDarkMode
      ? '0 24px 60px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.26)'
      : '0 20px 52px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    borderRadius,
  };
}

function renderHighlightedText(
  text: string,
  highlightWord: string,
  accentColor: string,
  progress: number
): React.ReactNode {
  const target = highlightWord.trim().toLowerCase();
  if (!target) return text;
  const parts = text.split(/(\s+)/);
  return parts.map((part, idx) => {
    const clean = part.toLowerCase().replace(/[^a-z0-9-_]/gi, '');
    if (clean && clean === target) {
      return (
        <span
          key={`hl-${idx}`}
          style={{
            position: 'relative',
            display: 'inline-block',
            color: accentColor,
          }}
        >
          {part}
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -2,
              height: 4,
              borderRadius: 99,
              backgroundColor: accentColor,
              transformOrigin: 'left center',
              transform: `scaleX(${progress})`,
            }}
          />
        </span>
      );
    }
    return <span key={`tx-${idx}`}>{part}</span>;
  });
}

interface CustomLayerRendererProps {
  clip: TimelineClip;
  clipLocalFrame: number;
  sourceFrame: number;
  fps: number;
  isPortrait: boolean;
}

export const CustomLayerRenderer: React.FC<CustomLayerRendererProps> = ({
  clip,
  clipLocalFrame,
  sourceFrame,
  fps,
  isPortrait,
}) => {
  const motion = computeClipMotionStyles(clip, clipLocalFrame, fps);
  const glass = buildGlassSurfaceStyle(clip);
  const { style, content } = clip;
  const scaleFactor = isPortrait ? 0.9 : 1;
  const fontSize = Math.round(style.fontSize * scaleFactor);
  const subTextColor = style.appleDarkMode ? '#B4B7C2' : '#4B5563';
  const fontStack = `${style.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;

  const highlightProgress = interpolate(sourceFrame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const layerOpacity = typeof style.opacity === 'number' ? style.opacity : 1;
  const layerScale = typeof style.scale === 'number' ? style.scale : 1;
  const layerRotation =
    typeof style.rotationDeg === 'number' ? style.rotationDeg : 0;

  const anchorStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${style.posX}%`,
    top: `${style.posY}%`,
    transform: `translate(-50%, -50%) ${motion.transform} scale(${layerScale}) rotate(${layerRotation}deg)`,
    transformOrigin: 'center center',
    opacity: motion.opacity * layerOpacity,
    filter: motion.filter,
    maxWidth: isPortrait ? Math.min(960, style.maxWidth) : style.maxWidth,
    width: 'max-content',
    fontFamily: fontStack,
    color: style.textColor,
    pointerEvents: 'none',
  };

  if (clip.customLayerType === 'kinetic-text') {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            ...anchorStyle,
            textAlign: 'center',
            padding: `${style.paddingY}px ${style.paddingX}px`,
            maxWidth: isPortrait ? 940 : Math.max(820, style.maxWidth),
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: style.fontWeight,
              lineHeight: 1.14,
              letterSpacing: '-0.03em',
              textShadow: style.appleDarkMode
                ? '0 6px 28px rgba(0, 0, 0, 0.72)'
                : '0 4px 20px rgba(255, 255, 255, 0.7)',
            }}
          >
            {renderHighlightedText(
              content.text,
              content.highlightWord,
              style.accentColor,
              highlightProgress
            )}
          </div>
          {content.subtext.trim() !== '' && (
            <div
              style={{
                marginTop: 18,
                fontSize: Math.max(20, Math.round(fontSize * 0.42)),
                fontWeight: 500,
                color: subTextColor,
              }}
            >
              {content.subtext}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  if (clip.customLayerType === 'terminal') {
    const typedCount = Math.floor(
      interpolate(sourceFrame, [4, 48], [0, content.text.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const typedText = content.text.slice(0, typedCount);
    const cursorOn =
      sourceFrame < 48 ? true : Math.floor((sourceFrame - 48) / 10) % 2 === 0;

    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            ...anchorStyle,
            ...glass,
            width: isPortrait ? 920 : Math.min(1180, Math.max(680, style.maxWidth)),
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 26px',
              background: style.appleDarkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.26)',
              borderBottom: style.appleDarkMode
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#FF5F57',
                }}
              />
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#FEBC2E',
                }}
              />
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#28C840',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
                fontWeight: 600,
                color: subTextColor,
              }}
            >
              {content.badgeLabel || 'Terminal — zsh'}
            </div>
            <div style={{ width: 56 }} />
          </div>

          <div
            style={{
              padding: `${style.paddingY + 12}px ${style.paddingX}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {content.subtext.trim() !== '' && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  fontWeight: 600,
                  color: style.accentColor,
                  opacity: 0.9,
                }}
              >
                {content.subtext}
              </div>
            )}
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize,
                fontWeight: style.fontWeight,
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: '#34C759', marginRight: 14 }}>❯</span>
              {renderHighlightedText(
                typedText,
                content.highlightWord,
                style.accentColor,
                highlightProgress
              )}
              <span
                style={{
                  display: 'inline-block',
                  width: 13,
                  height: Math.round(fontSize * 1.05),
                  backgroundColor: style.accentColor,
                  marginLeft: 6,
                  verticalAlign: 'text-bottom',
                  borderRadius: 3,
                  opacity: cursorOn ? 0.95 : 0,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (clip.customLayerType === 'badge-node') {
    const pulse = (sourceFrame % 36) / 36;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            ...anchorStyle,
            ...glass,
            padding: `${style.paddingY}px ${style.paddingX}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            border: `1.5px solid ${style.accentColor}`,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: Math.max(16, style.borderRadius - 8),
              backgroundColor: `${style.accentColor}22`,
              border: `1px solid ${style.accentColor}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: Math.max(20, style.borderRadius - 4),
                border: `2px solid ${style.accentColor}`,
                transform: `scale(${interpolate(pulse, [0, 1], [0.95, 1.2])})`,
                opacity: interpolate(pulse, [0, 0.25, 1], [0.55, 0.3, 0]),
              }}
            />
            {renderClipIcon(
              content.iconId,
              46,
              style.accentColor,
              '#34C759',
              sourceFrame
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: Math.max(26, Math.round(fontSize * 0.78)),
                fontWeight: style.fontWeight,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              {content.text}
            </div>
            {content.subtext.trim() !== '' && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 20,
                  fontWeight: 600,
                  color: style.accentColor,
                }}
              >
                {content.subtext}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default: glass-card
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          ...anchorStyle,
          ...glass,
          width: isPortrait ? 920 : Math.min(1280, Math.max(520, style.maxWidth)),
          padding: `${style.paddingY + 12}px ${style.paddingX + 12}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {content.badgeLabel.trim() !== '' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              fontWeight: 700,
              color: style.accentColor,
              letterSpacing: '0.04em',
            }}
          >
            {renderClipIcon(
              content.iconId,
              26,
              style.accentColor,
              '#34C759',
              sourceFrame
            )}
            <span>{content.badgeLabel}</span>
          </div>
        )}

        <div
          style={{
            fontSize,
            fontWeight: style.fontWeight,
            lineHeight: 1.18,
            letterSpacing: '-0.028em',
          }}
        >
          {renderHighlightedText(
            content.text,
            content.highlightWord,
            style.accentColor,
            highlightProgress
          )}
        </div>

        {content.subtext.trim() !== '' && (
          <div
            style={{
              fontSize: Math.max(22, Math.round(fontSize * 0.48)),
              fontWeight: 500,
              lineHeight: 1.45,
              color: subTextColor,
            }}
          >
            {content.subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

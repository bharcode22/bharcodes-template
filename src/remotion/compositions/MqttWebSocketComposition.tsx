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
  GatewayRouterIcon,
  HardwareChipIcon,
  IndustrialBoardIcon,
  MqttIcon,
  NodeJsIcon,
  ReactIcon,
  SensorModuleIcon,
  SmartMeterIcon,
  WebSocketIcon,
} from '../components/TechIcons';
import {
  CustomLayerRenderer,
  buildGlassSurfaceStyle,
  computeClipMotionStyles,
} from '../components/CustomLayerRenderer';
import { createDefaultMqttClips } from '../../utils/projectStorage';
import { useSoundFxUrl } from '../../audio/soundFxSynthesizer';

const SCENE_NATIVE_BASE: Partial<Record<ScenePresetId, { start: number; end: number }>> = {
  'scene-1-intro': { start: 0, end: 98 },
  'scene-2-mqtt': { start: 90, end: 232 },
  'scene-3-ws': { start: 224, end: 344 },
  'scene-3b-websocket': { start: 333, end: 408 },
  'scene-4-flow': { start: 400, end: 610 },
  'scene-5-browser': { start: 598, end: 842 },
  'scene-6-outro': { start: 830, end: 1020 },
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

interface ScenePresetProps {
  clip: TimelineClip;
  clipLocalFrame: number;
  sourceFrame: number;
  fps: number;
  isPortrait: boolean;
}

const ScenePresetRenderer: React.FC<ScenePresetProps> = ({
  clip,
  clipLocalFrame,
  sourceFrame,
  fps,
  isPortrait,
}) => {
  const sceneId = clip.scenePresetId ?? 'scene-1-intro';
  const nativeSpan = SCENE_NATIVE_BASE[sceneId] ?? { start: 0, end: 120 };
  // Map clip-relative sourceFrame onto the scene's native 30fps coordinate
  const tFrame = nativeSpan.start + sourceFrame;

  const { style, content, animation } = clip;
  const appleDarkMode = style.appleDarkMode;
  const appleBlue = style.accentColor || '#0071E3';
  const nodeGreen = '#34C759';
  const reactCyan = '#0EA5E9';

  const glassStyle = buildGlassSurfaceStyle(clip);
  const innerGlassStyle: React.CSSProperties = {
    background: appleDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.46)',
    backdropFilter: `blur(${Math.max(12, Math.round(style.blurPx * 0.65))}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${Math.max(12, Math.round(style.blurPx * 0.65))}px) saturate(180%)`,
    border: appleDarkMode
      ? '1px solid rgba(255, 255, 255, 0.18)'
      : '1px solid rgba(255, 255, 255, 0.72)',
  };

  const textPrimary = style.textColor || (appleDarkMode ? '#F5F5F7' : '#1D1D1F');
  const textSecondary = appleDarkMode ? '#B4B7C2' : '#4B5563';
  const openHeadingShadow = appleDarkMode
    ? '0 4px 28px rgba(0, 0, 0, 0.72)'
    : '0 2px 18px rgba(255, 255, 255, 0.65)';
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
  // SCENE 1: Right-to-Left Kinetic Glass Cards
  // ============================================================================
  if (sceneId === 'scene-1-intro') {
    const defaultScript =
      'bagaimana cara menampilkan data secara realtime di frontend';
    const headline =
      content.text.trim() || defaultScript;
    const scene1Tokens =
      headline.trim().toLowerCase() === defaultScript
        ? [
            'bagaimana',
            'cara',
            'menampilkan',
            'data',
            'secara',
            'realtime',
            'di frontend',
          ]
        : headline.trim().split(/\s+/).filter(Boolean);

    const defaultWordCues = [0, 15, 24, 36, 43, 48, 57];
    const tokenCues =
      scene1Tokens.length === 7
        ? defaultWordCues
        : scene1Tokens.map((_, idx) =>
            Math.round((idx * 57) / Math.max(1, scene1Tokens.length - 1))
          );

    const cardFontSize = isPortrait
      ? Math.max(64, Math.round(style.fontSize * 1.3))
      : style.fontSize || 58;
    const cardPadX = isPortrait ? 52 : style.paddingX || 40;
    const cardGap = isPortrait ? 28 : 24;

    const cardWidths = scene1Tokens.map((word) => {
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

    const s1SpringCfg = {
      damping: Math.max(14, animation.springDamping + 4),
      stiffness: Math.max(230, animation.springStiffness * 1.85),
      mass: 0.65,
    };

    let s1CameraX = cardCenters[0] ?? 0;
    let s1ActiveProgress = 0;
    for (let i = 1; i < scene1Tokens.length; i++) {
      const cueFrame = tokenCues[i];
      const step =
        tFrame >= cueFrame
          ? spring({
              frame: tFrame - cueFrame,
              fps: 30,
              config: s1SpringCfg,
            })
          : 0;
      s1CameraX += step * (cardCenters[i] - cardCenters[i - 1]);
      s1ActiveProgress += step;
    }

    const highlightTarget = (content.highlightWord || 'realtime').toLowerCase();

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
              transform: `translateX(${-s1CameraX}px)`,
            }}
          >
            {scene1Tokens.map((word, idx) => {
              const startAt = tokenCues[idx];
              const isVisible = tFrame >= startAt;

              const enterSpring = isVisible
                ? spring({
                    frame: tFrame - startAt,
                    fps: 30,
                    config: s1SpringCfg,
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

              const distBehind = Math.max(0, s1ActiveProgress - idx);
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

              const lower = word.toLowerCase();
              const isHighlight =
                lower === highlightTarget ||
                lower === 'realtime' ||
                lower === 'real-time';

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
                    borderRadius: isPortrait ? Math.max(28, style.borderRadius + 8) : style.borderRadius,
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
  // SCENE 2: Multi-Hardware -> MQTT Architecture
  // ============================================================================
  if (sceneId === 'scene-2-mqtt') {
    const s2MqttSpring = spring({ frame: tFrame - 94, fps: 30, config: springCfg });
    const hwNodeAppearFrames = [100, 108, 116, 124, 132];
    const hwLineDrawStarts = [130, 138, 146, 154, 162];

    const mqttReceiveBeat = hwLineDrawStarts.reduce((acc, startF, idx) => {
      const firstPacketStart = startF + 22;
      if (tFrame < firstPacketStart) return acc;
      const phase = ((tFrame - firstPacketStart + idx * 7) % 42) / 42;
      const hit = phase > 0.84 ? Math.sin(((phase - 0.84) / 0.16) * Math.PI) : 0;
      return Math.max(acc, hit);
    }, 0);

    const stageW = isPortrait ? 920 : 1380;
    const stageH = isPortrait ? 1120 : 640;
    const hwSize = isPortrait ? 132 : 124;
    const hwHalf = hwSize / 2;
    const mqttSize = 210;
    const mqttHalf = mqttSize / 2;

    const hwNodes = isPortrait
      ? [
          { id: 'mcu', x: 165, y: 140, color: nodeGreen, Icon: HardwareChipIcon },
          { id: 'sensor', x: 305, y: 385, color: appleBlue, Icon: SensorModuleIcon },
          { id: 'gateway', x: 460, y: 120, color: appleBlue, Icon: GatewayRouterIcon },
          { id: 'board', x: 615, y: 385, color: nodeGreen, Icon: IndustrialBoardIcon },
          { id: 'meter', x: 755, y: 140, color: nodeGreen, Icon: SmartMeterIcon },
        ]
      : [
          { id: 'mcu', x: 170, y: 105, color: nodeGreen, Icon: HardwareChipIcon },
          { id: 'sensor', x: 385, y: 218, color: appleBlue, Icon: SensorModuleIcon },
          { id: 'gateway', x: 145, y: 330, color: appleBlue, Icon: GatewayRouterIcon },
          { id: 'board', x: 385, y: 442, color: nodeGreen, Icon: IndustrialBoardIcon },
          { id: 'meter', x: 170, y: 555, color: nodeGreen, Icon: SmartMeterIcon },
        ];

    const mqttPos = isPortrait ? { x: 460, y: 880 } : { x: 1140, y: 330 };

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '48px 40px' : '32px 80px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: stageW,
            height: stageH,
            flexShrink: 0,
          }}
        >
          <svg
            width={stageW}
            height={stageH}
            viewBox={`0 0 ${stageW} ${stageH}`}
            fill="none"
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            {hwNodes.map((node, idx) => {
              const drawStart = hwLineDrawStarts[idx];
              const lineProgress = interpolate(
                tFrame,
                [drawStart, drawStart + 24],
                [0, 1],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }
              );

              const p0 = isPortrait
                ? { x: node.x, y: node.y + hwHalf + 6 }
                : { x: node.x + hwHalf + 6, y: node.y };

              const p3 = isPortrait
                ? { x: mqttPos.x + (idx - 2) * 30, y: mqttPos.y - mqttHalf - 8 }
                : { x: mqttPos.x - mqttHalf - 8, y: mqttPos.y + (idx - 2) * 28 };

              const p1 = isPortrait
                ? { x: p0.x, y: p0.y + (p3.y - p0.y) * 0.54 }
                : { x: p0.x + (p3.x - p0.x) * 0.56, y: p0.y };

              const p2 = isPortrait
                ? { x: p3.x, y: p0.y + (p3.y - p0.y) * 0.54 }
                : { x: p0.x + (p3.x - p0.x) * 0.56, y: p3.y };

              const pathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
              const packetStart = drawStart + 22;
              const packetActive = tFrame >= packetStart && lineProgress > 0.9;
              const t = packetActive
                ? ((tFrame - packetStart + idx * 7) % 42) / 42
                : 0;
              const mt = 1 - t;
              const cx =
                mt * mt * mt * p0.x +
                3 * mt * mt * t * p1.x +
                3 * mt * t * t * p2.x +
                t * t * t * p3.x;
              const cy =
                mt * mt * mt * p0.y +
                3 * mt * mt * t * p1.y +
                3 * mt * t * t * p2.y +
                t * t * t * p3.y;
              const orbAlpha = packetActive
                ? interpolate(t, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
                : 0;

              return (
                <g key={`arch-line-${node.id}`}>
                  <path
                    d={pathD}
                    pathLength={1}
                    stroke={appleBlue}
                    strokeOpacity={0.14 * lineProgress}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d={pathD}
                    pathLength={1}
                    stroke={node.color}
                    strokeOpacity={0.78}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="1"
                    strokeDashoffset={1 - lineProgress}
                  />
                  <circle cx={p0.x} cy={p0.y} r={5.5 * lineProgress} fill={node.color} />
                  <circle cx={p3.x} cy={p3.y} r={5.5 * lineProgress} fill={appleBlue} />
                  {packetActive && (
                    <g opacity={orbAlpha}>
                      <circle cx={cx} cy={cy} r="14" fill={node.color} fillOpacity="0.24" />
                      <circle cx={cx} cy={cy} r="7.5" fill={node.color} />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {hwNodes.map((node, idx) => {
            const appearAt = hwNodeAppearFrames[idx];
            const nodeSpring =
              tFrame >= appearAt
                ? spring({
                    frame: tFrame - appearAt,
                    fps: 30,
                    config: springCfg,
                  })
                : 0;
            const nodeScale = interpolate(nodeSpring, [0, 1], [0.68, 1]);
            const nodeOpacity = interpolate(nodeSpring, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            });
            const localT = Math.max(0, tFrame - appearAt);
            const pingPhase = ((localT + idx * 7) % 34) / 34;
            const pingScale = interpolate(pingPhase, [0, 1], [0.96, 1.52]);
            const pingOpacity =
              tFrame >= appearAt + 6
                ? interpolate(pingPhase, [0, 0.2, 1], [0.58, 0.35, 0])
                : 0;
            const NodeIcon = node.Icon;

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.x - hwHalf,
                  top: node.y - hwHalf,
                  width: hwSize,
                  height: hwSize,
                  opacity: nodeOpacity,
                  transform: `scale(${nodeScale})`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 2,
                    borderRadius: style.borderRadius,
                    border: `2.5px solid ${node.color}`,
                    transform: `scale(${pingScale})`,
                    opacity: pingOpacity,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    ...glassStyle,
                    width: '100%',
                    height: '100%',
                    borderRadius: style.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NodeIcon
                    size={isPortrait ? 70 : 66}
                    color={textPrimary}
                    accentColor={node.color}
                  />
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: mqttPos.x - mqttHalf,
              top: mqttPos.y - mqttHalf,
              width: mqttSize,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              opacity: interpolate(s2MqttSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s2MqttSpring, [0, 1], [0.8, 1]) + mqttReceiveBeat * 0.04})`,
            }}
          >
            <div style={{ position: 'relative', width: mqttSize, height: mqttSize }}>
              <div
                style={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: 56,
                  border: `3px solid ${appleBlue}`,
                  opacity: mqttReceiveBeat * 0.55,
                  transform: `scale(${1 + mqttReceiveBeat * 0.08})`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  ...glassStyle,
                  width: '100%',
                  height: '100%',
                  borderRadius: Math.max(24, style.borderRadius + 14),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MqttIcon size={108} color={appleBlue} />
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 3: Apple Glassmorphism Terminal + Typewriter
  // ============================================================================
  if (sceneId === 'scene-3-ws') {
    const s3TermSpring = spring({ frame: tFrame - 224, fps: 30, config: springCfg });
    const s3TypedFull =
      content.text ||
      'nah sekarang bagaimana cara mengirimkan data itu ke frontend secara realtime';
    const s3TypedChars = Math.floor(
      interpolate(tFrame, [234, 318], [0, s3TypedFull.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    );
    const s3TypedText = s3TypedFull.slice(0, s3TypedChars);
    const s3CursorOn =
      tFrame < 318 ? true : Math.floor((tFrame - 318) / 10) % 2 === 0;
    const s3RealtimeProgress = interpolate(tFrame, [304, 322], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const termFontSize = isPortrait
      ? Math.max(36, Math.round(style.fontSize * 0.88))
      : style.fontSize || 48;

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
            opacity: interpolate(s3TermSpring, [0, 0.4], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(s3TermSpring, [0, 1], [44, 0])}px) scale(${interpolate(s3TermSpring, [0, 1], [0.93, 1])})`,
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
              padding: isPortrait ? '54px 42px 62px' : '62px 58px 70px',
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
                color: textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: 0.85,
              }}
            >
              <span style={{ color: nodeGreen }}>
                {content.subtext || '~/stream on main'}
              </span>
            </div>

            <div
              style={{
                fontFamily: `${style.fontFamily}, JetBrains Mono, monospace`,
                fontSize: termFontSize,
                fontWeight: style.fontWeight || 600,
                lineHeight: 1.48,
                letterSpacing: '-0.028em',
                color: textPrimary,
                textShadow: openHeadingShadow,
                wordBreak: 'normal',
                overflowWrap: 'break-word',
              }}
            >
              <span
                style={{
                  color: nodeGreen,
                  marginRight: 18,
                  fontWeight: 800,
                  textShadow: `0 0 18px ${nodeGreen}66`,
                }}
              >
                ❯
              </span>
              {s3TypedText.split(/(\s+)/).map((part, idx) => {
                if (!part) return null;
                const lower = part.toLowerCase();
                const hl = (content.highlightWord || 'realtime').toLowerCase();
                if (lower === 'frontend') {
                  return (
                    <span
                      key={`t-${idx}`}
                      style={{
                        color: reactCyan,
                        fontWeight: 700,
                        textShadow: `0 0 22px ${reactCyan}55`,
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
                        color: nodeGreen,
                        fontWeight: 800,
                        textShadow: `0 0 24px ${nodeGreen}66`,
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
                          background: `linear-gradient(90deg, ${appleBlue}, ${nodeGreen})`,
                          transformOrigin: 'left center',
                          transform: `scaleX(${s3RealtimeProgress})`,
                          boxShadow: `0 0 14px ${nodeGreen}88`,
                        }}
                      />
                    </span>
                  );
                }
                if (lower === 'data') {
                  return (
                    <span
                      key={`t-${idx}`}
                      style={{
                        color: appleDarkMode ? '#FFFFFF' : '#111827',
                        fontWeight: 700,
                      }}
                    >
                      {part}
                    </span>
                  );
                }
                return <span key={`t-${idx}`}>{part}</span>;
              })}
              <span
                style={{
                  display: 'inline-block',
                  width: isPortrait ? 14 : 16,
                  height: isPortrait ? 44 : 50,
                  background: `linear-gradient(180deg, ${appleBlue} 0%, ${nodeGreen} 100%)`,
                  marginLeft: 8,
                  verticalAlign: 'text-bottom',
                  borderRadius: 4,
                  opacity: s3CursorOn ? 0.96 : 0,
                  boxShadow: s3CursorOn ? `0 0 18px ${appleBlue}99` : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 3B: WebSocket Full-Duplex Showcase
  // ============================================================================
  if (sceneId === 'scene-3b-websocket') {
    const sWsSpring = spring({ frame: tFrame - 335, fps: 30, config: springCfg });
    const sWsArrowShift = Math.sin((tFrame - 333) * 0.28) * 4;
    const sWsLineProgress = interpolate(tFrame, [342, 366], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const sWsPulsePhase = (Math.max(0, tFrame - 338) % 28) / 28;
    const sWsForwardDot = (Math.max(0, tFrame - 344) % 24) / 24;
    const sWsReverseDot = (Math.max(0, tFrame - 352) % 24) / 24;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '64px 48px' : '0 120px',
          gap: 36,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 20 : 32,
            width: '100%',
            maxWidth: isPortrait ? 900 : 1100,
          }}
        >
          {/* Left Tracks */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxWidth: isPortrait ? 180 : 280,
            }}
          >
            <div style={{ position: 'relative', height: 6, borderRadius: 99, backgroundColor: 'rgba(148, 163, 184, 0.22)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: appleBlue, transformOrigin: 'left center', transform: `scaleX(${sWsLineProgress})` }} />
              {sWsLineProgress > 0.8 && (
                <div style={{ position: 'absolute', top: -5, left: `${sWsForwardDot * 100}%`, width: 16, height: 16, borderRadius: '50%', backgroundColor: appleBlue, boxShadow: `0 0 18px ${appleBlue}` }} />
              )}
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 99, backgroundColor: 'rgba(148, 163, 184, 0.22)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: nodeGreen, transformOrigin: 'right center', transform: `scaleX(${sWsLineProgress})` }} />
              {sWsLineProgress > 0.8 && (
                <div style={{ position: 'absolute', top: -5, left: `${(1 - sWsReverseDot) * 100}%`, width: 16, height: 16, borderRadius: '50%', backgroundColor: nodeGreen, boxShadow: `0 0 18px ${nodeGreen}` }} />
              )}
            </div>
          </div>

          {/* Center WebSocket Card */}
          <div
            style={{
              position: 'relative',
              width: isPortrait ? 200 : 216,
              height: isPortrait ? 200 : 216,
              flexShrink: 0,
              opacity: interpolate(sWsSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `scale(${interpolate(sWsSpring, [0, 1], [0.76, 1])})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: Math.max(24, style.borderRadius + 8),
                border: `2.5px solid ${appleBlue}`,
                transform: `scale(${interpolate(sWsPulsePhase, [0, 1], [0.96, 1.18])})`,
                opacity: interpolate(sWsPulsePhase, [0, 0.25, 1], [0.6, 0.35, 0]),
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                ...glassStyle,
                width: '100%',
                height: '100%',
                borderRadius: style.borderRadius,
                border: `1.5px solid ${appleBlue}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WebSocketIcon
                size={isPortrait ? 108 : 116}
                color={appleBlue}
                accentColor={nodeGreen}
                shift={sWsArrowShift}
              />
            </div>
          </div>

          {/* Right Tracks */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxWidth: isPortrait ? 180 : 280,
            }}
          >
            <div style={{ position: 'relative', height: 6, borderRadius: 99, backgroundColor: 'rgba(148, 163, 184, 0.22)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: appleBlue, transformOrigin: 'left center', transform: `scaleX(${sWsLineProgress})` }} />
              {sWsLineProgress > 0.8 && (
                <div style={{ position: 'absolute', top: -5, left: `${sWsForwardDot * 100}%`, width: 16, height: 16, borderRadius: '50%', backgroundColor: appleBlue, boxShadow: `0 0 18px ${appleBlue}` }} />
              )}
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 99, backgroundColor: 'rgba(148, 163, 184, 0.22)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: nodeGreen, transformOrigin: 'right center', transform: `scaleX(${sWsLineProgress})` }} />
              {sWsLineProgress > 0.8 && (
                <div style={{ position: 'absolute', top: -5, left: `${(1 - sWsReverseDot) * 100}%`, width: 16, height: 16, borderRadius: '50%', backgroundColor: nodeGreen, boxShadow: `0 0 18px ${nodeGreen}` }} />
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: interpolate(sWsSpring, [0.15, 0.7], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(sWsSpring, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: style.fontSize || 68,
              fontWeight: style.fontWeight || 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              color: textPrimary,
              textShadow: openHeadingShadow,
            }}
          >
            {content.text || 'WebSocket'}
          </div>
          <div
            style={{
              ...glassStyle,
              borderRadius: 14,
              padding: '8px 22px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isPortrait ? 24 : 26,
              fontWeight: 700,
              color: nodeGreen,
            }}
          >
            {content.subtext || 'ws://real-time'}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 4: Open-Canvas Icon Pipeline: MQTT -> Node.js -> React
  // ============================================================================
  if (sceneId === 'scene-4-flow') {
    const s4MqttNode = spring({ frame: tFrame - 412, fps: 30, config: springCfg });
    const s4NodeJsNode = spring({ frame: tFrame - 452, fps: 30, config: springCfg });
    const s4ReactNode = spring({ frame: tFrame - 504, fps: 30, config: springCfg });

    const s4Line1 = interpolate(tFrame, [430, 466], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const s4Line2 = interpolate(tFrame, [486, 524], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const s4Dot1 = ((tFrame - 434) % 30) / 30;
    const s4Dot2 = ((tFrame - 492) % 26) / 26;
    const reactSpin = (tFrame - 400) * 1.6;

    const s4BoxSize = isPortrait ? 248 : 164;
    const s4Radius = isPortrait ? Math.max(48, style.borderRadius + 16) : style.borderRadius;
    const s4LabelSize = isPortrait ? 48 : style.fontSize || 32;
    const s4StreamThick = isPortrait ? 10 : 6;
    const s4StreamLen = isPortrait ? 118 : 200;
    const s4DotSize = isPortrait ? 24 : 16;
    const s4DotOffset = -(s4DotSize - s4StreamThick) / 2;

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '80px 48px' : '0 96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 1520,
            gap: isPortrait ? 34 : 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isPortrait ? 24 : 22,
              width: isPortrait ? '100%' : 300,
              opacity: interpolate(s4MqttNode, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s4MqttNode, [0, 1], [0.85, 1])})`,
            }}
          >
            <div
              style={{
                ...glassStyle,
                width: s4BoxSize,
                height: s4BoxSize,
                borderRadius: s4Radius,
                border: `1.5px solid ${tFrame >= 412 ? appleBlue : 'rgba(255,255,255,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MqttIcon size={isPortrait ? 128 : 84} color={appleBlue} />
            </div>
            <div style={{ textAlign: 'center', textShadow: openHeadingShadow, fontSize: s4LabelSize, fontWeight: 800 }}>
              MQTT
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: isPortrait ? s4StreamThick : s4StreamLen,
              height: isPortrait ? s4StreamLen : s4StreamThick,
              backgroundColor: 'rgba(148, 163, 184, 0.25)',
              borderRadius: 99,
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: appleBlue,
                  transformOrigin: isPortrait ? 'top center' : 'left center',
                  transform: isPortrait ? `scaleY(${s4Line1})` : `scaleX(${s4Line1})`,
                }}
              />
            </div>
            {s4Line1 > 0.85 && (
              <div
                style={{
                  position: 'absolute',
                  width: s4DotSize,
                  height: s4DotSize,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: `0 0 18px ${appleBlue}`,
                  top: isPortrait ? `${s4Dot1 * 100}%` : s4DotOffset,
                  left: isPortrait ? s4DotOffset : `${s4Dot1 * 100}%`,
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isPortrait ? 24 : 22,
              width: isPortrait ? '100%' : 300,
              opacity: interpolate(s4NodeJsNode, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s4NodeJsNode, [0, 1], [0.85, 1])})`,
            }}
          >
            <div
              style={{
                ...glassStyle,
                width: s4BoxSize,
                height: s4BoxSize,
                borderRadius: '50%',
                border: `1.5px solid ${tFrame >= 452 ? nodeGreen : 'rgba(255,255,255,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NodeJsIcon size={isPortrait ? 132 : 86} color={nodeGreen} />
            </div>
            <div style={{ textAlign: 'center', textShadow: openHeadingShadow, fontSize: s4LabelSize, fontWeight: 800 }}>
              Node.js Back-End
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: isPortrait ? s4StreamThick : s4StreamLen,
              height: isPortrait ? s4StreamLen : s4StreamThick,
              backgroundColor: 'rgba(148, 163, 184, 0.25)',
              borderRadius: 99,
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: nodeGreen,
                  transformOrigin: isPortrait ? 'top center' : 'left center',
                  transform: isPortrait ? `scaleY(${s4Line2})` : `scaleX(${s4Line2})`,
                }}
              />
            </div>
            {s4Line2 > 0.85 && (
              <div
                style={{
                  position: 'absolute',
                  width: s4DotSize,
                  height: s4DotSize,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: `0 0 18px ${nodeGreen}`,
                  top: isPortrait ? `${s4Dot2 * 100}%` : s4DotOffset,
                  left: isPortrait ? s4DotOffset : `${s4Dot2 * 100}%`,
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isPortrait ? 24 : 22,
              width: isPortrait ? '100%' : 300,
              opacity: interpolate(s4ReactNode, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s4ReactNode, [0, 1], [0.85, 1])})`,
            }}
          >
            <div
              style={{
                ...glassStyle,
                width: s4BoxSize,
                height: s4BoxSize,
                borderRadius: s4Radius,
                border: `1.5px solid ${tFrame >= 504 ? reactCyan : 'rgba(255,255,255,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReactIcon size={isPortrait ? 132 : 86} color={reactCyan} rotationDeg={reactSpin} />
            </div>
            <div style={{ textAlign: 'center', textShadow: openHeadingShadow, fontSize: s4LabelSize, fontWeight: 800 }}>
              React Front-End
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 5: Live React Browser Overlay (Blinking HB Counting Grid)
  // ============================================================================
  if (sceneId === 'scene-5-browser') {
    const s5Window = spring({ frame: tFrame - 604, fps: 30, config: springCfg });

    return (
      <AbsoluteFill
        style={{
          ...wrapStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isPortrait ? '72px 44px' : '0 130px',
        }}
      >
        <div
          style={{
            ...glassStyle,
            width: '100%',
            maxWidth: isPortrait ? 940 : 1240,
            borderRadius: style.borderRadius,
            overflow: 'hidden',
            transform: `translateY(${interpolate(s5Window, [0, 1], [44, 0])}px) scale(${interpolate(s5Window, [0, 1], [0.94, 1])})`,
            opacity: interpolate(s5Window, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              height: isPortrait ? 68 : 62,
              padding: '0 28px',
              background: appleDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.35)',
              borderBottom: appleDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#27C93F' }} />
            </div>

            <div
              style={{
                ...innerGlassStyle,
                padding: '8px 22px',
                borderRadius: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 20 : 18,
                fontWeight: 600,
                color: textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ReactIcon size={22} color={reactCyan} rotationDeg={(tFrame - 598) * 1.5} />
              <span>{content.text || 'HB Counting'}</span>
            </div>

            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isPortrait ? 18 : 16,
                fontWeight: 700,
                color: nodeGreen,
              }}
            >
              {content.subtext || 'WS LIVE'}
            </div>
          </div>

          <div
            style={{
              padding: isPortrait ? 28 : 36,
              display: 'grid',
              gridTemplateColumns: isPortrait
                ? 'repeat(2, minmax(0, 1fr))'
                : 'repeat(4, minmax(0, 1fr))',
              gap: isPortrait ? 18 : 22,
            }}
          >
            {[
              { id: 'NODE 01', base: 412, period: 22, offset: 0, tone: nodeGreen },
              { id: 'NODE 02', base: 186, period: 26, offset: 9, tone: appleBlue },
              { id: 'NODE 03', base: 734, period: 20, offset: 15, tone: nodeGreen },
              { id: 'NODE 04', base: 295, period: 28, offset: 5, tone: reactCyan },
              { id: 'NODE 05', base: 518, period: 24, offset: 19, tone: appleBlue },
              { id: 'NODE 06', base: 641, period: 21, offset: 11, tone: nodeGreen },
              { id: 'NODE 07', base: 367, period: 27, offset: 3, tone: reactCyan },
              { id: 'NODE 08', base: 829, period: 23, offset: 14, tone: nodeGreen },
            ].map((box, idx) => {
              const boxEnter = spring({
                frame: tFrame - (608 + idx * 4),
                fps: 30,
                config: springCfg,
              });
              const elapsed = Math.max(0, tFrame - 612 + box.offset);
              const hbCount = box.base + Math.floor(elapsed / box.period);
              const cyclePos = (elapsed % box.period) / box.period;
              const blink =
                tFrame >= 612
                  ? cyclePos < 0.08
                    ? cyclePos / 0.08
                    : cyclePos < 0.48
                      ? Math.pow(1 - (cyclePos - 0.08) / 0.4, 2)
                      : 0
                  : 0;

              return (
                <div
                  key={box.id}
                  style={{
                    background: appleDarkMode
                      ? `linear-gradient(145deg, rgba(255, 255, 255, ${0.08 + blink * 0.14}) 0%, rgba(255, 255, 255, ${0.03 + blink * 0.07}) 100%)`
                      : `linear-gradient(145deg, rgba(255, 255, 255, ${0.42 + blink * 0.3}) 0%, rgba(255, 255, 255, ${0.24 + blink * 0.2}) 100%)`,
                    backdropFilter: 'blur(28px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                    borderRadius: Math.max(14, style.borderRadius - 8),
                    padding: isPortrait ? '24px 22px' : '26px 24px',
                    border:
                      blink > 0.15
                        ? `1.5px solid ${box.tone}`
                        : appleDarkMode
                          ? '1px solid rgba(255, 255, 255, 0.16)'
                          : '1px solid rgba(255, 255, 255, 0.72)',
                    boxShadow:
                      blink > 0.1
                        ? `0 0 ${Math.round(28 * blink)}px ${box.tone}55, inset 0 0 ${Math.round(18 * blink)}px ${box.tone}26`
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: isPortrait ? 18 : 20,
                    opacity: interpolate(boxEnter, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
                    transform: `scale(${interpolate(boxEnter, [0, 1], [0.88, 1]) * (1 + blink * 0.025)})`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isPortrait ? 19 : 17, fontWeight: 700, color: textSecondary }}>
                      {box.id}
                    </span>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: box.tone,
                        opacity: 0.32 + blink * 0.68,
                        transform: `scale(${0.85 + blink * 0.4})`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, transform: `scale(${1 + blink * 0.1})`, transformOrigin: 'left center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isPortrait ? 20 : 18, fontWeight: 700, color: blink > 0.2 ? box.tone : textSecondary }}>
                      HB
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isPortrait ? 46 : style.fontSize || 44, fontWeight: 800, color: textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      {hbCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // SCENE 6: Finale Flow (MQTT JSON HB -> Back-End -> Front-End UI)
  // ============================================================================
  const s6MqttSpring = spring({ frame: tFrame - 834, fps: 30, config: springCfg });
  const s6Line1 = interpolate(tFrame, [850, 872], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s6BackendSpring = spring({ frame: tFrame - 862, fps: 30, config: springCfg });
  const s6Line2 = interpolate(tFrame, [880, 902], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s6FrontendSpring = spring({ frame: tFrame - 892, fps: 30, config: springCfg });

  const s6CycleFrames = 26;
  const s6Elapsed = Math.max(0, tFrame - 840);
  const s6HbCount = 426 + Math.floor(s6Elapsed / s6CycleFrames);
  const s6Phase = (s6Elapsed % s6CycleFrames) / s6CycleFrames;
  const s6MqttPulse = s6Phase < 0.34 ? Math.sin((s6Phase / 0.34) * Math.PI) : 0;
  const s6BackendPulse =
    s6Phase >= 0.3 && s6Phase < 0.68
      ? Math.sin(((s6Phase - 0.3) / 0.38) * Math.PI)
      : 0;
  const s6FrontendPulse =
    s6Phase >= 0.64 ? Math.sin(((s6Phase - 0.64) / 0.36) * Math.PI) : 0;

  return (
    <AbsoluteFill
      style={{
        ...wrapStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isPortrait ? '56px 40px' : '0 84px',
        gap: isPortrait ? 32 : 44,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: isPortrait ? 920 : 1620,
          gap: isPortrait ? 18 : 22,
        }}
      >
        {/* STAGE 1 */}
        <div
          style={{
            ...glassStyle,
            width: isPortrait ? '100%' : 430,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '24px 28px' : '28px 30px',
            border: s6MqttPulse > 0.2 ? `1.5px solid ${appleBlue}` : glassStyle.border,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            opacity: interpolate(s6MqttSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(s6MqttSpring, [0, 1], [32, 0])}px) scale(${interpolate(s6MqttSpring, [0, 1], [0.92, 1])})`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <MqttIcon size={40} color={appleBlue} />
              <span style={{ fontSize: 26, fontWeight: 700 }}>MQTT</span>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: appleBlue, opacity: 0.35 + s6MqttPulse * 0.65 }} />
          </div>
          <div style={{ ...innerGlassStyle, borderRadius: 18, padding: isPortrait ? '18px 22px' : '20px 24px', fontFamily: 'JetBrains Mono, monospace', fontSize: isPortrait ? 24 : 22, lineHeight: 1.55, fontVariantNumeric: 'tabular-nums' }}>
            <div style={{ color: textSecondary }}>{'{'}</div>
            <div style={{ paddingLeft: 20 }}>
              <span style={{ color: reactCyan }}>"node"</span>
              <span style={{ color: textSecondary }}>: </span>
              <span style={{ color: textPrimary }}>"{content.badgeLabel || 'ESP32-01'}"</span>
              <span style={{ color: textSecondary }}>,</span>
            </div>
            <div style={{ paddingLeft: 20, borderRadius: 8, backgroundColor: s6MqttPulse > 0.2 ? `${appleBlue}2A` : 'transparent' }}>
              <span style={{ color: reactCyan }}>"hb"</span>
              <span style={{ color: textSecondary }}>: </span>
              <span style={{ color: nodeGreen, fontWeight: 800 }}>{s6HbCount}</span>
            </div>
            <div style={{ color: textSecondary }}>{'}'}</div>
          </div>
        </div>

        {/* CONNECTOR 1 */}
        <div style={{ position: 'relative', width: isPortrait ? 6 : 130, height: isPortrait ? 52 : 6, backgroundColor: 'rgba(148, 163, 184, 0.25)', borderRadius: 99, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: appleBlue, transformOrigin: isPortrait ? 'top center' : 'left center', transform: isPortrait ? `scaleY(${s6Line1})` : `scaleX(${s6Line1})` }} />
          {s6Line1 > 0.85 && s6Phase >= 0.15 && s6Phase <= 0.5 && (() => {
            const p = (s6Phase - 0.15) / 0.35;
            return <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: appleBlue, boxShadow: `0 0 16px ${appleBlue}`, top: isPortrait ? `${p * 100}%` : -5, left: isPortrait ? -5 : `${p * 100}%` }} />;
          })()}
        </div>

        {/* STAGE 2 */}
        <div
          style={{
            ...glassStyle,
            width: isPortrait ? '100%' : 300,
            borderRadius: style.borderRadius,
            padding: isPortrait ? '24px 28px' : '32px 28px',
            border: s6BackendPulse > 0.2 ? `1.5px solid ${nodeGreen}` : glassStyle.border,
            display: 'flex',
            flexDirection: isPortrait ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? 22 : 20,
            opacity: interpolate(s6BackendSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(s6BackendSpring, [0, 1], [32, 0])}px) scale(${interpolate(s6BackendSpring, [0, 1], [0.92, 1]) * (1 + s6BackendPulse * 0.03)})`,
          }}
        >
          <div style={{ ...innerGlassStyle, width: isPortrait ? 92 : 112, height: isPortrait ? 92 : 112, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NodeJsIcon size={isPortrait ? 52 : 64} color={nodeGreen} />
          </div>
          <div style={{ textAlign: isPortrait ? 'left' : 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Back-End</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600, color: nodeGreen, marginTop: 4 }}>
              {content.subtext || 'WebSocket Push'}
            </div>
          </div>
        </div>

        {/* CONNECTOR 2 */}
        <div style={{ position: 'relative', width: isPortrait ? 6 : 130, height: isPortrait ? 52 : 6, backgroundColor: 'rgba(148, 163, 184, 0.25)', borderRadius: 99, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: nodeGreen, transformOrigin: isPortrait ? 'top center' : 'left center', transform: isPortrait ? `scaleY(${s6Line2})` : `scaleX(${s6Line2})` }} />
          {s6Line2 > 0.85 && s6Phase >= 0.48 && s6Phase <= 0.85 && (() => {
            const p = (s6Phase - 0.48) / 0.37;
            return <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: nodeGreen, boxShadow: `0 0 16px ${nodeGreen}`, top: isPortrait ? `${p * 100}%` : -5, left: isPortrait ? -5 : `${p * 100}%` }} />;
          })()}
        </div>

        {/* STAGE 3 */}
        <div
          style={{
            ...glassStyle,
            width: isPortrait ? '100%' : 450,
            borderRadius: style.borderRadius,
            overflow: 'hidden',
            border: s6FrontendPulse > 0.2 ? `1.5px solid ${reactCyan}` : glassStyle.border,
            opacity: interpolate(s6FrontendSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(s6FrontendSpring, [0, 1], [32, 0])}px) scale(${interpolate(s6FrontendSpring, [0, 1], [0.92, 1])})`,
          }}
        >
          <div style={{ padding: '16px 24px', background: appleDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.32)', borderBottom: appleDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ReactIcon size={28} color={reactCyan} rotationDeg={(tFrame - 830) * 1.6} />
              <span style={{ fontSize: 24, fontWeight: 700 }}>
                {content.text || 'Front-End UI'}
              </span>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: nodeGreen, opacity: 0.35 + s6FrontendPulse * 0.65 }} />
          </div>

          <div style={{ padding: isPortrait ? '22px 26px' : '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
            <div style={{ ...innerGlassStyle, flex: 1, borderRadius: 18, padding: '18px 22px', border: s6FrontendPulse > 0.2 ? `1.5px solid ${nodeGreen}` : innerGlassStyle.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: textSecondary }}>
                  {content.badgeLabel || 'ESP32-01'}
                </span>
                <span style={{ fontSize: 18, fontWeight: 600, color: nodeGreen }}>
                  LIVE UI
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, transform: `scale(${1 + s6FrontendPulse * 0.1})` }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: s6FrontendPulse > 0.2 ? nodeGreen : textSecondary }}>
                  HB
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isPortrait ? 44 : 46, fontWeight: 800, color: textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {s6HbCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MqttWebSocketComposition: React.FC<StudioCompositionProps> = ({
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
    'mqtt'
  );

  // Normalize frame to 30fps timebase
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
      : createDefaultMqttClips(appleDarkMode, accentColor);

  // Higher trackRow renders underneath; trackRow 0 sits on top
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
      {/* Synchronized Uploaded Audio Track */}
      {audioEnabled && audioVolume > 0 && (
        <Audio
          src={audioSrc || '/assets/aistudio/web_socket_7fcd94b2.flac'}
          volume={audioVolume}
        />
      )}

      {/* Smooth Synthesized Sound FX Track */}
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
          <ScenePresetRenderer
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

import type {
  AspectPreset,
  CompositionDefinition,
  StudioCompositionProps,
} from './types';

export function generateRemotionConfigTs(): string {
  return `import { Config } from '@remotion/cli/config';

// Konfigurasi render Apple ProRes 4444 (.mov) dengan saluran Alpha (tanpa background)
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuva444p10le');
Config.setCodec('prores');
Config.setProResProfile('4444');
`;
}

export function generateRootTsx(
  comp: CompositionDefinition,
  aspect: AspectPreset,
  fps: number,
  durationInFrames: number,
  props: StudioCompositionProps
): string {
  const componentName = `${comp.id}Composition`;
  return `import React from 'react';
import { Composition } from 'remotion';
import { ${componentName} } from './compositions/${componentName}';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="${comp.id}"
        component={${componentName}}
        durationInFrames={${durationInFrames}}
        fps={${fps}}
        width={${aspect.width}}
        height={${aspect.height}}
        defaultProps={${JSON.stringify(props, null, 2).replace(/\n/g, '\n        ')}}
      />
    </>
  );
};
`;
}

export function generateCompositionTsx(
  comp: CompositionDefinition,
  props: StudioCompositionProps
): string {
  const componentName = `${comp.id}Composition`;
  const clips = props.clips ?? [];
  const audioEnabled = props.audioEnabled ?? true;

  const sequenceBlocks =
    clips.length > 0
      ? clips
          .filter((c) => c.visible)
          .sort((a, b) => b.trackRow - a.trackRow)
          .map((clip) => {
            const label = clip.name.replace(/-->/g, '->');
            const opacity = clip.style.opacity ?? 1;
            const scale = clip.style.scale ?? 1;
            const rot = clip.style.rotationDeg ?? 0;
            return `      {/* ${label} (${clip.kind}) */}
      <Sequence from={${clip.from}} durationInFrames={${clip.durationInFrames}}>
        <AbsoluteFill style={{ opacity: ${opacity} }}>
          <div
            style={{
              ...glassCard,
              position: 'absolute',
              left: '${clip.style.posX}%',
              top: '${clip.style.posY}%',
              transform: 'translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)',
              borderRadius: ${clip.style.borderRadius},
              fontFamily: ${JSON.stringify(clip.style.fontFamily)},
              color: ${JSON.stringify(clip.style.textColor)},
            }}
          >
            <div style={{ fontSize: ${clip.style.fontSize}, fontWeight: ${clip.style.fontWeight}, textAlign: 'center' }}>
              {${JSON.stringify(clip.content.text || clip.name)}}
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>`;
          })
          .join('\n')
      : `      <Sequence from={0} durationInFrames={120}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 120 }}>
          <div style={glassCard}>
            <h1 style={{ fontSize: 56, fontWeight: 700, textAlign: 'center', margin: 0 }}>
              {headline}
            </h1>
          </div>
        </AbsoluteFill>
      </Sequence>`;

  const resolvedAudioSrc =
    props.audioSrc ||
    (comp.id === 'SseProtocolExplainer'
      ? '/assets/aistudio/Sequence_01_71ffa7aa.mp3'
      : '/assets/aistudio/web_socket_7fcd94b2.flac');

  return `import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import type { TimelineClip } from './types';

export interface HybridCompositionProps {
  headline: string;
  accentColor: string;
  appleDarkMode: boolean;
  transparentBackground: boolean;
  audioEnabled: boolean;
  audioVolume: number;
  clips: TimelineClip[];
}

export const ${componentName}: React.FC<HybridCompositionProps> = ({
  headline = ${JSON.stringify(props.headline)},
  accentColor = ${JSON.stringify(props.accentColor)},
  appleDarkMode = ${props.appleDarkMode},
  transparentBackground = ${props.transparentBackground},
  audioEnabled = ${audioEnabled},
  audioVolume = ${props.audioVolume},
}) => {
  const rootBg = transparentBackground ? 'transparent' : appleDarkMode ? '#05070B' : '#E9EEF5';
  const textPrimary = appleDarkMode ? '#F5F5F7' : '#1D1D1F';
  const glassCard: React.CSSProperties = {
    background: appleDarkMode
      ? 'linear-gradient(145deg, rgba(22, 26, 38, 0.52) 0%, rgba(12, 15, 24, 0.36) 100%)'
      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.56) 0%, rgba(240, 245, 255, 0.38) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    border: appleDarkMode ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(255,255,255,0.78)',
    borderRadius: 30,
    padding: '36px 56px',
    boxShadow: \`0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px \${accentColor}25\`,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: rootBg, color: textPrimary }}>
      {audioEnabled && <Audio src=${JSON.stringify(resolvedAudioSrc)} volume={audioVolume} />}
${sequenceBlocks}
    </AbsoluteFill>
  );
};
`;
}

export function generateRenderCommand(
  comp: CompositionDefinition,
  fps: number,
  durationInFrames: number
): string {
  const slug = comp.id.toLowerCase();
  return `npx remotion render src/remotion/index.ts ${comp.id} out/${slug}-alpha-video-only.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --muted --fps=${fps} --frames=0-${durationInFrames - 1} --props=./props.json`;
}

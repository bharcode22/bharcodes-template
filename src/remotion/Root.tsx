import React from 'react';
import { Composition } from 'remotion';
import { COMPOSITIONS } from './registry';
import { ASPECT_PRESETS } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.values(COMPOSITIONS).map((comp) => {
        const aspect = ASPECT_PRESETS[comp.defaultAspect];
        return (
          <Composition
            key={comp.id}
            id={comp.id}
            component={comp.component as unknown as React.FC<Record<string, unknown>>}
            durationInFrames={comp.defaultDurationInFrames}
            fps={comp.defaultFps}
            width={aspect.width}
            height={aspect.height}
            defaultProps={comp.defaultProps as unknown as Record<string, unknown>}
          />
        );
      })}
    </>
  );
};

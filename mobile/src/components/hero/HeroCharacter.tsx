/**
 * The Home hero character (native port).
 *
 * On the web this is progressive enhancement: PNG always, plus an
 * alpha-channel idle-loop video or a 3D (three.js) stage on eligible
 * devices. Neither enhancement ships on native v1 — the hero renders the
 * full-body PNG artwork (same visual identity, zero risk). The component
 * keeps the exact web API (ref handle + props) so ported callers compile
 * unchanged; `playRandomInteraction` is a no-op without the 3D stage.
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { img } from '@/assets/registry';
import type { HeroVideoSource } from '@/constants/config';
import { cn } from '@/utils/cn';

export interface HeroCharacterHandle {
  /** Trigger a 3D interaction clip immediately (no-op on native/PNG mode). */
  playRandomInteraction: () => void;
}

interface HeroCharacterProps {
  /** Full-body PNG — web-style public path (e.g. '/hero-character.png'). */
  imgSrc: string;
  /** Web-only enhancement; accepted for API parity, unused on native. */
  videoSources?: readonly HeroVideoSource[];
  /** Web-only enhancement; accepted for API parity, unused on native. */
  modelSrc?: string;
  className?: string;
  imgClassName?: string;
}

export const HeroCharacter = forwardRef<HeroCharacterHandle, HeroCharacterProps>(
  function HeroCharacter({ imgSrc, className, imgClassName }, ref) {
    useImperativeHandle(ref, () => ({
      playRandomInteraction: () => {
        // No 3D stage on native — intentional no-op.
      },
    }));

    const source = img(imgSrc) ?? { uri: imgSrc };

    return (
      <View className={cn('absolute inset-0', className)} pointerEvents="none">
        <Image
          source={source}
          contentFit="contain"
          transition={200}
          className={cn('absolute inset-0', imgClassName)}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }
);

export default HeroCharacter;

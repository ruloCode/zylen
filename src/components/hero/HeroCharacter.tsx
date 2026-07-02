import {
  Suspense,
  forwardRef,
  lazy,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { HeroStage3DHandle } from './HeroStage3D';
import type { HeroVideoSource } from '@/constants/config';
import { cn } from '@/utils/cn';

const HeroStage3D = lazy(() => import('./HeroStage3D'));

export interface HeroCharacterHandle {
  /** Trigger a 3D interaction clip immediately (no-op on video/PNG modes). */
  playRandomInteraction: () => void;
}

interface HeroCharacterProps {
  /** Full-body PNG — loading placeholder and permanent fallback. */
  imgSrc: string;
  /**
   * Idle-loop clips (alpha channel) of the same artwork, ordered by source
   * priority (see getHeroVideoSources). Takes precedence over `modelSrc`.
   */
  videoSources?: readonly HeroVideoSource[];
  /** Rigged multi-clip GLB for the 3D stage; ignored when video is set. */
  modelSrc?: string;
  /**
   * The container box — should span the WHOLE hero scene (absolute inset-0)
   * so the 3D stage never clips animation extremes. The video/PNG layers
   * position themselves with `imgClassName` inside it.
   */
  className?: string;
  /** Positioning/sizing of the PNG and video layers within the container. */
  imgClassName?: string;
}

interface DataSavingNavigator extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

/**
 * Whether this device should get a perpetually-moving hero at all.
 * Reduced-motion users asked for no motion (repo-wide
 * `motion-reduce:animate-none` convention — an "always moving" lobby hero is
 * the exact opposite), and Save-Data users shouldn't pay for multi-MB media.
 */
function canAnimate(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  const nav = navigator as DataSavingNavigator;
  return nav.connection?.saveData !== true;
}

/** Extra gates for the (heavier) WebGL path. */
function canRender3D(): boolean {
  if (!canAnimate()) return false;
  const nav = navigator as DataSavingNavigator;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 3) return false;
  const probe = document.createElement('canvas');
  return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
}

/**
 * The Home hero character: always renders the PNG, and on eligible devices
 * layers the animated version on top — an alpha-channel idle-loop video of
 * the original artwork when the avatar ships one, else the 3D stage when it
 * ships a GLB. Any load/decode failure just leaves the PNG visible — the
 * animation is pure progressive enhancement.
 */
const HeroCharacter = forwardRef<HeroCharacterHandle, HeroCharacterProps>(
  function HeroCharacter(
    { imgSrc, videoSources, modelSrc, className, imgClassName },
    ref
  ) {
    const stageRef = useRef<HeroStage3DHandle>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    const [stageReady, setStageReady] = useState(false);
    const [stageFailed, setStageFailed] = useState(false);
    const animatable = useMemo(() => canAnimate(), []);
    const eligible3D = useMemo(() => canRender3D(), []);

    const showVideo =
      Boolean(videoSources?.length) && animatable && !videoFailed;
    const show3D =
      !showVideo && Boolean(modelSrc) && eligible3D && !stageFailed;
    const animationReady = (showVideo && videoReady) || (show3D && stageReady);

    useImperativeHandle(ref, () => ({
      playRandomInteraction: () => stageRef.current?.playRandomInteraction(),
    }));

    return (
      <div className={className} aria-hidden="true">
        <img
          src={imgSrc}
          alt=""
          className={cn(imgClassName, animationReady && 'opacity-0')}
          onError={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        />
        {showVideo && (
          <video
            className={cn(
              imgClassName,
              'transition-opacity duration-300',
              videoReady ? 'opacity-100' : 'opacity-0'
            )}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            onCanPlay={() => setVideoReady(true)}
            onError={() => {
              setVideoReady(false);
              setVideoFailed(true);
            }}
          >
            {videoSources?.map((source, index) => (
              <source
                key={source.src}
                src={source.src}
                type={source.type}
                // A <source> that fails to load errors on the element itself,
                // not the <video>; the last one must trip the PNG fallback.
                onError={
                  index === videoSources.length - 1
                    ? () => {
                        setVideoReady(false);
                        setVideoFailed(true);
                      }
                    : undefined
                }
              />
            ))}
          </video>
        )}
        {show3D && modelSrc && (
          <Suspense fallback={null}>
            <HeroStage3D
              ref={stageRef}
              modelSrc={modelSrc}
              onReady={() => setStageReady(true)}
              onError={() => {
                setStageReady(false);
                setStageFailed(true);
              }}
            />
          </Suspense>
        )}
      </div>
    );
  }
);

export default HeroCharacter;

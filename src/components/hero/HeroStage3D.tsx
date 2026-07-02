import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { HeroScene } from './heroScene';
import { cn } from '@/utils/cn';

export interface HeroStage3DHandle {
  playRandomInteraction: () => void;
}

interface HeroStage3DProps {
  /** Rigged multi-clip GLB (see AVATAR_OPTIONS[].model). */
  modelSrc: string;
  /** First rendered frame — safe to hide the PNG placeholder underneath. */
  onReady?: () => void;
  /** Load/render failure — caller must keep the PNG fallback visible. */
  onError?: () => void;
}

/**
 * Thin React wrapper around the imperative HeroScene. Default export so the
 * caller can React.lazy() it — three.js only downloads when a device is
 * actually going to render the 3D hero.
 */
const HeroStage3D = forwardRef<HeroStage3DHandle, HeroStage3DProps>(
  function HeroStage3D({ modelSrc, onReady, onError }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<HeroScene | null>(null);
    const [ready, setReady] = useState(false);

    // Keep callbacks out of the effect deps: a parent re-render must not
    // tear down the WebGL context.
    const callbacksRef = useRef({ onReady, onError });
    callbacksRef.current = { onReady, onError };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      const scene = new HeroScene(canvas, modelSrc, {
        onReady: () => {
          setReady(true);
          callbacksRef.current.onReady?.();
        },
        onError: () => callbacksRef.current.onError?.(),
      });
      sceneRef.current = scene;
      return () => {
        sceneRef.current = null;
        scene.dispose();
      };
    }, [modelSrc]);

    useImperativeHandle(ref, () => ({
      playRandomInteraction: () => sceneRef.current?.playRandomInteraction(),
    }));

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-300',
          ready ? 'opacity-100' : 'opacity-0'
        )}
      />
    );
  }
);

export default HeroStage3D;

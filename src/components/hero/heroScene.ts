import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/**
 * Camera framing constants — the canvas spans the WHOLE hero scene (the
 * aspect-[941/1672] container in Dashboard.tsx), not just the character box,
 * so raised arms / jumps never clip at the canvas edges. Derived from the
 * ASSET ALIGNMENT convention: the PNG character box is 58% of the scene
 * width at 2:3 (≈49% of the scene height) with the figure filling 86% of it
 * → the character stands 0.49 × 0.86 ≈ 0.421 of the scene height, and its
 * feet land on the platform rune at 72.4% of the scene height.
 * FILL = fraction of the canvas height the (A-pose) character occupies;
 * FEET_Y = where the feet (model y=0) project vertically (0 top, 1 bottom).
 */
const CAMERA_FOV = 28;
const CHARACTER_FILL = 0.421;
const FEET_Y = 0.724;

/**
 * Meshy's animated rigs come out facing -x (the docs say +z, but the
 * animation retarget adds a -90° root turn). Rotate the whole model group so
 * the character faces the camera on +z.
 */
const MODEL_ROTATION_Y = Math.PI / 2;

/** Idle → random interaction every 8–15s, like a game lobby. */
const INTERACTION_MIN_DELAY_MS = 8_000;
const INTERACTION_MAX_DELAY_MS = 15_000;
const CROSSFADE_S = 0.35;

/**
 * Soft elliptical blob under the character's feet. Replaces the CSS
 * drop-shadow the PNG hero used — a per-frame CSS filter over a scene-sized
 * canvas is expensive on mobile, and an in-scene shadow grounds the figure
 * better while it moves. A camera-facing sprite (not a ground plane): the
 * hero camera is nearly level, so a flat plane would be seen edge-on.
 */
function makeContactShadow(characterHeight: number): THREE.Sprite {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.16)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.scale.set(characterHeight * 0.52, characterHeight * 0.11, 1);
  sprite.position.set(0, characterHeight * 0.02, 0);
  return sprite;
}

interface HeroSceneCallbacks {
  /** First frame with the model actually rendered. */
  onReady?: () => void;
  /** Model failed to load — caller should keep the PNG fallback visible. */
  onError?: (error: unknown) => void;
}

/**
 * Imperative three.js scene for the animated hero on the Home: one rigged
 * multi-clip GLB over a transparent canvas. The idle clip loops forever;
 * every 8–15s (or on demand via playRandomInteraction) one of the other
 * clips plays once with a crossfade, then idle fades back in — the "game
 * lobby" cycle.
 *
 * Rendering pauses whenever the tab is hidden or the container leaves the
 * viewport. dispose() is idempotent (React 18 StrictMode double-mounts in
 * dev).
 */
export class HeroScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 2 / 3, 0.01, 100);
  private clock = new THREE.Clock();
  private mixer: THREE.AnimationMixer | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private interactions: THREE.AnimationAction[] = [];
  private currentInteraction: THREE.AnimationAction | null = null;
  private lastInteractionIndex = -1;

  private rafId: number | null = null;
  private interactionTimer: number | null = null;
  private visible = true;
  private inViewport = true;
  private disposed = false;
  private modelReady = false;

  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private readonly onVisibilityChange = (): void => {
    this.visible = document.visibilityState === 'visible';
    this.syncRunning();
  };

  constructor(
    private canvas: HTMLCanvasElement,
    modelSrc: string,
    private callbacks: HeroSceneCallbacks = {}
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // No tone mapping: keep the baked Meshy texture colors faithful to the
    // original 2D art (ACES would desaturate vs the PNG the canvas replaces).
    this.renderer.toneMapping = THREE.NoToneMapping;

    // Cool ambient + a warm key from the upper front, echoing the torchlit
    // hero background the character stands on.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x38465a, 1.1));
    const key = new THREE.DirectionalLight(0xffe0b8, 1.4);
    key.position.set(0.6, 1.6, 1.2);
    this.scene.add(key);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.inViewport = entries[0]?.isIntersecting ?? true;
      this.syncRunning();
    });
    this.intersectionObserver.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.loadModel(modelSrc);
  }

  /**
   * Play a random interaction clip right now (no-op while one is already
   * playing). Also used by the tap-to-interact handler on the Home.
   */
  playRandomInteraction(): void {
    if (this.disposed || !this.modelReady || this.currentInteraction) return;
    this.clearInteractionTimer();
    this.startInteraction();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.clearInteractionTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.mixer?.stopAllAction();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }

  private loadModel(modelSrc: string): void {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      modelSrc,
      (gltf) => {
        if (this.disposed) return;
        this.setupModel(gltf.scene, gltf.animations);
      },
      undefined,
      (error) => {
        if (this.disposed) return;
        this.callbacks.onError?.(error);
      }
    );
  }

  private setupModel(root: THREE.Group, clips: THREE.AnimationClip[]): void {
    // Face the camera first — the rotation changes the world-space box.
    root.rotation.y = MODEL_ROTATION_Y;
    // Measure the whole object in world space (Meshy armatures carry odd
    // node scales — never trust individual bones, only the composed box).
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const height = size.y || 1;

    // Feet on y=0, centred on x/z. The Meshy model faces +z, so a camera on
    // +z looking back gives the frontal view matching the PNG.
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;
    this.scene.add(root);
    this.scene.add(makeContactShadow(height));

    // Frame the character like the PNG: it fills CHARACTER_FILL of the
    // canvas height and the feet project at FEET_Y. With a level camera the
    // visible height at the target plane is H/FILL, so the view centre sits
    // where the canvas midpoint (0.5) lands between feet (FEET_Y) and top.
    const visibleHeight = height / CHARACTER_FILL;
    const centerY = (FEET_Y - 0.5) * visibleHeight;
    const dist = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2));
    this.camera.position.set(0, centerY, dist);
    this.camera.lookAt(0, centerY, 0);

    const mixer = new THREE.AnimationMixer(root);
    this.mixer = mixer;
    const idleClip =
      clips.find((clip) => /idle/i.test(clip.name)) ?? clips[0] ?? null;
    if (idleClip) {
      this.idleAction = mixer.clipAction(idleClip);
      this.idleAction.play();
    }
    this.interactions = clips
      .filter((clip) => clip !== idleClip)
      .map((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        return action;
      });
    mixer.addEventListener('finished', (event) => {
      if (event.action !== this.currentInteraction) return;
      this.currentInteraction = null;
      if (this.idleAction) {
        this.idleAction.reset().play();
        this.idleAction.crossFadeFrom(event.action, CROSSFADE_S, false);
      }
      this.scheduleInteraction();
    });

    this.modelReady = true;
    this.resize();
    this.scheduleInteraction();
    this.syncRunning();
    // Render one frame synchronously so onReady never shows an empty canvas.
    this.renderFrame(0);
    this.callbacks.onReady?.();
  }

  private startInteraction(): void {
    if (!this.mixer || !this.idleAction || this.interactions.length === 0) {
      return;
    }
    let index = Math.floor(Math.random() * this.interactions.length);
    if (this.interactions.length > 1 && index === this.lastInteractionIndex) {
      index = (index + 1) % this.interactions.length;
    }
    this.lastInteractionIndex = index;
    const action = this.interactions[index];
    if (!action) return;
    this.currentInteraction = action;
    action.reset().play();
    this.idleAction.crossFadeTo(action, CROSSFADE_S, false);
  }

  private scheduleInteraction(): void {
    this.clearInteractionTimer();
    if (this.disposed || !this.running()) return;
    const delay =
      INTERACTION_MIN_DELAY_MS +
      Math.random() * (INTERACTION_MAX_DELAY_MS - INTERACTION_MIN_DELAY_MS);
    this.interactionTimer = window.setTimeout(() => {
      this.interactionTimer = null;
      this.startInteraction();
    }, delay);
  }

  private clearInteractionTimer(): void {
    if (this.interactionTimer !== null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = null;
    }
  }

  private running(): boolean {
    return !this.disposed && this.visible && this.inViewport;
  }

  /** Start/stop the render loop and scheduler to match visibility state. */
  private syncRunning(): void {
    if (this.running() && this.modelReady) {
      if (this.rafId === null) {
        this.clock.getDelta(); // swallow the pause so clips don't jump
        this.rafId = requestAnimationFrame(this.tick);
      }
      if (this.interactionTimer === null && !this.currentInteraction) {
        this.scheduleInteraction();
      }
    } else {
      this.stopLoop();
      this.clearInteractionTimer();
    }
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private readonly tick = (): void => {
    this.rafId = null;
    if (!this.running()) return;
    this.renderFrame(this.clock.getDelta());
    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderFrame(delta: number): void {
    this.mixer?.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

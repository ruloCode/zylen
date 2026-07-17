/**
 * HeroModelPreview — lightweight auto-rotating GLB viewer for the forged
 * 3D hero. three.js is imported dynamically so the Profile chunk stays slim
 * (the viewer only loads once a hero exists).
 *
 * Plays the hero's Idle clip. Sizing measures BONE world positions instead
 * of the mesh bbox — Meshy rigs ship an Armature scaled 0.01, so a naive
 * Box3 reads ~0.01 units (same fix the arena game uses).
 */

import { useEffect, useRef } from 'react';

interface HeroModelPreviewProps {
  url: string;
  className?: string;
}

export function HeroModelPreview({ url, className }: HeroModelPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      if (disposed || !mount) return;

      const width = mount.clientWidth || 240;
      const height = mount.clientHeight || 240;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0x8a7ae0, 0x1a1233, 1.2));
      const dir = new THREE.DirectionalLight(0xdfefff, 1.6);
      dir.position.set(3, 6, 4);
      scene.add(dir);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0, 1.05, 2.6);
      camera.lookAt(0, 0.72, 0);

      const clock = new THREE.Clock();
      let mixer: import('three').AnimationMixer | null = null;
      const pivot = new THREE.Group();
      scene.add(pivot);

      new GLTFLoader().load(
        url,
        (gltf) => {
          if (disposed) return;
          const inst = gltf.scene;
          inst.traverse((o) => {
            o.frustumCulled = false;
          });
          // Measure height from bone world positions (Meshy Armature 0.01 fix).
          inst.updateMatrixWorld(true);
          const v = new THREE.Vector3();
          let minY = Infinity;
          let maxY = -Infinity;
          inst.traverse((o) => {
            if ((o as { isBone?: boolean }).isBone) {
              o.getWorldPosition(v);
              minY = Math.min(minY, v.y);
              maxY = Math.max(maxY, v.y);
            }
          });
          let boneH = maxY - minY;
          if (!isFinite(boneH) || boneH < 0.01) boneH = 1.2;
          const s = 1.4 / (boneH * 1.08);
          inst.scale.multiplyScalar(s);
          inst.position.y -= minY * s;
          pivot.add(inst);

          const idle =
            gltf.animations.find((c) => /idle/i.test(c.name)) ?? gltf.animations[0];
          if (idle) {
            mixer = new THREE.AnimationMixer(inst);
            mixer.clipAction(idle).play();
          }
        },
        undefined,
        (err) => console.warn('HeroModelPreview load failed:', err)
      );

      const animate = () => {
        raf = requestAnimationFrame(animate);
        const dt = clock.getDelta();
        pivot.rotation.y += dt * 0.6;
        mixer?.update(dt);
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [url]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}

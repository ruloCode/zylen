/**
 * HeroModelPreview — auto-rotating GLB viewer for the forged 3D hero.
 *
 * RN has no DOM/WebGL, so the three.js scene runs inside a transparent
 * WebView with self-contained HTML (three + GLTFLoader from the unpkg CDN
 * via an import map). Mirrors the web viewer (../src/features/profile/
 * components/HeroModelPreview.tsx): HemisphereLight + DirectionalLight,
 * 38° camera, 0.6 rad/s auto-rotation, looping Idle clip, and the bone
 * world-position sizing fix (Meshy rigs ship an Armature scaled 0.01, so a
 * naive Box3 reads ~0.01 units — same fix the arena game uses).
 *
 * If the WebView can't run the scene (offline, no import-map support, WebGL
 * failure), it falls back to the user's full-body avatar image.
 */

import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { cn } from '@/utils';
import { useUser } from '@/store';
import { getHeroBodySrc } from '@/constants';
import { img } from '@/assets/registry';

interface HeroModelPreviewProps {
  url: string;
  className?: string;
}

/** Silent-failure watchdog: WebGL/CDN can die without an error event. */
const LOAD_TIMEOUT_MS = 20_000;

function buildViewerHtml(url: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  canvas { display: block; }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<script>
  function post(msg) {
    try { window.ReactNativeWebView.postMessage(msg); } catch (e) {}
  }
  // Any uncaught error (no import-map support, CDN down, WebGL) -> fallback.
  window.addEventListener('error', function () { post('error'); }, true);
  window.addEventListener('unhandledrejection', function () { post('error'); });
</script>
<script type="module">
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

  const url = ${JSON.stringify(url)};
  try {
    const width = window.innerWidth || 240;
    const height = window.innerHeight || 240;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0x8a7ae0, 0x1a1233, 1.2));
    const dir = new THREE.DirectionalLight(0xdfefff, 1.6);
    dir.position.set(3, 6, 4);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.05, 2.6);
    camera.lookAt(0, 0.72, 0);

    const clock = new THREE.Clock();
    let mixer = null;
    const pivot = new THREE.Group();
    scene.add(pivot);

    new GLTFLoader().load(
      url,
      (gltf) => {
        const inst = gltf.scene;
        inst.traverse((o) => { o.frustumCulled = false; });
        // Measure height from bone world positions (Meshy Armature 0.01 fix).
        inst.updateMatrixWorld(true);
        const v = new THREE.Vector3();
        let minY = Infinity;
        let maxY = -Infinity;
        inst.traverse((o) => {
          if (o.isBone) {
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
        post('loaded');
      },
      undefined,
      () => post('error')
    );

    const animate = () => {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      pivot.rotation.y += dt * 0.6;
      if (mixer) mixer.update(dt);
      renderer.render(scene, camera);
    };
    animate();
  } catch (e) {
    post('error');
  }
</script>
</body>
</html>`;
}

export function HeroModelPreview({ url, className }: HeroModelPreviewProps) {
  const { user } = useUser();
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);
  const html = useMemo(() => buildViewerHtml(url), [url]);

  const onMessage = (event: WebViewMessageEvent) => {
    const msg = event.nativeEvent.data;
    if (msg === 'loaded') loadedRef.current = true;
    if (msg === 'error' && !loadedRef.current) setFailed(true);
  };

  if (failed) {
    const bodySrc = getHeroBodySrc(user?.avatarUrl, user?.avatarBodyUrl);
    const source = /^https?:\/\//i.test(bodySrc) ? { uri: bodySrc } : img(bodySrc);
    return (
      <View className={cn('overflow-hidden', className)} aria-hidden>
        <Image source={source} style={{ width: '100%', height: '100%' }} contentFit="contain" />
      </View>
    );
  }

  return (
    <View className={className} aria-hidden>
      <WebView
        key={url}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={onMessage}
        onError={() => setFailed(true)}
        onLoadEnd={() => {
          // Watchdog: no 'loaded'/'error' message in time -> silent failure.
          setTimeout(() => {
            if (!loadedRef.current) setFailed(true);
          }, LOAD_TIMEOUT_MS);
        }}
        // WebGL needs the hardware layer on Android; transparent so the
        // themed card background shows through around the hero.
        androidLayerType="hardware"
        style={{ flex: 1, backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        bounces={false}
        scrollEnabled={false}
        setBuiltInZoomControls={false}
        overScrollMode="never"
      />
    </View>
  );
}

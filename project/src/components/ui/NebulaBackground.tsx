import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type NebulaBackgroundHandle = {
  triggerRipple: () => void;
};

interface NebulaBackgroundProps {
  className?: string;
}

const NebulaBackground = forwardRef<NebulaBackgroundHandle, NebulaBackgroundProps>(({ className }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep references to THREE objects for cleanup and imperative controls
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    composer: EffectComposer;
    controls: OrbitControls;
    material: THREE.ShaderMaterial;
    clock: THREE.Clock;
    cameraShakeGroup: THREE.Group;
    bloomPass: UnrealBloomPass;
    rafId: number | null;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    triggerRipple: () => {
      const t = threeRef.current;
      if (!t) return;
      const { material, clock } = t;
      if (!material || !material.uniforms) return;

      material.uniforms.rippleTime.value = material.uniforms.time.value;
      material.uniforms.rippleActive.value = 1.0;
      // Small camera shake via cameraShakeGroup handled in animate when rippleActive
      // Also bloom pulse handled in animate
    }
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x010005, 1);
    containerRef.current.appendChild(renderer.domElement);

    const cameraShakeGroup = new THREE.Group();
    scene.add(cameraShakeGroup);
    cameraShakeGroup.add(camera);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.minDistance = 15;
    controls.maxDistance = 150;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;

    // Responsive particle density for performance/clarity
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const shortSide = Math.min(viewportW, viewportH);
    let particleCount = 200000; // desktop default
    if (shortSide <= 480) {
      particleCount = 80000; // mobile
    } else if (shortSide <= 768) {
      particleCount = 120000; // tablet
    }
    let currentParticleCount = particleCount;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color('#ff4800'),
      new THREE.Color('#ff8c00'),
      new THREE.Color('#ffd700'),
      new THREE.Color('#dc2626')
    ];

    const arms = 5;
    const armSpread = 0.5;
    const galaxyRadius = shortSide <= 480 ? 30 : shortSide <= 768 ? 35 : 40;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const armIndex = Math.floor(Math.random() * arms);
      const angle = (armIndex / arms) * Math.PI * 2;
      const dist = Math.random() * galaxyRadius;
      const armAngle = dist * 0.15;
      const spiralAngle = angle + armAngle + (Math.random() - 0.5) * armSpread;
      const randomHeight = (Math.random() - 0.5) * 5 * (1 - dist / galaxyRadius);

      positions[i3] = Math.cos(spiralAngle) * dist;
      positions[i3 + 1] = Math.sin(spiralAngle) * dist;
      positions[i3 + 2] = randomHeight;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const lightness = 0.7 + Math.random() * 0.3;
      colors[i3] = color.r * lightness;
      colors[i3 + 1] = color.g * lightness;
      colors[i3 + 2] = color.b * lightness;

      randoms[i] = Math.random() * 10.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    // Initial responsive point size before resize handler runs
    const initialPointSize = (shortSide <= 480 ? 2.2 : shortSide <= 768 ? 2.6 : 3.0) * window.devicePixelRatio;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        rippleActive: { value: 0.0 },
        rippleTime: { value: 0.0 },
        uPointSize: { value: initialPointSize },
      },
      vertexShader: `
        uniform float time;
        uniform float rippleActive;
        uniform float rippleTime;
        uniform float uPointSize;
        attribute vec3 color;
        attribute float aRandom;
        varying vec3 vColor;
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        void main() {
          vColor = color;
          vec3 pos = position;
          float morphFactor = sin(time * 0.1 + aRandom) * 0.5 + 0.5;
          float noiseFreq = 0.05;
          float noiseAmp = 15.0;
          vec3 nebulaPos = pos;
          nebulaPos.x += snoise(pos.yz * noiseFreq + time * 0.05) * noiseAmp;
          nebulaPos.y += snoise(pos.xz * noiseFreq + time * 0.05) * noiseAmp;
          nebulaPos.z += snoise(pos.xy * noiseFreq + time * 0.05) * noiseAmp;
          pos = mix(pos, nebulaPos, morphFactor);
          float angle = -time * 0.05;
          mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          pos.xy = rotation * pos.xy;
          if (rippleActive > 0.5) {
            float timeSinceRipple = time - rippleTime;
            if (timeSinceRipple > 0.0) {
              float waveSpeed = 80.0;
              float waveWidth = 25.0;
              float waveRadius = timeSinceRipple * waveSpeed;
              float distFromCenter = length(pos.xy);
              float distFromWavefront = abs(distFromCenter - waveRadius);
              float profile = exp(-pow(distFromWavefront / waveWidth, 2.0));
              float fadeout = smoothstep(4.0, 2.5, timeSinceRipple);
              float waveInfluence = profile * fadeout;
              if (waveInfluence > 0.01) {
                vec3 dir = normalize(pos);
                pos += dir * waveInfluence * 35.0;
                pos.z += snoise(pos.xy * 0.1 + time * 2.0) * waveInfluence * 10.0;
              }
            }
          }
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uPointSize / -mvPosition.z;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
          if (r > 1.0) discard;
          float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
          float spikes = 5.0;
          float star_boundary = cos(angle * spikes) * 0.2 + 0.8;
          float alpha = 1.0 - smoothstep(star_boundary - 0.1, star_boundary, r);
          alpha *= pow(1.0 - r, 0.4);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 70;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    const baseBloomStrength = 0.65;
    bloomPass.threshold = 0;
    bloomPass.strength = baseBloomStrength;
    bloomPass.radius = 0.5;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const clock = new THREE.Clock();
    let shakeIntensity = 0;
    let bloomPulseTime = -1;

    const animate = () => {
      const deltaTime = clock.getDelta();
      const time = (material.uniforms.time.value += deltaTime);

      if (bloomPulseTime > 0) {
        const timeSincePulse = time - bloomPulseTime;
        const pulseDuration = 2.0;
        if (timeSincePulse < pulseDuration) {
          const pulseProgress = timeSincePulse / pulseDuration;
          const pulseCurve = Math.sin(pulseProgress * Math.PI);
          bloomPass.strength = baseBloomStrength + pulseCurve * 2.0;
        } else {
          bloomPass.strength = baseBloomStrength;
          bloomPulseTime = -1;
        }
      }

      if (material.uniforms.rippleActive.value > 0.5) {
        const timeSinceRipple = time - material.uniforms.rippleTime.value;
        if (timeSinceRipple > 4.0) {
          material.uniforms.rippleActive.value = 0.0;
        }
        // Camera shake during ripple
        if (shakeIntensity <= 0) shakeIntensity = 1.0;
        if (timeSinceRipple > 0.0) {
          const decay = 2.0;
          shakeIntensity = Math.max(0, shakeIntensity - deltaTime * decay);
          cameraShakeGroup.position.x = (Math.random() - 0.5) * shakeIntensity;
          cameraShakeGroup.position.y = (Math.random() - 0.5) * shakeIntensity;
        }
        // Bloom pulse trigger
        if (bloomPulseTime < 0) bloomPulseTime = material.uniforms.time.value;
      } else {
        cameraShakeGroup.position.set(0, 0, 0);
      }

      controls.update();
      composer.render();
      _three.rafId = requestAnimationFrame(animate);
    };

    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);

      const shortSideNow = Math.min(width, height);
      // Adjust point size a bit smaller on small screens
      const dpr = window.devicePixelRatio;
      const pointSize = shortSideNow <= 480 ? 2.2 : shortSideNow <= 768 ? 2.6 : 3.0;
      material.uniforms.uPointSize.value = pointSize * dpr;

      // Recreate geometry if the target particle count changes with viewport
      let targetCount = 200000;
      if (shortSideNow <= 480) targetCount = 80000;
      else if (shortSideNow <= 768) targetCount = 120000;

      if (targetCount !== currentParticleCount) {
        // Re-generate attributes
        const positions = new Float32Array(targetCount * 3);
        const colors = new Float32Array(targetCount * 3);
        const randoms = new Float32Array(targetCount);

        const arms = 5;
        const armSpread = 0.5;
        const galaxyRadius = shortSideNow <= 480 ? 30 : shortSideNow <= 768 ? 35 : 40;

        for (let i = 0; i < targetCount; i++) {
          const i3 = i * 3;
          const armIndex = Math.floor(Math.random() * arms);
          const angle = (armIndex / arms) * Math.PI * 2;
          const dist = Math.random() * galaxyRadius;
          const armAngle = dist * 0.15;
          const spiralAngle = angle + armAngle + (Math.random() - 0.5) * armSpread;
          const randomHeight = (Math.random() - 0.5) * 5 * (1 - dist / galaxyRadius);

          positions[i3] = Math.cos(spiralAngle) * dist;
          positions[i3 + 1] = Math.sin(spiralAngle) * dist;
          positions[i3 + 2] = randomHeight;

          const colorPalette = [
            new THREE.Color('#ff4800'),
            new THREE.Color('#ff8c00'),
            new THREE.Color('#ffd700'),
            new THREE.Color('#dc2626')
          ];
          const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          const lightness = 0.7 + Math.random() * 0.3;
          colors[i3] = color.r * lightness;
          colors[i3 + 1] = color.g * lightness;
          colors[i3 + 2] = color.b * lightness;

          randoms[i] = Math.random() * 10.0;
        }

        const newGeometry = new THREE.BufferGeometry();
        newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        newGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        newGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        // Swap geometry on the existing points
        particles.geometry.dispose();
        particles.geometry = newGeometry;
        currentParticleCount = targetCount;
      }
    };

    window.addEventListener('resize', onResize);

    const _three = {
      renderer,
      scene,
      camera,
      composer,
      controls,
      material,
      clock,
      cameraShakeGroup,
      bloomPass,
      rafId: null as number | null,
    };

    threeRef.current = _three;

    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      if (threeRef.current?.rafId) cancelAnimationFrame(threeRef.current.rafId);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      threeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}
    />
  );
});

NebulaBackground.displayName = 'NebulaBackground';

export default NebulaBackground;

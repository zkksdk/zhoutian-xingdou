/* ============================================================
   周天星斗大阵 · 8. 阵眼：太阳星 / 太阴星
   源文件分节 #8 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr, NOISE } from './00-utils.js';
import { canvas, U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   8. 阵眼：太阳星 / 太阴星
   ============================================================ */
const coreGroup = new THREE.Group();
arrayGroup.add(coreGroup);

/* ---------- 太阳星 ---------- */
const sunMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time, uFlash: U.coreFlash },
  vertexShader: `
    varying vec3 vPos;
    varying vec3 vNormal;
    void main(){
      vPos = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: NOISE + `
    uniform float uTime, uFlash;
    varying vec3 vPos;
    varying vec3 vNormal;
    void main(){
      float n1 = fbm(vPos * 1.6 + vec3(0.0, uTime * 0.42, 0.0));
      float n2 = fbm(vPos * 3.4 - vec3(uTime * 0.55, 0.0, uTime * 0.22));
      float n3 = fbm(vPos * 7.0 + vec3(uTime * 0.9, uTime * 0.4, 0.0));
      float f = n1 * 0.5 + n2 * 0.32 + n3 * 0.18;
      f = f * 0.5 + 0.5;

      vec3 c1 = vec3(0.55, 0.08, 0.01);
      vec3 c2 = vec3(1.00, 0.42, 0.04);
      vec3 c3 = vec3(1.00, 0.85, 0.35);
      vec3 c4 = vec3(1.00, 1.00, 0.92);

      vec3 col = mix(c1, c2, smoothstep(0.25, 0.55, f));
      col = mix(col, c3, smoothstep(0.5, 0.78, f));
      col = mix(col, c4, pow(smoothstep(0.72, 1.0, f), 1.6));

      float rim = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
      col += vec3(1.0, 0.5, 0.15) * pow(rim, 2.5) * 1.2;

      col *= (1.1 + min(uFlash, 1.0) * 0.8);
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(2.8, 48, 32), sunMat);
coreGroup.add(sun);

/* ---------- 太阴星 ---------- */
const moonMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time, uFlash: U.coreFlash },
  vertexShader: `
    varying vec3 vPos;
    varying vec3 vNormal;
    void main(){
      vPos = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: NOISE + `
    uniform float uTime, uFlash;
    varying vec3 vPos;
    varying vec3 vNormal;
    void main(){
      float n1 = fbm(vPos * 2.2 + vec3(uTime * 0.09, 0.0, 0.0));
      float n2 = fbm(vPos * 5.5 - vec3(0.0, uTime * 0.14, 0.0));
      float n3 = fbm(vPos * 11.0 + vec3(0.0, 0.0, uTime * 0.20));
      float f = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
      f = f * 0.5 + 0.5;

      // 冰晶裂纹
      float crack = smoothstep(0.48, 0.52, abs(sin(f * 22.0 + n2 * 8.0)));

      vec3 c1 = vec3(0.10, 0.16, 0.32);
      vec3 c2 = vec3(0.55, 0.72, 0.95);
      vec3 c3 = vec3(0.92, 0.97, 1.00);

      vec3 col = mix(c1, c2, smoothstep(0.3, 0.65, f));
      col = mix(col, c3, pow(smoothstep(0.6, 1.0, f), 2.0));
      col += vec3(0.6, 0.85, 1.0) * crack * 0.35;

      float rim = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
      col += vec3(0.55, 0.80, 1.0) * pow(rim, 2.2) * 1.1;

      col *= (1.0 + min(uFlash, 1.0) * 0.7);
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
const moon = new THREE.Mesh(new THREE.SphereGeometry(2.0, 40, 28), moonMat);
coreGroup.add(moon);

/* ---------- 核心光晕 Sprite ---------- */
function makeGlowTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.12, 'rgba(255,235,180,0.85)');
  grd.addColorStop(0.35, 'rgba(255,160,60,0.30)');
  grd.addColorStop(0.65, 'rgba(255,90,30,0.08)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = makeGlowTexture();

const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xffaa44, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.70
}));
sunGlow.scale.set(16, 16, 1);
coreGroup.add(sunGlow);

const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0x66bbff, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.60
}));
moonGlow.scale.set(12, 12, 1);
coreGroup.add(moonGlow);

/* ---------- 日月能量纽带 ---------- */
const bondMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      float t = vUv.y;
      float flow = 0.5 + 0.5 * sin(t * 18.0 - uTime * 4.5);
      float flow2 = 0.5 + 0.5 * sin(t * 6.0 + uTime * 1.8);
      float edge = sin(vUv.x * 3.14159);
      float a = edge * (0.18 + 0.55 * flow * flow + 0.25 * flow2);
      vec3 col = mix(vec3(1.0, 0.55, 0.12), vec3(0.45, 0.80, 1.0), t);
      gl_FragColor = vec4(col * a * 1.8, a);
    }
  `
});
const bondMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 8, 1, true), bondMat);
coreGroup.add(bondMesh);

/* ---------- 日珥 / 冰晶粒子 ---------- */
const PROM_N = isMobile ? 160 : 320;
const promGeo = new THREE.BufferGeometry();
const promPos = new Float32Array(PROM_N * 3);
const promCol = new Float32Array(PROM_N * 3);
const promSize = new Float32Array(PROM_N);
const promData = [];
for (let i = 0; i < PROM_N; i++) {
  promData.push({
    ang: rnd() * Math.PI * 2,
    el: rr(-0.8, 0.8),
    r: rr(3.0, 3.4),
    spd: rr(1.5, 5.5),
    life: rnd(),
    isSun: rnd() > 0.42
  });
  promSize[i] = rr(0.10, 0.32);
}
promGeo.setAttribute('position', new THREE.BufferAttribute(promPos, 3).setUsage(THREE.DynamicDrawUsage));
promGeo.setAttribute('aColor', new THREE.BufferAttribute(promCol, 3));
promGeo.setAttribute('aSize', new THREE.BufferAttribute(promSize, 1));

const promMat = new THREE.ShaderMaterial({
  uniforms: { uScale: U.scale },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    uniform float uScale;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vColor = aColor;
      gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.5, 20.0);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main(){
      vec2 p = gl_PointCoord - 0.5;
      float r2 = dot(p, p) * 4.0;
      if(r2 > 1.0) discard;
      gl_FragColor = vec4(vColor * 2.0, exp(-r2 * 3.0));
    }
  `
});
const promPoints = new THREE.Points(promGeo, promMat);
promPoints.frustumCulled = false;
coreGroup.add(promPoints);


export { coreGroup, sunMat, sun, moonMat, moon, makeGlowTexture, glowTex, sunGlow, moonGlow, bondMat, bondMesh, PROM_N, promGeo, promPos, promCol, promSize, promData, promMat, promPoints };


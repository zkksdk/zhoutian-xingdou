/* ============================================================
   周天星斗大阵 · 6. 四象神兽虚影
   源文件分节 #6 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { rnd, rr } from './00-utils.js';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   6. 四象神兽虚影
   ============================================================ */
function sampleLines(polylines, step, scale) {
  const out = [];
  for (const line of polylines) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1];
      const dx = (b[0] - a[0]) * scale, dz = (b[1] - a[1]) * scale;
      const len = Math.hypot(dx, dz);
      const n = Math.max(2, Math.floor(len / step));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push([
          (a[0] + (b[0] - a[0]) * t) * scale + (Math.random() - 0.5) * 0.35,
          (a[1] + (b[1] - a[1]) * t) * scale + (Math.random() - 0.5) * 0.35,
          t
        ]);
      }
    }
  }
  return out;
}

/* --- 青龙 --- */
function dragonLines() {
  const L = [];
  const spine = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    spine.push([-12 + 20 * t, Math.sin(t * Math.PI * 2.4) * 3.0 * (1 - 0.28 * t)]);
  }
  L.push(spine);
  const head = [];
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; head.push([8.5 + Math.cos(a) * 1.9, Math.sin(a) * 1.6]); }
  L.push(head);
  L.push([[7.5, 1.7], [6.3, 4.3], [7.1, 6.1]]);
  L.push([[9.5, 1.5], [10.5, 4.1], [11.7, 5.1]]);
  L.push([[10.3, 0.7], [13.1, 1.7], [14.7, 0.9]]);
  L.push([[10.3, -0.7], [13.1, -2.1], [14.5, -2.7]]);
  L.push([[-1.0, -2.6], [-3.3, -6.0], [-6.1, -6.8]]);
  L.push([[-1.0, 2.6], [-3.3, 6.0], [-6.1, 6.8]]);
  L.push([[3.5, -2.6], [3.0, -6.2], [1.0, -7.4]]);
  L.push([[3.5, 2.6], [3.0, 6.2], [1.0, 7.4]]);
  L.push([[-12, 0], [-15, 2.4], [-16.6, 5.2], [-15.4, 7.4]]);
  return L;
}
/* --- 白虎 --- */
function tigerLines() {
  const L = [];
  const body = [];
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; body.push([Math.cos(a) * 8.5, Math.sin(a) * 3.6]); }
  L.push(body);
  const head = [];
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; head.push([9.5 + Math.cos(a) * 2.3, Math.sin(a) * 2.1]); }
  L.push(head);
  L.push([[8.6, 2.1], [9.1, 4.5], [10.3, 4.1]]);
  L.push([[8.6, -2.1], [9.1, -4.5], [10.3, -4.1]]);
  L.push([[-5.0, 2.6], [-5.5, 5.6], [-4.4, 7.3]]);
  L.push([[-5.0, -2.6], [-5.5, -5.6], [-4.4, -7.3]]);
  L.push([[3.5, 2.6], [3.8, 5.7], [4.8, 7.3]]);
  L.push([[3.5, -2.6], [3.8, -5.7], [4.8, -7.3]]);
  L.push([[-8.5, 0], [-12, 2.0], [-13.6, 5.0], [-12.6, 7.6]]);
  L.push([[-2, 0], [2, 0]]);
  L.push([[-2, 0.8], [2, 0.8]]);
  return L;
}
/* --- 朱雀 --- */
function birdLines() {
  const L = [];
  const body = [];
  for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2; body.push([Math.cos(a) * 3.0, Math.sin(a) * 2.0]); }
  L.push(body);
  const head = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; head.push([1.8 + Math.cos(a) * 1.1, Math.sin(a) * 1.0]); }
  L.push(head);
  L.push([[2.6, 0.3], [4.4, 0.9], [5.2, 1.4]]);
  L.push([[2.6, -0.3], [4.4, -0.9], [5.2, -1.4]]);
  for (const s of [1, -1]) {
    const wing = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      wing.push([-1.0 - 9.5 * t, s * (1.0 + 8.5 * Math.sin(t * Math.PI * 0.9))]);
    }
    L.push(wing);
    for (let k = 0; k < 3; k++) {
      const w2 = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        w2.push([-2.0 - 9.0 * t + k * 0.7, s * (2.0 + k * 1.7) * (1.0 + 0.55 * t)]);
      }
      L.push(w2);
    }
  }
  for (let k = -2; k <= 2; k++) {
    const tail = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      tail.push([-2.6 - 7.0 * t, k * 1.6 * (1.0 + 0.7 * t)]);
    }
    L.push(tail);
  }
  return L;
}
/* --- 玄武 --- */
function turtleLines() {
  const L = [];
  for (const rad of [7.5, 5.0]) {
    const shell = [];
    for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2; shell.push([Math.cos(a) * rad, Math.sin(a) * rad * 0.85]); }
    L.push(shell);
  }
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2;
    L.push([[Math.cos(a) * 1.6, Math.sin(a) * 1.6 * 0.85], [Math.cos(a) * 5.0, Math.sin(a) * 5.0 * 0.85]]);
  }
  const head = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; head.push([7.2 + Math.cos(a) * 1.9, Math.sin(a) * 1.6]); }
  L.push(head);
  L.push([[5.0, 4.5], [7.0, 7.6], [9.0, 7.1]]);
  L.push([[5.0, -4.5], [7.0, -7.6], [9.0, -7.1]]);
  L.push([[-5.0, 4.5], [-7.0, 7.6], [-9.0, 7.1]]);
  L.push([[-5.0, -4.5], [-7.0, -7.6], [-9.0, -7.1]]);
  const snake = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    snake.push([-6.0 - 9.0 * t + Math.sin(t * 6.0) * 1.6, -2.0 + Math.sin(t * 4.0) * 3.0 + t * 2.2]);
  }
  L.push(snake);
  return L;
}

const beasts = [];
const BEAST_DEFS = [
  { name: '青龙', lines: dragonLines(), color: new THREE.Color(0x35e6ff), ang: 0.0,               R: 51, scale: 0.62 },
  { name: '朱雀', lines: birdLines(),   color: new THREE.Color(0xff5a2e), ang: Math.PI * 0.5,     R: 51, scale: 0.62 },
  { name: '白虎', lines: tigerLines(),  color: new THREE.Color(0xd8e8ff), ang: Math.PI,           R: 51, scale: 0.62 },
  { name: '玄武', lines: turtleLines(), color: new THREE.Color(0x4468ff), ang: Math.PI * 1.5,     R: 51, scale: 0.62 }
];

BEAST_DEFS.forEach(def => {
  const pts = sampleLines(def.lines, 0.55, def.scale);
  const N = pts.length;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const at = new Float32Array(N);

  const ca = Math.cos(def.ang), sa = Math.sin(def.ang);

  for (let i = 0; i < N; i++) {
    const [lx, lz, t] = pts[i];
    const rr0 = def.R + lz;
    const wx = rr0 * ca - lx * sa;
    const wz = rr0 * sa + lx * ca;
    pos[i * 3] = wx;
    pos[i * 3 + 1] = rr(-0.6, 0.6) + Math.sin(t * 10.0) * 0.3;
    pos[i * 3 + 2] = wz;

    const c = def.color.clone().lerp(new THREE.Color(0xffffff), rnd() * 0.5);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

    const isEye = t > 0.02 && t < 0.06 && rnd() > 0.6;
    size[i] = isEye ? rr(1.6, 2.6) : rr(0.22, 0.55);
    phase[i] = rnd();
    at[i] = t;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aT', new THREE.BufferAttribute(at, 1));

  const boostU = { value: 0 };

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uScale: U.scale, uBoost: boostU, uBright: U.bright },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale, uBoost, uBright;
      attribute float aSize, aPhase, aT;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float flow = 0.5 + 0.5 * sin(aT * 22.0 - uTime * 1.8 + aPhase * 3.0);
        float breathe = 0.5 + 0.5 * sin(uTime * 0.75 + aPhase * 2.0);
        float ghost = 0.5 + 0.5 * sin(uTime * 0.35 + aPhase * 1.3);
        vA = (0.06 + 0.30 * flow) * (0.45 + 0.55 * breathe) * (0.55 + 0.45 * ghost);
        vA *= (0.55 + uBoost * 2.2) * uBright;
        vColor = aColor;
        gl_PointSize = clamp(aSize * (1.0 + uBoost * 1.5) * uScale / max(0.001, -mv.z), 1.0, 34.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        float core = exp(-r2 * 4.0);
        float a = core * vA;
        gl_FragColor = vec4(vColor * 1.8 * core, a);
      }
    `
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  arrayGroup.add(points);

  beasts.push({ def, points, boostU, mat, eyeTimer: rr(2, 8) });
});


export { sampleLines, dragonLines, tigerLines, birdLines, turtleLines, beasts, BEAST_DEFS };


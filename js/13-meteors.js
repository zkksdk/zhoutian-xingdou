/* ============================================================
   周天星斗大阵 · 13. 流星
   源文件分节 #13 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr } from './00-utils.js';
import { scene } from './01-core.js';

/* ============================================================
   13. 流星
   ============================================================ */
const meteors = [];
const METEOR_N = isMobile ? 4 : 7;
for (let i = 0; i < METEOR_N; i++) {
  const LEN = 16;
  const pos = new Float32Array(LEN * 3);
  const alpha = new Float32Array(LEN);
  for (let k = 0; k < LEN; k++) alpha[k] = 1 - k / LEN;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: {},
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aAlpha;
      varying float vA;
      void main(){
        vA = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vA;
      void main(){
        gl_FragColor = vec4(vec3(1.0, 0.92, 0.75) * 1.8, vA * 0.85);
      }
    `
  });
  const line = new THREE.Line(g, m);
  line.frustumCulled = false;
  scene.add(line);
  meteors.push({
    line,
    hist: new Array(LEN).fill(0).map(() => new THREE.Vector3()),
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    active: false,
    LEN
  });
}

function spawnMeteor() {
  const m = meteors[Math.floor(Math.random() * meteors.length)];
  if (!m || m.active) return;
  const a = rnd() * Math.PI * 2;
  const r = rr(120, 220);
  m.pos.set(Math.cos(a) * r, rr(30, 120), Math.sin(a) * r);
  const target = new THREE.Vector3(rr(-40, 40), rr(-30, 10), rr(-40, 40));
  m.vel.copy(target).sub(m.pos).normalize().multiplyScalar(rr(70, 150));
  m.life = rr(2.0, 4.5);
  m.active = true;
  m.line.visible = true;
  for (let i = 0; i < m.LEN; i++) m.hist[i].copy(m.pos);
}


export { meteors, METEOR_N, spawnMeteor };


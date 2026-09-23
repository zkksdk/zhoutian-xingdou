/* ============================================================
   周天星斗大阵 · 12. 星尘粒子（阵周围漂浮）
   源文件分节 #12 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr } from './00-utils.js';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';
import { quadrantColor } from './04-starfield.js';

/* ============================================================
   12. 星尘粒子（阵周围漂浮）
   ============================================================ */
(function buildMotes() {
  const N = isMobile ? 700 : 1800;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const radius = new Float32Array(N);
  const speed = new Float32Array(N);
  const c = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const ang = rnd() * Math.PI * 2;
    const r = rr(4, 68);
    const y = rr(-7, 7);
    pos[i * 3] = Math.cos(ang) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(ang) * r;
    radius[i] = r;
    speed[i] = rr(0.05, 0.30) * (rnd() > 0.5 ? 1 : -1);

    const q = quadrantColor(ang);
    c.copy(q).lerp(new THREE.Color(0xffffff), rr(0.3, 0.9));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

    size[i] = rr(0.08, 0.26);
    phase[i] = rnd();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));

  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uScale: U.scale, uBright: U.bright },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale, uBright;
      attribute float aSize, aPhase, aRadius, aSpeed;
      attribute vec3 aColor;
      varying vec3 vColor; varying float vA;
      void main(){
        vec3 p = position;
        float a0 = atan(p.z, p.x) + uTime * aSpeed * 0.25;
        float r = aRadius + sin(uTime * 0.5 + aPhase * 6.28) * 1.5;
        p.x = cos(a0) * r;
        p.z = sin(a0) * r;
        p.y += sin(uTime * 0.8 + aPhase * 12.0) * 0.9;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float tw = 0.5 + 0.5 * sin(uTime * 1.6 + aPhase * 6.2831);
        vColor = aColor * uBright;
        vA = tw * 0.85;
        gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.5, 16.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        gl_FragColor = vec4(vColor, exp(-r2 * 2.6) * vA);
      }
    `
  });

  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  arrayGroup.add(pts);
})();



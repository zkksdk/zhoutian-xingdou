/* ============================================================
   周天星斗大阵 · 5. 副星辰（一万四千八百颗尘星）
   源文件分节 #5 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr } from './00-utils.js';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';
import { quadrantColor } from './04-starfield.js';

/* ============================================================
   5. 副星辰（一万四千八百颗尘星）
   ============================================================ */
(function buildDustStars() {
  const N = isMobile ? 5200 : 14800;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const c = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const ang = rnd() * Math.PI * 2;
    // 越靠外越密（面积均匀采样 + 偏置）
    const u = rnd();
    const r = 6 + Math.pow(u, 0.72) * 66;
    const y = rr(-2.5, 2.5) * (1 - r / 160);

    pos[i * 3] = Math.cos(ang) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(ang) * r;

    const q = quadrantColor(ang);
    c.copy(q).lerp(new THREE.Color(0xffffff), rr(0.25, 0.95));
    c.multiplyScalar(rr(0.45, 1.0));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

    size[i] = rr(0.08, 0.30);
    phase[i] = rnd();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uScale: U.scale, uBright: U.bright, uScanR: U.scanR, uScanW: U.scanW, uScanI: U.scanI },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale, uBright, uScanR, uScanW, uScanI;
      attribute float aSize, aPhase;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = length(position.xyz);
        float scan = exp(-pow((d - uScanR) / uScanW, 2.0));
        float tw = 0.55 + 0.45 * sin(uTime * 1.35 + aPhase * 6.2831);
        vColor = aColor * uBright;
        vA = tw * (0.55 + scan * uScanI * 0.7);
        float s = aSize * (1.0 + scan * uScanI * 0.9);
        gl_PointSize = clamp(s * uScale / max(0.001, -mv.z), 0.5, 14.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        float a = exp(-r2 * 3.0) * vA;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });

  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  arrayGroup.add(pts);
})();



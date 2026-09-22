/* ============================================================
   周天星斗大阵 · 2. 背景：动态星云 + 深空星尘
   源文件分节 #2 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr, NOISE } from './00-utils.js';
import { scene, U } from './01-core.js';

/* ============================================================
   2. 背景：动态星云 + 深空星尘
   ============================================================ */
const nebulaMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false,
  uniforms: { uTime: U.time },
  vertexShader: `
    varying vec3 vDir;
    void main(){
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: NOISE + `
    uniform float uTime;
    varying vec3 vDir;
    void main(){
      vec3 d = normalize(vDir);
      float c = cos(uTime * 0.0075), s = sin(uTime * 0.0075);
      d = vec3(d.x * c - d.z * s, d.y, d.x * s + d.z * c);
      vec3 d2 = vec3(d.x * 0.7 + d.z * 0.7, d.y * 1.4, -d.x * 0.7 + d.z * 0.7);

      float f1 = fbm(d * 2.1 + vec3(0.0, uTime * 0.012, 0.0));
      float f2 = fbm(d2 * 4.3 - vec3(uTime * 0.018, 0.0, uTime * 0.006));
      float f3 = fbm(d * 8.6 + vec3(uTime * 0.03));

      float n = f1 * 0.5 + 0.5;
      float m = f2 * 0.5 + 0.5;
      float k = f3 * 0.5 + 0.5;

      vec3 deep   = vec3(0.006, 0.010, 0.030);
      vec3 blue   = vec3(0.030, 0.065, 0.200);
      vec3 purple = vec3(0.130, 0.030, 0.230);
      vec3 red    = vec3(0.280, 0.050, 0.055);

      vec3 col = mix(deep, blue, smoothstep(0.34, 0.86, n));
      col = mix(col, purple, smoothstep(0.44, 0.94, m) * 0.80);
      col = mix(col, red, smoothstep(0.62, 1.0, n * m * 2.2) * 0.50);

      // 深层丝状结构
      float filament = smoothstep(0.55, 0.95, abs(f3) * 1.6);
      col += vec3(0.10, 0.13, 0.30) * filament * 0.22;

      // 细微星尘
      vec3 gp = floor(d * 420.0);
      float st = hash33(gp).x;
      float twinkle = step(0.9975, st) * (0.5 + 0.5 * sin(uTime * 3.0 + st * 90.0));
      col += vec3(0.7, 0.8, 1.0) * twinkle * 0.55;

      // 中心稍微压暗，突出阵体
      col *= 0.85;
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 32), nebulaMat));

/* ---------- 深空星尘（大范围壳层） ---------- */
(function buildDeepStars() {
  const N = isMobile ? 1200 : 2600;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = rr(700, 2200);
    const a = rr(0, Math.PI * 2);
    const b = Math.acos(rr(-1, 1));
    pos[i * 3] = r * Math.sin(b) * Math.cos(a);
    pos[i * 3 + 1] = r * Math.cos(b);
    pos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
    const t = rnd();
    if (t > 0.9) c.setHSL(0.09, 0.7, 0.75);
    else if (t > 0.8) c.setHSL(0.58, 0.7, 0.78);
    else c.setHSL(0.6, 0.1, rr(0.7, 1.0));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = rr(1.2, 4.5);
    phase[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uScale: U.scale },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale;
      attribute float aSize, aPhase;
      attribute vec3 aColor;
      varying vec3 vColor; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.55 + 0.45 * sin(uTime * 1.1 + aPhase * 6.2831);
        vColor = aColor; vA = tw * 0.9;
        gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.6, 22.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        float a = exp(-r2 * 3.2) * vA;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });
  scene.add(new THREE.Points(g, m));
})();


export { nebulaMat };

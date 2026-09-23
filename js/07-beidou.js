/* ============================================================
   周天星斗大阵 · 7. 北斗七星
   源文件分节 #7 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { rnd } from './00-utils.js';
import { scene, U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   7. 北斗七星
   ============================================================ */
const BEIDOU_NAMES = ['天枢', '天璇', '天玑', '天权', '玉衡', '开阳', '摇光'];
const beidouLocal = [
  [0, 0], [1.0, 0.34], [1.92, 0.10], [2.42, -0.72],
  [1.62, -1.44], [0.72, -1.52], [-0.20, -1.22]
];
const BEIDOU_SCALE = 7.5;
const BEIDOU_OFFSET = new THREE.Vector3(0, 0, -14);

const beidouGroup = new THREE.Group();
arrayGroup.add(beidouGroup);

const beidouStars = [];
{
  const N = 7;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);

  BEIDOU_NAMES.forEach((nm, i) => {
    const x = beidouLocal[i][0] * BEIDOU_SCALE + BEIDOU_OFFSET.x;
    const z = beidouLocal[i][1] * BEIDOU_SCALE + BEIDOU_OFFSET.z;
    pos[i * 3] = x;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = z;
    const c = new THREE.Color(0xffd070).lerp(new THREE.Color(0xffffff), i / 6 * 0.6);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = 1.35;
    phase[i] = rnd();
    beidouStars.push({ local: new THREE.Vector3(x, 0, z), name: nm });
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aIndex', new THREE.BufferAttribute(new Float32Array(N), 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uScale: U.scale, uBright: U.bright,
      uScanR: U.scanR, uScanW: U.scanW, uScanI: U.scanI, uHover: { value: -1 }
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale, uBright, uScanR, uScanW, uScanI, uHover;
      attribute float aSize, aPhase, aGlow, aIndex;
      attribute vec3 aColor;
      varying vec3 vColor; varying float vGlow; varying float vTw;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = length(position.xyz);
        float scan = exp(-pow((d - uScanR) / uScanW, 2.0));
        float tw = 0.7 + 0.3 * sin(uTime * 2.2 + aPhase * 6.2831);
        vGlow = aGlow + scan * uScanI;
        vTw = tw;
        vColor = aColor * uBright;
        float s = aSize * (1.0 + vGlow * 2.6);
        gl_PointSize = clamp(s * uScale / max(0.001, -mv.z), 1.0, 320.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vGlow; varying float vTw;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        float r = sqrt(r2);
        float core = exp(-r2 * 4.5);
        float halo = exp(-r2 * 1.3) * 0.55;
        vec2 q = abs(p);
        float spike = exp(-q.y * 70.0) * exp(-q.x * 5.0) + exp(-q.x * 70.0) * exp(-q.y * 5.0);
        float a = (core + halo + spike * 0.7) * vTw;
        a += core * vGlow * 1.2;
        vec3 c = vColor * (1.0 + vGlow * 2.0) + vec3(1.0, 0.9, 0.7) * core * 0.6;
        gl_FragColor = vec4(c, a);
      }
    `
  });

  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  beidouGroup.add(pts);
  beidouGroup.userData = { geo, mat };
}

/* ---------- 北斗连线 ---------- */
{
  const lpos = [];
  for (let i = 0; i < 6; i++) {
    const a = beidouLocal[i], b = beidouLocal[i + 1];
    lpos.push(
      a[0] * BEIDOU_SCALE + BEIDOU_OFFSET.x, 0, a[1] * BEIDOU_SCALE + BEIDOU_OFFSET.z,
      b[0] * BEIDOU_SCALE + BEIDOU_OFFSET.x, 0, b[1] * BEIDOU_SCALE + BEIDOU_OFFSET.z
    );
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lpos), 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uBright: U.bright },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      void main(){
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      void main(){
        float p = 0.45 + 0.55 * sin(uTime * 2.0);
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.45) * (0.6 + p * 0.8), 1.0);
      }
    `
  });
  const line = new THREE.LineSegments(g, m);
  line.frustumCulled = false;
  beidouGroup.add(line);
}

/* ---------- 北斗拖尾（世界坐标历史轨迹） ---------- */
const trailLen = 26;
const trailPoints = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.ShaderMaterial({
    uniforms: { uScale: U.scale },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uScale;
      attribute float aSize, aAlpha;
      attribute vec3 aColor;
      varying vec3 vColor; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vColor = aColor; vA = aAlpha;
        gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.5, 24.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        gl_FragColor = vec4(vColor * 1.5, exp(-r2 * 3.0) * vA);
      }
    `
  })
);
trailPoints.frustumCulled = false;
scene.add(trailPoints);

const trailData = [];
for (let i = 0; i < 7; i++) {
  trailData.push({ hist: [], });
}
{
  const total = 7 * trailLen;
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const size = new Float32Array(total);
  const alpha = new Float32Array(total);
  const g = trailPoints.geometry;
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  for (let i = 0; i < total; i++) {
    const k = i % trailLen;
    const t = k / trailLen;
    col[i * 3] = 1.0; col[i * 3 + 1] = 0.80 - t * 0.3; col[i * 3 + 2] = 0.42 - t * 0.3;
    size[i] = 0.32 * (1 - t) + 0.05;
    alpha[i] = (1 - t) * 0.7;
  }
  g.attributes.aColor.needsUpdate = true;
  g.attributes.aSize.needsUpdate = true;
  g.attributes.aAlpha.needsUpdate = true;
}


export { BEIDOU_NAMES, beidouLocal, BEIDOU_SCALE, BEIDOU_OFFSET, beidouGroup, beidouStars, trailLen, trailPoints, trailData };


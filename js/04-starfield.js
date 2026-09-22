/* ============================================================
   周天星斗大阵 · 4. 星位数据层（三垣 + 二十八宿）
   源文件分节 #4 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { rnd, rr } from './00-utils.js';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   4. 星位数据层（三垣 + 二十八宿）
   ============================================================ */
const STAR_NAMES = [
  '紫微','天极','太乙','天乙','司命','司禄','司危','司非','辅星','天床',
  '天牢','阴德','尚书','女史','柱史','御女','天柱','大理','勾陈','六甲',
  '五帝','华盖','杠星','传舍','内阶','天厨','八谷','天棓','天理','四辅',
  '天关','天高','天潢','咸池','天街','参旗','玉井','天苑','五车','天船',
  '大陵','卷舌','天谗','砺石','天钩','天钥','天相','天鸡','天弁','天籥',
  '建星','河鼓','天桴','右旗','左旗','织女','渐台','辇道','天津','瓠瓜',
  '败瓜','天市','候星','宦者','宗正','宗人','宗星','市楼','车肆','帛度',
  '屠肆','列肆','斗斛','帝座','侯星','天门','天田','天垒','天钱','天籥',
  '天渊','天关','天苑','天园','天庙','天相','天稷','天社','天记','天狗',
  '天狼','天弓','天矢','天船','天廪','天庾','天仓','天囷','天廪','天苑'
];

const RING_DEFS = [
  { key: 'ziwei',   r0: 8.5,  r1: 16.5, count: 88,  c1: new THREE.Color(0xa070ff), c2: new THREE.Color(0xffd070), speed:  0.030, ringColor: 0x9b6bff, segDensity: 1.0 },
  { key: 'taiwei',  r0: 18.5, r1: 27.5, count: 92,  c1: new THREE.Color(0x35d8ff), c2: new THREE.Color(0xbdf4ff), speed: -0.022, ringColor: 0x35d8ff, segDensity: 1.0 },
  { key: 'tianshi', r0: 29.5, r1: 41.0, count: 98,  c1: new THREE.Color(0xffe9c8), c2: new THREE.Color(0xffffff), speed:  0.016, ringColor: 0xffe0b0, segDensity: 1.0 },
  { key: 'xiu',     r0: 45.0, r1: 58.0, count: 87,  c1: new THREE.Color(0xffffff), c2: new THREE.Color(0xffffff), speed: -0.010, ringColor: 0x88aaff, segDensity: 0.75 }
];

const layers = [];          // { group, points, glowArr, hovUniform, stars[], name }
const allStars = [];        // 全局悬停用
const chainScheduled = [];

function quadrantColor(ang) {
  const a = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (a < Math.PI * 0.5)       return new THREE.Color(0x35e6ff);  // 东方青龙 — 青
  if (a < Math.PI)             return new THREE.Color(0xff5a2e);  // 南方朱雀 — 赤
  if (a < Math.PI * 1.5)       return new THREE.Color(0xd8e8ff);  // 西方白虎 — 银白
  return new THREE.Color(0x4468ff);                                // 北方玄武 — 深蓝
}

RING_DEFS.forEach((def, li) => {
  const n = def.count;
  const pos    = new Float32Array(n * 3);
  const col    = new Float32Array(n * 3);
  const size   = new Float32Array(n);
  const phase  = new Float32Array(n);
  const glow   = new Float32Array(n);
  const index  = new Float32Array(n);
  const stars  = [];

  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const r = Math.sqrt(rr(def.r0 * def.r0, def.r1 * def.r1));
    const y = rr(-1.6, 1.6) * (def.key === 'xiu' ? 1.4 : 1.0);
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;

    pos[i * 3] = px;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = pz;

    let c;
    if (def.key === 'xiu') {
      c = quadrantColor(ang).clone();
      c.lerp(new THREE.Color(0xffffff), rr(0.0, 0.35));
    } else {
      c = def.c1.clone().lerp(def.c2, rnd());
    }

    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

    const big = rnd() > 0.86;
    size[i] = big ? rr(0.85, 1.5) : rr(0.30, 0.72);
    phase[i] = rnd();
    glow[i] = 0;
    index[i] = i;

    const nm = STAR_NAMES[(li * 37 + i) % STAR_NAMES.length];
    stars.push({
      local: new THREE.Vector3(px, y, pz),
      name: nm + (i > 40 ? '·' + (i % 9 + 1) : ''),
      base: size[i],
      li, idx: i
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aIndex', new THREE.BufferAttribute(index, 1));

  const hovU = { value: -1 };

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uScale: U.scale,
      uScanR: U.scanR, uScanW: U.scanW, uScanI: U.scanI,
      uBright: U.bright, uHover: hovU
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uScale, uScanR, uScanW, uScanI, uBright, uHover;
      attribute float aSize, aPhase, aGlow, aIndex;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vGlow;
      varying float vTw;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = length(position.xyz);
        float scan = exp(-pow((dist - uScanR) / uScanW, 2.0));

        float tw = 0.70 + 0.30 * sin(uTime * 1.7 + aPhase * 6.2831);
        float hov = (abs(aIndex - uHover) < 0.5) ? 1.0 : 0.0;

        float g = aGlow + scan * uScanI + hov * 1.6;
        vGlow = g;
        vTw = tw;
        vColor = aColor * uBright;

        float s = aSize * (1.0 + g * 2.4) * (0.9 + 0.25 * tw) * (1.0 + hov * 0.9);
        gl_PointSize = clamp(s * uScale / max(0.001, -mv.z), 0.6, 260.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vGlow;
      varying float vTw;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if(r2 > 1.0) discard;
        float r = sqrt(r2);
        float core = exp(-r2 * 5.0);
        float halo = exp(-r2 * 1.5) * 0.48;
        vec2 q = abs(p);
        float spike = exp(-q.y * 78.0) * exp(-q.x * 6.5) +
                      exp(-q.x * 78.0) * exp(-q.y * 6.5);
        float a = (core + halo + spike * 0.55 * (1.0 + vGlow * 0.8)) * vTw;
        a += core * vGlow * 1.6;
        vec3 c = vColor * (1.0 + vGlow * 1.9);
        c += vec3(1.0, 0.95, 0.85) * core * vGlow * 0.9;
        gl_FragColor = vec4(c, a);
      }
    `
  });

  const group = new THREE.Group();
  group.rotation.y = rnd() * Math.PI * 2;
  arrayGroup.add(group);

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  /* ---------- 星轨连线 ---------- */
  const sorted = stars.slice().sort((a, b) => {
    return Math.atan2(a.local.z, a.local.x) - Math.atan2(b.local.z, b.local.x);
  });

  const lpos = [], lcol = [], lt = [], lspd = [];
  const lineCol = new THREE.Color(def.ringColor);
  const linkMap = new Map();

  const linkCount = Math.max(2, Math.floor(sorted.length * 0.55));
  for (let k = 0; k < linkCount; k++) {
    const a = sorted[k % sorted.length];
    const b = sorted[(k + 1) % sorted.length];
    const gap = Math.abs(k % sorted.length - ((k + 1) % sorted.length));
    if (gap > 3) continue;

    lpos.push(a.local.x, a.local.y, a.local.z, b.local.x, b.local.y, b.local.z);
    const cc = lineCol.clone().lerp(new THREE.Color(0xffd88a), rnd() * 0.6);
    lcol.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
    const t0 = rnd();
    lt.push(t0, t0 + 0.05);
    lspd.push(rr(0.5, 2.0), rr(0.5, 2.0));

    if (!linkMap.has(a.idx)) linkMap.set(a.idx, []);
    if (!linkMap.has(b.idx)) linkMap.set(b.idx, []);
    linkMap.get(a.idx).push(b.idx);
    linkMap.get(b.idx).push(a.idx);
  }

  if (lpos.length > 0) {
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lpos), 3));
    lgeo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(lcol), 3));
    lgeo.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(lt), 1));
    lgeo.setAttribute('aSpeed', new THREE.BufferAttribute(new Float32Array(lspd), 1));

    const lmat = new THREE.ShaderMaterial({
      uniforms: { uTime: U.time, uBright: U.bright },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uTime, uBright;
        attribute vec3 aColor;
        attribute float aT, aSpeed;
        varying vec3 vColor;
        varying float vA;
        void main(){
          vColor = aColor;
          float pulse = 0.5 + 0.5 * sin(aT * 42.0 - uTime * aSpeed * 2.4);
          float pulse2 = 0.5 + 0.5 * sin(aT * 9.0 + uTime * 0.7);
          vA = (0.10 + 0.42 * pulse * pulse + 0.12 * pulse2) * uBright;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vA;
        void main(){
          gl_FragColor = vec4(vColor * vA, vA);
        }
      `
    });
    const lines = new THREE.LineSegments(lgeo, lmat);
    lines.frustumCulled = false;
    group.add(lines);

    /* ---------- 星轨流光 ---------- */
    const flowN = Math.floor(lpos.length / 6);
    if (flowN > 0) {
      const fStart = new Float32Array(flowN * 3);
      const fEnd   = new Float32Array(flowN * 3);
      const fCol   = new Float32Array(flowN * 3);
      const fPhase = new Float32Array(flowN);
      const fSpeed = new Float32Array(flowN);
      for (let i = 0; i < flowN; i++) {
        const s = i * 6;
        fStart[i * 3] = lpos[s];     fStart[i * 3 + 1] = lpos[s + 1]; fStart[i * 3 + 2] = lpos[s + 2];
        fEnd[i * 3]   = lpos[s + 3]; fEnd[i * 3 + 1]   = lpos[s + 4]; fEnd[i * 3 + 2]   = lpos[s + 5];
        const c = new THREE.Color().copy(lineCol).lerp(new THREE.Color(0xffffff), rnd() * 0.7);
        fCol[i * 3] = c.r; fCol[i * 3 + 1] = c.g; fCol[i * 3 + 2] = c.b;
        fPhase[i] = rnd();
        fSpeed[i] = rr(0.12, 0.55) * (rnd() > 0.5 ? 1 : -1);
      }
      const fgeo = new THREE.BufferGeometry();
      fgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flowN * 3), 3)); // 占位
      fgeo.setAttribute('aStart', new THREE.BufferAttribute(fStart, 3));
      fgeo.setAttribute('aEnd', new THREE.BufferAttribute(fEnd, 3));
      fgeo.setAttribute('aColor', new THREE.BufferAttribute(fCol, 3));
      fgeo.setAttribute('aPhase', new THREE.BufferAttribute(fPhase, 1));
      fgeo.setAttribute('aSpeed', new THREE.BufferAttribute(fSpeed, 1));
      fgeo.setDrawRange(0, flowN);

      const fmat = new THREE.ShaderMaterial({
        uniforms: { uTime: U.time, uScale: U.scale, uBright: U.bright },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
          uniform float uTime, uScale, uBright;
          attribute vec3 aStart, aEnd, aColor;
          attribute float aPhase, aSpeed;
          varying vec3 vColor;
          varying float vA;
          void main(){
            float t = fract(uTime * aSpeed + aPhase);
            vec3 p = mix(aStart, aEnd, t);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vA = sin(t * 3.14159) * 0.9 * uBright;
            vColor = aColor;
            gl_PointSize = clamp(0.30 * uScale / max(0.001, -mv.z), 1.0, 26.0);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vColor; varying float vA;
          void main(){
            vec2 p = gl_PointCoord - 0.5;
            float r2 = dot(p, p) * 4.0;
            if(r2 > 1.0) discard;
            float a = exp(-r2 * 4.5) * vA;
            gl_FragColor = vec4(vColor * 1.6, a);
          }
        `
      });
      const flow = new THREE.Points(fgeo, fmat);
      flow.frustumCulled = false;
      group.add(flow);
    }
  }

  /* ---------- 三垣光环 ---------- */
  if (def.key !== 'xiu') {
    const rMid = (def.r0 + def.r1) * 0.5;
    for (const [rad, op, spd] of [[def.r0 - 0.6, 0.55, 0.05], [def.r1 + 0.6, 0.42, -0.04]]) {
      const rg = new THREE.RingGeometry(rad - 0.28, rad + 0.28, 192, 1);
      const rm = new THREE.ShaderMaterial({
        uniforms: {
          uTime: U.time,
          uColor: { value: new THREE.Color(def.ringColor) },
          uOpacity: { value: op },
          uSpeed: { value: spd }
        },
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
          uniform float uTime, uOpacity, uSpeed;
          uniform vec3 uColor;
          varying vec2 vUv;
          void main(){
            float ang = atan(vUv.y - 0.5, vUv.x - 0.5);
            float seg = 0.5 + 0.5 * sin(ang * 36.0 + uTime * uSpeed * 3.0);
            float seg2 = 0.5 + 0.5 * sin(ang * 7.0 - uTime * uSpeed * 1.4);
            float a = uOpacity * (0.30 + 0.55 * seg * seg + 0.25 * seg2);
            gl_FragColor = vec4(uColor * a * 1.4, a);
          }
        `
      });
      const ring = new THREE.Mesh(rg, rm);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
  }

  layers.push({
    group, points, geo,
    glowAttr: geo.attributes.aGlow,
    hovU, stars, links: linkMap,
    def, index: li
  });

  stars.forEach(s => { s.layerRef = layers[layers.length - 1]; allStars.push(s); });
});


export { STAR_NAMES, RING_DEFS, layers, allStars, chainScheduled, quadrantColor };

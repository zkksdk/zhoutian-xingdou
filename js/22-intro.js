/* ============================================================
   周天星斗大阵 · 22. 展开动画（创世序列）

   从混沌虚无到周天有序：
     ① 混沌初开 → ② 双核诞生 → ③ 紫微垣 → ④ 太微·天市
     → ⑤ 二十八宿与四象 → ⑥ 北斗定枢 → ⑦ 周天轰鸣

   设计：全部效果由单一进度变量驱动
     intro.t（秒） → tp = t * 24/dur（映射到 24 秒的设计时间轴）
     每个阶段再用 smoothstep / easeInOutCubic / backOut 切分。
   展开期间随机事件全部停摆，结束后无缝交还给事件系统。
   ============================================================ */
import * as THREE from 'three';
import { isMobile } from './00-utils.js';
import { scene, renderer, U, orbit, mouse } from './01-core.js';
import { layers } from './04-starfield.js';
import { dustPoints } from './05-dust-stars.js';
import { beasts } from './06-beasts.js';
import { beidouGroup, beidouStars, trailPoints } from './07-beidou.js';
import { sun, moon, sunGlow, moonGlow, bondMesh } from './08-sun-moon.js';
import { scanWave, scanWaveMat } from './09-scan-wave.js';
import { runes } from './11-runes.js';
import { motePoints } from './12-motes.js';
import { events } from './16-events.js';
import { bloomPass, finalPass } from './17-postfx.js';

/* ---------- 时间轴 ---------- */
const DESIGN = 24;                                  /* 设计总长（秒） */
const BLOOM_FINAL = isMobile ? 0.45 : 0.65;
const REVEAL = [                                    /* 各层星位的展开窗口 */
  [6.0, 8.6],                                       /* 0 紫微垣 */
  [9.0, 11.6],                                      /* 1 太微垣 */
  [10.6, 12.9],                                     /* 2 天市垣 */
  [13.0, 15.6]                                      /* 3 二十八宿 */
];
const BEAST_T = [13.2, 14.0, 14.8, 15.6];           /* 青龙 朱雀 白虎 玄武 */
const BEIDOU_T0 = 17.0;                             /* 北斗第一颗亮起 */

/* 展开期的扫描波（只保留最后一次触发的那个，避免互相打架） */
const SCANS = [
  { t0: 5.6, dur: 1.2, rMax: 12, i0: 0.6, hue: 0.12 },   /* 阵纹初现的预兆 */
  { t0: 13.2, dur: 0.9, rMax: 22, i0: 0.7, hue: 0.52 },  /* 青龙 */
  { t0: 14.0, dur: 0.9, rMax: 26, i0: 0.7, hue: 0.03 },  /* 朱雀 */
  { t0: 14.8, dur: 0.9, rMax: 30, i0: 0.7, hue: 0.58 },  /* 白虎 */
  { t0: 15.6, dur: 0.9, rMax: 34, i0: 0.7, hue: 0.62 },  /* 玄武 */
  { t0: 18.9, dur: 1.0, rMax: 30, i0: 0.9, hue: 0.11 },  /* 北斗连珠 */
  { t0: 20.4, dur: 3.0, rMax: 85, i0: 2.4, hue: 0.12 }   /* 周天轰鸣 */
];

const CAM = [                                       /* [设计时刻, 距离, 俯仰] */
  [0, 260, 0.95], [2.5, 256, 0.95], [6, 130, 0.88], [9, 105, 0.88],
  [13, 95, 0.88], [17, 115, 0.82], [20, 105, 0.82], [24, 98, 1.00]
];

export const intro = {
  active: true,
  t: 0, p: 0, tp: 0,
  dur: isMobile ? 16 : 22,                          /* 移动端压缩到 16 秒 */
  scanIdx: -1, bondK: 0, beam: null, btn: null, esc: null
};

const baseSpeeds = layers.map(l => l.def.speed);

/* ---------- 缓动 ---------- */
const clamp01 = x => x < 0 ? 0 : (x > 1 ? 1 : x);
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const backOut = x => { const s = 1.4; const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

function camAt(tp) {
  for (let i = 0; i < CAM.length - 1; i++) {
    const a = CAM[i], b = CAM[i + 1];
    if (tp <= b[0]) {
      const k = easeInOutCubic(clamp01((tp - a[0]) / (b[0] - a[0])));
      return { dist: a[1] + (b[1] - a[1]) * k, phi: a[2] + (b[2] - a[2]) * k };
    }
  }
  const L = CAM[CAM.length - 1];
  return { dist: L[1], phi: L[2] };
}

/* 相机绕行角速度（弧度/秒）：混沌期极慢，北斗段明显加速 */
function spinRate(tp) {
  if (tp < 6) return 0.02;
  if (tp < 13) return 0.05;
  if (tp < 17) return 0.06;
  if (tp < 20) return 0.20;
  return 0.06;
}

/* 整体亮度：先慢升，高潮短促，最后回落稳定 */
function brightAt(tp) {
  if (tp < 2.5) return 0.15 + 0.15 * (tp / 2.5);
  if (tp < 6) return 0.30 + 0.40 * smoothstep(2.5, 6, tp);
  if (tp < 9) return 0.70 + 0.20 * smoothstep(6, 9, tp);
  if (tp < 13) return 0.90 + 0.10 * smoothstep(9, 13, tp);
  if (tp < 17) return 1.00;
  if (tp < 20) return 1.00 + 0.15 * Math.sin(smoothstep(17, 20, tp) * Math.PI);
  return 1.00;
}

/* 泛光强度 */
function bloomAt(tp) {
  if (tp < 2.5) return 0.02 + 0.03 * (tp / 2.5);
  if (tp < 6) return 0.05 + 0.20 * smoothstep(2.5, 6, tp);
  if (tp < 9) return 0.25 + 0.15 * smoothstep(6, 9, tp);
  if (tp < 13) return 0.40 + 0.10 * smoothstep(9, 13, tp);
  if (tp < 17) return 0.50 + 0.10 * smoothstep(13, 17, tp);
  if (tp < 20) return 0.55 + 0.15 * Math.sin(smoothstep(17, 20, tp) * Math.PI);
  return BLOOM_FINAL;
}

function lineOf(layer) { return layer.group.children.find(c => c.isLineSegments); }
function flowOf(layer) { return layer.group.children.find(c => c.isPoints && c !== layer.points); }

/* ============================================================
   启动：把所有东西压到"什么都没有"的初始状态
   ============================================================ */
function initIntro() {
  layers.forEach((l, i) => {
    l.def.speed = 0;
    l.points.material.uniforms.uReveal.value = 0;
    const ln = lineOf(l), fl = flowOf(l);
    if (ln) ln.material.uniforms.uGrow.value = 0;
    if (fl) fl.material.uniforms.uGrowR.value = 0;
  });
  dustPoints.material.uniforms.uAlpha.value = 0;
  motePoints.material.uniforms.uAlpha.value = 0;
  beasts.forEach(b => { b.points.visible = false; b.boostU.value = -0.25; });
  beidouGroup.visible = false;
  trailPoints.visible = false;

  /* 相机从极远处开始 */
  orbit.dist = 260; orbit.phi = 0.95;
  orbit.tDist = 260; orbit.tPhi = 0.95;

  bloomPass.strength = bloomAt(0);
  U.bright.value = brightAt(0);
  finalPass.uniforms.uVigBoost.value = 1;
  finalPass.uniforms.uExpo.value = 0.4;
  events.scanT = -1;                                  /* 展开期扫描由本模块接管 */

  /* 跳过按钮 + Esc */
  const btn = document.createElement('div');
  btn.textContent = '跳过 ▸';
  btn.style.cssText = 'position:fixed;right:14px;bottom:54px;z-index:60;padding:7px 13px;border-radius:15px;' +
    'background:rgba(18,26,46,.66);border:1px solid rgba(120,170,255,.35);color:rgba(196,220,255,.88);' +
    'font:12px/1 system-ui,-apple-system,sans-serif;letter-spacing:.12em;cursor:pointer;' +
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;';
  btn.addEventListener('click', skipIntro);
  document.body.appendChild(btn);
  intro.btn = btn;

  intro.esc = e => { if (e.key === 'Escape') skipIntro(); };
  addEventListener('keydown', intro.esc);
}

export function skipIntro() {
  if (!intro.active) return;
  intro.t = intro.dur;                                /* 下一帧直接进入收尾 */
}

/* ============================================================
   主钩子：每帧开头调用（相机 / 全局参数 / 各阶段编排）
   ============================================================ */
export function applyIntro(dt) {
  if (!intro.active) return;

  intro.t += dt;
  const tp = Math.min(intro.t * (DESIGN / intro.dur), DESIGN);
  intro.tp = tp;
  intro.p = clamp01(intro.t / intro.dur);

  /* ---------- 相机：推进 + 螺旋 + 视差衰减 ---------- */
  const cam = camAt(tp);
  orbit.tDist = cam.dist + Math.sin(tp * 0.9) * (tp > 9 ? 1.4 : 0.3);
  orbit.tPhi = cam.phi;
  intro.spin = (intro.spin || 0) + dt * spinRate(tp);
  orbit.tTheta += (intro.spin - (intro.applied || 0));
  intro.applied = intro.spin;
  const para = 0.3 + 0.7 * smoothstep(2, 9, tp);      /* 阶段一视差只有 0.3 倍 */
  mouse.sx *= para; mouse.sy *= para;

  /* ---------- 全局亮度 / 泛光 / 暗角 / 曝光 ---------- */
  U.bright.value = brightAt(tp);
  bloomPass.strength = bloomAt(tp);
  finalPass.uniforms.uVigBoost.value = 1 - smoothstep(0.6, 9, tp);
  finalPass.uniforms.uExpo.value = 0.4 + 0.6 * smoothstep(0, 6, tp);

  /* ---------- ② 双核诞生 ---------- */
  sun.scale.setScalar(Math.max(0.001, backOut(smoothstep(2.6, 4.0, tp))));
  moon.scale.setScalar(Math.max(0.001, backOut(smoothstep(3.4, 4.8, tp))));
  intro.bondK = smoothstep(5.0, 6.0, tp);

  /* ---------- ③④⑤ 星位由内向外铺开 ---------- */
  layers.forEach((l, i) => {
    const w = REVEAL[i];
    const k = smoothstep(w[0], w[1], tp);
    l.points.material.uniforms.uReveal.value = k * (l.def.r1 + 10);
    /* 旋转从 0 加速到正常（easeOutCubic） */
    l.def.speed = baseSpeeds[i] * easeOutCubic(smoothstep(w[0], w[0] + 2.2, tp));
    const ln = lineOf(l), fl = flowOf(l);
    if (ln) ln.material.uniforms.uGrow.value = 1.15 * easeOutCubic(smoothstep(w[0] + 0.2, w[1] + 0.6, tp));
    if (fl) fl.material.uniforms.uGrowR.value = 999 * smoothstep(w[0] + 0.4, w[1], tp);
  });

  /* ---------- ④ 副星辰与星尘淡入 ---------- */
  dustPoints.material.uniforms.uAlpha.value = smoothstep(9, 12, tp);
  motePoints.material.uniforms.uAlpha.value = smoothstep(6, 9.5, tp);

  /* ---------- ⑤ 四象显形 ---------- */
  beasts.forEach((b, i) => {
    const t0 = BEAST_T[i];
    b.points.visible = tp > t0 - 1.2;
    const k = smoothstep(t0 - 1.2, t0 + 1.4, tp);
    let boost = -0.25 + 0.25 * k;                     /* -0.25 → 0：从不可见到常态呼吸 */
    if (tp > t0 && tp < t0 + 0.35) boost = 1.1;       /* 显形瞬间的小爆发 */
    b.boostU.value = boost;
  });

  /* ---------- ⑥ 北斗依次点亮 ---------- */
  const bGeo = beidouGroup.userData.geo;
  if (tp > BEIDOU_T0 - 0.6) {
    beidouGroup.visible = true;
    trailPoints.visible = true;
    const glow = bGeo.attributes.aGlow.array;
    for (let i = 0; i < 7; i++) {
      const on = smoothstep(BEIDOU_T0 + i * 0.28, BEIDOU_T0 + i * 0.28 + 0.45, tp);
      glow[i] = Math.max(glow[i] * 0.90, on * 1.7);
    }
    bGeo.attributes.aGlow.needsUpdate = true;
  }

  /* ---------- 扫描波（只保留最后一个触发的） ---------- */
  let idx = -1;
  for (let i = 0; i < SCANS.length; i++) {
    if (tp >= SCANS[i].t0 && tp <= SCANS[i].t0 + SCANS[i].dur) idx = i;
    else if (tp > SCANS[i].t0 + SCANS[i].dur && idx === i) { /* 已结束，保持 idx 由后续覆盖 */ }
  }
  if (idx >= 0) {
    const sc = SCANS[idx];
    const k = clamp01((tp - sc.t0) / sc.dur);
    U.scanR.value = sc.rMax * k;
    U.scanI.value = sc.i0 * (1 - k);
    scanWave.visible = true;
    scanWave.scale.setScalar(Math.max(0.001, sc.rMax * k));
    scanWaveMat.uniforms.uOpacity.value = 0.8 * (1 - k) * (sc.i0 / 2.4 + 0.35);
    scanWaveMat.uniforms.uColor.value.setHSL(sc.hue - k * 0.3, 1.0, 0.62);
    intro.scanIdx = idx;
  } else if (intro.scanIdx >= 0) {
    intro.scanIdx = -1;
    U.scanI.value = 0;
    scanWave.visible = false;
  }

  /* ---------- 结束 ---------- */
  if (intro.t >= intro.dur) finishIntro();
}

/* ============================================================
   副钩子：主循环写完各对象之后调用（覆盖日月核心 / 纽带 / 符文 / 光柱）
   ============================================================ */
export function applyIntroLate() {
  if (!intro.active) return;
  const tp = intro.tp;

  /* 日月核心光晕：展开期不超过正常尺寸的 50%（正常约 16~22） */
  const pulse = 0.5 + 0.5 * Math.sin(intro.t * 0.85);
  const gk = smoothstep(2.4, 6, tp);
  const s = 3 + 8 * gk;
  sunGlow.scale.setScalar(s);
  moonGlow.scale.setScalar(s * 0.75);
  sunGlow.material.opacity = (0.25 + 0.20 * pulse) * gk;
  moonGlow.material.opacity = (0.20 + 0.15 * pulse) * gk;

  /* 能量纽带：从无到有拉丝（主循环设的是 (1, len, 1)，这里压 x/z） */
  bondMesh.scale.x *= intro.bondK;
  bondMesh.scale.z *= intro.bondK;

  /* 符文：阶段四起隐隐浮现 */
  const runeK = smoothstep(9, 13, tp) * (0.55 + 0.45 * smoothstep(17, 21, tp));
  runes.forEach(r => { r.material.opacity *= runeK; });

  /* 北斗摇光光柱 */
  updateBeam(tp);
}

/* ---------- 摇光光柱 ---------- */
function makeBeam() {
  const g = new THREE.CylinderGeometry(0.45, 2.0, 46, 10, 1, true);
  g.translate(0, 23, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uTime: U.time },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uOpacity, uTime;
      varying vec2 vUv;
      void main(){
        float tip = pow(1.0 - vUv.y, 1.4);
        float edge = sin(vUv.x * 3.14159);
        float flow = 0.75 + 0.25 * sin(vUv.y * 26.0 - uTime * 6.0);
        float a = uOpacity * tip * (0.40 + 0.60 * edge) * flow;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.50) * a * 2.0, a);
      }
    `
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

function updateBeam(tp) {
  if (!intro.beam) intro.beam = makeBeam();
  const on = tp > 18.9 && tp < 21.2;
  intro.beam.visible = on;
  if (!on) return;
  const k = clamp01((tp - 18.9) / 0.4) * (1 - smoothstep(20.4, 21.2, tp));
  intro.beam.material.uniforms.uOpacity.value = 0.5 * k;
  beidouGroup.updateMatrixWorld();
  const p = new THREE.Vector3().copy(beidouStars[6].local).applyMatrix4(beidouGroup.matrixWorld);
  const dir = new THREE.Vector3(p.x, 0, p.z).normalize();
  intro.beam.position.copy(p);
  intro.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
}

/* ============================================================
   收尾：恢复常态，把控制权交还给循环与随机事件
   ============================================================ */
function finishIntro() {
  intro.active = false;

  layers.forEach((l, i) => {
    l.def.speed = baseSpeeds[i];
    l.points.material.uniforms.uReveal.value = 999;
    const ln = lineOf(l), fl = flowOf(l);
    if (ln) ln.material.uniforms.uGrow.value = 2;
    if (fl) fl.material.uniforms.uGrowR.value = 999;
  });
  dustPoints.material.uniforms.uAlpha.value = 1;
  motePoints.material.uniforms.uAlpha.value = 1;
  beasts.forEach(b => { b.points.visible = true; b.boostU.value = 0; });
  beidouGroup.visible = true;
  trailPoints.visible = true;

  U.bright.value = 1;
  bloomPass.strength = BLOOM_FINAL;
  finalPass.uniforms.uVigBoost.value = 0;
  finalPass.uniforms.uExpo.value = 1;
  U.scanR.value = -9999;
  U.scanI.value = 0;
  scanWave.visible = false;
  if (intro.beam) intro.beam.visible = false;

  if (intro.btn) { intro.btn.remove(); intro.btn = null; }
  if (intro.esc) { removeEventListener('keydown', intro.esc); intro.esc = null; }

  /* 随机事件系统接管：把各计时器清零，让事件很快自然到来 */
  events.scanT = -1;
  events.lastScan = 0;
  events.lastBeast = 0;
  events.lastOverload = 0;
  events.lastInf = 0;
  events.lastTaiji = 0;
}

/* ---------- 初始化 ---------- */
initIntro();
if (/[?&]nointro=1/.test(location.search)) skipIntro();   /* 调试用：跳过展开 */

/* ---------- 调试探针：?dbg=1 时可在控制台观察展开进度 ---------- */
if (/[?&]dbg=1/.test(location.search)) {
  window.__intro = intro;
  window.__introSeek = (sec) => { intro.t = sec; };   /* 快进到展开的某一秒，便于逐段检查 */
  window.__introDbg = () => ({
    t: +intro.t.toFixed(2), tp: +intro.tp.toFixed(2), 设计总长: DESIGN, 播放时长: intro.dur,
    active: intro.active, 亮度: +U.bright.value.toFixed(2), 泛光: +bloomPass.strength.toFixed(2),
    揭示半径: layers.map(l => +l.points.material.uniforms.uReveal.value.toFixed(0)),
    层转速: layers.map(l => +l.def.speed.toFixed(3)),
    扫描半径: +U.scanR.value.toFixed(1), 相机距离: +orbit.dist.toFixed(1)
  });
}

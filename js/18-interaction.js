/* ============================================================
   周天星斗大阵 · 18. 交互
   源文件分节 #18 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { rnd, rr, pick } from './00-utils.js';
import { canvas, renderer, camera, U, orbit, mouse, updateScale } from './01-core.js';
import { ripples } from './15-ripples.js';
import { composer, finalPass } from './17-postfx.js';
import { pickStarAt } from './19-hover.js';   /* 前向依赖：19 不反向引用 18，求值顺序安全 */

/* ============================================================
   18. 交互
   ============================================================ */
let dragging = false;
let lastX = 0, lastY = 0;
let downX = 0, downY = 0;

/* ---------- 多指支持：手机双指捏合缩放（原来只有 wheel，手机根本没缩放） ---------- */
const pointers = new Map();
let pinchDist = 0;
let lastTap = 0;

function pointerPair() {
  const it = pointers.values();
  const a = it.next().value, b = it.next().value;
  return a && b ? [a, b] : null;
}
function setMouseFrom(e) {
  mouse.px = e.clientX;
  mouse.py = e.clientY;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
}

canvas.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  setMouseFrom(e);

  if (pointers.size === 1) {
    dragging = true;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
  } else if (pointers.size === 2) {
    dragging = false;                       /* 双指期间不旋转 */
    const p = pointerPair();
    pinchDist = p ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
  }
});

canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  setMouseFrom(e);
  if (e.pointerType === 'mouse') mouse.active = true;   /* 触摸不启用悬停，改由点按选中 */

  /* ---------- 双指捏合缩放 ---------- */
  if (pointers.size >= 2) {
    const p = pointerPair();
    if (p) {
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinchDist > 0 && d > 0) {
        orbit.tDist = THREE.MathUtils.clamp(orbit.tDist * (pinchDist / d), 32, 340);
      }
      pinchDist = d;
    }
    return;
  }

  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    orbit.tTheta -= dx * 0.0055;
    orbit.tPhi = THREE.MathUtils.clamp(orbit.tPhi - dy * 0.005, 0.20, 1.40);
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchDist = 0;
  if (pointers.size === 0) dragging = false;
}

/* 双击复位到初始视角 */
function resetView() {
  orbit.tTheta = 0.85;
  orbit.tPhi = 1.02;
  orbit.tDist = 98;
}

canvas.addEventListener('pointerup', e => {
  endPointer(e);
  if (pointers.size > 0) return;                       /* 还有手指按着，不算点按 */
  if (Math.hypot(e.clientX - downX, e.clientY - downY) >= 8) return;   /* 拖拽不算点按 */

  /* ---------- 双击 → 复位视角 ---------- */
  const now = performance.now();
  if (now - lastTap < 320) { lastTap = 0; resetView(); return; }
  lastTap = now;

  /* ---------- 单击 → 涟漪 + 选中星位（手机也能看星名了） ---------- */
  const r = pick(ripples);
  r.t = 0;
  r.mesh.visible = true;
  r.maxR = rr(18, 34);
  r.mesh.position.set(
    (mouse.x) * 40,
    0.6,
    -(mouse.y) * 40
  );
  r.mesh.rotation.z = rnd() * Math.PI;
  // 触发一次小爆发
  U.scanI.value = Math.max(U.scanI.value, 0.6);

  pickStarAt(e.clientX, e.clientY);
});

canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  orbit.tDist = THREE.MathUtils.clamp(orbit.tDist * (1 + e.deltaY * 0.0009), 32, 340);
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  finalPass.uniforms.uRes.value.set(innerWidth, innerHeight);
  updateScale();
});



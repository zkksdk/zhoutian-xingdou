/* ============================================================
   周天星斗大阵 · 18. 交互
   源文件分节 #18 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { rnd, rr, pick } from './00-utils.js';
import { canvas, renderer, camera, U, orbit, mouse, updateScale } from './01-core.js';
import { ripples } from './15-ripples.js';
import { composer, finalPass } from './17-postfx.js';

/* ============================================================
   18. 交互
   ============================================================ */
let dragging = false;
let lastX = 0, lastY = 0;
let downX = 0, downY = 0;

canvas.addEventListener('pointerdown', e => {
  dragging = true;
  lastX = downX = e.clientX;
  lastY = downY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', e => {
  mouse.px = e.clientX;
  mouse.py = e.clientY;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
  mouse.active = true;

  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    orbit.tTheta -= dx * 0.0055;
    orbit.tPhi = THREE.MathUtils.clamp(orbit.tPhi - dy * 0.005, 0.20, 1.40);
  }
});

canvas.addEventListener('pointerup', e => {
  dragging = false;
  const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (dist < 6) {
    // 点击涟漪
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
  }
});

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

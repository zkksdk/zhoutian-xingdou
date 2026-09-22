/* ============================================================
   周天星斗大阵 · 1. 渲染器 / 场景 / 相机
   源文件分节 #1 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile } from './00-utils.js';

/* ============================================================
   1. 渲染器 / 场景 / 相机
   ============================================================ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: !isMobile, alpha: false,
  powerPreference: 'high-performance', stencil: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 6000);

/* ---------- 共享 uniforms ---------- */
const U = {
  time:   { value: 0 },
  scale:  { value: 1000 },
  scanR:  { value: -9999 },
  scanW:  { value: 7.0 },
  scanI:  { value: 0 },
  bright: { value: 1.0 },
  overload: { value: 0 },
  coreFlash: { value: 0 }
};

function updateScale() {
  const h = innerHeight * renderer.getPixelRatio();
  U.scale.value = h / (2 * Math.tan(camera.fov * Math.PI / 360));
}
updateScale();

/* ---------- 简易轨道控制 ---------- */
const orbit = {
  theta: 0.85, phi: 1.02, dist: 98,
  tTheta: 0.85, tPhi: 1.02, tDist: 98
};
const mouse = { x: 0, y: 0, sx: 0, sy: 0, px: -9999, py: -9999, active: false };

function applyCamera() {
  orbit.theta += (orbit.tTheta - orbit.theta) * 0.08;
  orbit.phi   += (orbit.tPhi   - orbit.phi)   * 0.08;
  orbit.dist  += (orbit.tDist  - orbit.dist)  * 0.06;

  mouse.sx += (mouse.x - mouse.sx) * 0.05;
  mouse.sy += (mouse.y - mouse.sy) * 0.05;

  const th = orbit.theta + mouse.sx * 0.10;
  const ph = THREE.MathUtils.clamp(orbit.phi + mouse.sy * 0.06, 0.18, 1.42);

  camera.position.set(
    orbit.dist * Math.sin(ph) * Math.cos(th),
    orbit.dist * Math.cos(ph),
    orbit.dist * Math.sin(ph) * Math.sin(th)
  );
  camera.lookAt(0, 0, 0);
}


export { canvas, renderer, scene, camera, U, orbit, mouse, applyCamera, updateScale };

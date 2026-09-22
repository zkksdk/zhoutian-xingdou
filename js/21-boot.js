/* ============================================================
   周天星斗大阵 · 21. 启动
   源文件分节 #21 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import { applyCamera, updateScale } from './01-core.js';
import { animate } from './20-main-loop.js';

/* ============================================================
   21. 启动
   ============================================================ */
applyCamera();
updateScale();
animate();

setTimeout(() => {
  const l = document.getElementById('loading');
  l.classList.add('hide');
  setTimeout(() => l.remove(), 1400);
}, 600);

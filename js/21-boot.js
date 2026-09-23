/* ============================================================
   周天星斗大阵 · 21. 启动
   源文件分节 #21 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import { isMobile } from './00-utils.js';
import { applyCamera, updateScale } from './01-core.js';
import { animate } from './20-main-loop.js';

/* ============================================================
   21. 启动
   ============================================================ */
applyCamera();
updateScale();

/* HUD 提示按设备切换（手机没有滚轮，别说“滚轮缩放”） */
const hud = document.getElementById('hud');
if (hud) {
  hud.textContent = isMobile
    ? '拖拽旋转 · 双指缩放 · 点按星位 · 双击复位'
    : '拖拽旋转 · 滚轮缩放 · 悬停 / 点击星位';
}

animate();
window.__booted = true;   /* 告诉 index.html 的兜底自检：主模块跑起来了 */

/* ---------- 等真的渲染出第一帧，再撤掉「布阵中」遮罩（原来是固定 600ms 假进度） ---------- */
function hideLoading() {
  const l = document.getElementById('loading');
  if (!l || l.dataset.done) return;
  l.dataset.done = '1';
  l.classList.add('hide');
  setTimeout(() => l.remove(), 1200);
}
requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(hideLoading, 220)));
setTimeout(hideLoading, 3500);   /* 兜底：rAF 被节流时也能撤掉 */


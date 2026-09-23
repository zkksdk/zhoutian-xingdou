/* ============================================================
   周天星斗大阵 · 19. 悬停检测
   源文件分节 #19 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { camera, mouse } from './01-core.js';
import { layers } from './04-starfield.js';

/* ============================================================
   19. 悬停检测
   ============================================================ */
const tmpV = new THREE.Vector3();
const nameTag = document.getElementById('nameTag');
let hoveredStar = null;
let hoverTick = 0;

/* ---------- 移动端点按：选中最近星位，3.5 秒后自动释放 ---------- */
let pickTimer = 0;
function pickStarAt(x, y) {
  mouse.px = x;
  mouse.py = y;
  mouse.active = true;
  clearTimeout(pickTimer);
  pickTimer = setTimeout(() => { mouse.active = false; }, 3500);
}

function updateHover() {
  if (!mouse.active) {
    if (hoveredStar) { hoveredStar.layerRef.hovU.value = -1; hoveredStar = null; nameTag.style.opacity = 0; }
    return;
  }

  /* 全局搜索较贵（365 个星位各做一次矩阵投影），隔 3 帧跑一次即可 */
  if (!hoveredStar || ++hoverTick % 3 === 0) {
    let best = null, bestD = 26 * 26;
    for (const layer of layers) {
      layer.group.updateMatrixWorld();
      for (const s of layer.stars) {
        tmpV.copy(s.local).applyMatrix4(layer.group.matrixWorld).project(camera);
        if (tmpV.z > 1) continue;
        const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
        const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
        const dx = sx - mouse.px, dy = sy - mouse.py;
        const dd = dx * dx + dy * dy;
        if (dd < bestD) { bestD = dd; best = s; }
      }
    }
    if (best !== hoveredStar) {
      if (hoveredStar) hoveredStar.layerRef.hovU.value = -1;
      hoveredStar = best;
      if (best) { best.layerRef.hovU.value = best.idx; nameTag.textContent = best.name; }
      else nameTag.style.opacity = 0;
    }
  }

  /* 标签位置：每帧只重算选中星位（1 次投影，而不是 365 次） */
  if (hoveredStar) {
    hoveredStar.layerRef.group.updateMatrixWorld();
    tmpV.copy(hoveredStar.local).applyMatrix4(hoveredStar.layerRef.group.matrixWorld).project(camera);
    nameTag.style.left = (tmpV.x * 0.5 + 0.5) * innerWidth + 'px';
    nameTag.style.top = (-tmpV.y * 0.5 + 0.5) * innerHeight + 'px';
    nameTag.style.opacity = tmpV.z > 1 ? 0 : 1;
  }
}

export { tmpV, nameTag, updateHover, pickStarAt };


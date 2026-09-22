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

function updateHover() {
  if (!mouse.active) {
    if (hoveredStar) { hoveredStar.layerRef.hovU.value = -1; hoveredStar = null; nameTag.style.opacity = 0; }
    return;
  }
  let best = null, bestD = 26 * 26;
  let bestScreen = null;

  for (const layer of layers) {
    layer.group.updateMatrixWorld();
    for (const s of layer.stars) {
      tmpV.copy(s.local).applyMatrix4(layer.group.matrixWorld).project(camera);
      if (tmpV.z > 1) continue;
      const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
      const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
      const dx = sx - mouse.px, dy = sy - mouse.py;
      const dd = dx * dx + dy * dy;
      if (dd < bestD) {
        bestD = dd;
        best = s;
        bestScreen = { x: sx, y: sy };
      }
    }
  }

  if (best !== hoveredStar) {
    if (hoveredStar) hoveredStar.layerRef.hovU.value = -1;
    hoveredStar = best;
    if (best) {
      best.layerRef.hovU.value = best.idx;
      nameTag.textContent = best.name;
    } else {
      nameTag.style.opacity = 0;
    }
  }

  if (hoveredStar && bestScreen) {
    nameTag.style.left = bestScreen.x + 'px';
    nameTag.style.top = bestScreen.y + 'px';
    nameTag.style.opacity = 1;
  }
}


export { tmpV, nameTag, updateHover };

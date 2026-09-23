/* ============================================================
   周天星斗大阵 · 16. 事件系统
   源文件分节 #16 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import { U } from './01-core.js';
import { beasts } from './06-beasts.js';
import { taijiMesh } from './10-taiji.js';

/* ============================================================
   16. 事件系统
   ============================================================ */
const events = {
  lastScan: -100,
  lastBeast: -100,
  lastOverload: -100,
  lastInf: -100,
  lastTaiji: -100,
  lastChain: 0,
  overloadT: -1,
  taijiT: -1,
  shake: 0
};

function triggerOverload() {
  events.overloadT = 0;
  U.overload.value = 1;
  events.shake = Math.max(events.shake, 1.0);
}

function triggerTaiji() {
  events.taijiT = 0;
  taijiMesh.visible = true;
  U.coreFlash.value = 1;
  events.shake = Math.max(events.shake, 0.8);
}

function triggerBeast(bi) {
  const b = beasts[bi];
  b.boostU.value = 1.0;
  b.eyeTimer = 3.0;
}


export { events, triggerOverload, triggerTaiji, triggerBeast };


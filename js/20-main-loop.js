/* ============================================================
   周天星斗大阵 · 20. 主循环
   源文件分节 #20 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr } from './00-utils.js';
import { U, applyCamera } from './01-core.js';
import { arrayGroup } from './03-array-root.js';
import { layers, chainScheduled } from './04-starfield.js';
import { beasts } from './06-beasts.js';
import { beidouGroup, beidouStars, trailLen, trailPoints, trailData } from './07-beidou.js';
import { sun, moon, sunGlow, moonGlow, bondMesh, PROM_N, promGeo, promCol, promData } from './08-sun-moon.js';
import { scanWaveMat, scanWave } from './09-scan-wave.js';
import { taijiMat, taijiMesh } from './10-taiji.js';
import { runes } from './11-runes.js';
import { meteors, spawnMeteor } from './13-meteors.js';
import { INF_N, infGeo, infData, infPoints, infState, startInfall } from './14-infall.js';
import { ripples } from './15-ripples.js';
import { events, triggerOverload, triggerTaiji, triggerBeast } from './16-events.js';
import { composer, finalPass } from './17-postfx.js';
import { tmpV, updateHover } from './19-hover.js';

/* ============================================================
   20. 主循环
   ============================================================ */
const clock = new THREE.Clock();
let frameAcc = 0, frameCount = 0;

// 星链传播调度
function scheduleChain() {
  const li = Math.floor(Math.random() * layers.length);
  const layer = layers[li];
  const start = Math.floor(Math.random() * layer.stars.length);
  const visited = new Set();
  const queue = [{ li, idx: start, at: 0 }];
  visited.add(start);

  let count = 0;
  while (queue.length && count < 40) {
    const cur = queue.shift();
    chainScheduled.push(cur);
    count++;
    const nbrs = layers[cur.li].links.get(cur.idx) || [];
    for (const nb of nbrs) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      if (Math.random() > 0.55) {
        queue.push({ li: cur.li, idx: nb, at: cur.at + rr(0.10, 0.26) });
      }
      if (count + queue.length > 45) break;
    }
  }
}

let chainClock = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  U.time.value = t;
  chainClock += dt;

  /* ---------- 相机 ---------- */
  applyCamera();

  /* ---------- 整体旋转 ---------- */
  arrayGroup.rotation.y += dt * 0.011;
  layers.forEach((l, i) => {
    l.group.rotation.y += dt * l.def.speed;
  });
  beidouGroup.rotation.y += dt * 0.075;

  /* ---------- 符文旋转 ---------- */
  runes.forEach(r => {
    r.rotation.z += dt * r.userData.spd;
    r.material.opacity = 0.08 + 0.09 * (0.5 + 0.5 * Math.sin(t * 0.6 + r.position.y));
  });

  /* ---------- 太阳 / 太阴轨道 ---------- */
  const orbitAng = t * 0.085;
  const orbR = 6.2;
  const sunPos = new THREE.Vector3(Math.cos(orbitAng) * orbR, Math.sin(orbitAng * 1.7) * 0.9, Math.sin(orbitAng) * orbR);
  const moonPos = new THREE.Vector3(-Math.cos(orbitAng) * orbR, -Math.sin(orbitAng * 1.7) * 0.9, -Math.sin(orbitAng) * orbR);
  sun.position.copy(sunPos);
  moon.position.copy(moonPos);

  const pulse = 0.5 + 0.5 * Math.sin(t * 0.85);
  const pulse2 = 0.5 + 0.5 * Math.sin(t * 0.85 + Math.PI);

  sunGlow.position.copy(sunPos);
  moonGlow.position.copy(moonPos);
  sunGlow.scale.setScalar(16 + pulse * 6 + U.coreFlash.value * 15);
  moonGlow.scale.setScalar(12 + pulse2 * 5 + U.coreFlash.value * 12);
  sunGlow.material.opacity = 0.50 + pulse * 0.20;
  moonGlow.material.opacity = 0.40 + pulse2 * 0.20;
  sunGlow.material.color.setHSL(0.09, 1.0, 0.40 + pulse * 0.10);
  moonGlow.material.color.setHSL(0.56, 0.85, 0.50 + pulse2 * 0.10);

  /* ---------- 能量纽带 ---------- */
  {
    const mid = new THREE.Vector3().addVectors(sunPos, moonPos).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(moonPos, sunPos);
    const len = dir.length();
    bondMesh.position.copy(mid);
    bondMesh.scale.set(1, len, 1);
    bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  }

  /* ---------- 日珥粒子 ---------- */
  {
    const arr = promGeo.attributes.position.array;
    for (let i = 0; i < PROM_N; i++) {
      const d = promData[i];
      d.life += dt * d.spd * 0.35;
      if (d.life > 1) {
        d.life = 0;
        d.ang = rnd() * Math.PI * 2;
        d.el = rr(-0.9, 0.9);
        d.spd = rr(1.5, 5.5);
        d.isSun = rnd() > 0.42;
      }
      const rad = 2.6 + d.life * rr(2.0, 5.0) * (d.isSun ? 1.4 : 1.0);
      const y = d.el * rad * 0.65 + Math.sin(d.life * 6.0) * 0.6;
      const rr2 = Math.sqrt(Math.max(0, rad * rad - y * y));
      const cx = Math.cos(d.ang) * rr2;
      const cz = Math.sin(d.ang) * rr2;

      const base = d.isSun ? sunPos : moonPos;
      arr[i * 3] = base.x + cx;
      arr[i * 3 + 1] = base.y + y;
      arr[i * 3 + 2] = base.z + cz;

      const fade = Math.sin(d.life * Math.PI);
      if (d.isSun) {
        promCol[i * 3] = 1.0; promCol[i * 3 + 1] = 0.45 + fade * 0.4; promCol[i * 3 + 2] = 0.12;
      } else {
        promCol[i * 3] = 0.5 + fade * 0.3; promCol[i * 3 + 1] = 0.78; promCol[i * 3 + 2] = 1.0;
      }
    }
    promGeo.attributes.position.needsUpdate = true;
    promGeo.attributes.aColor.needsUpdate = true;
  }

  /* ---------- 周天扫描 ---------- */
  if (t - events.lastScan > (isMobile ? 11 : 8.5)) {
    events.lastScan = t;
    events.scanT = 0;
  }
  if (events.scanT !== undefined && events.scanT >= 0) {
    events.scanT += dt * 20;
    U.scanR.value = events.scanT;
    U.scanI.value = 2.4 * Math.max(0, 1 - events.scanT / 85);
    scanWave.visible = true;
    scanWave.scale.setScalar(events.scanT);
    scanWaveMat.uniforms.uOpacity.value = Math.max(0, 0.85 * (1 - events.scanT / 80));
    scanWaveMat.uniforms.uColor.value.setHSL(0.12 - events.scanT / 85 * 0.38, 1.0, 0.62);
    if (events.scanT > 85) {
      events.scanT = -1;
      U.scanR.value = -9999;
      U.scanI.value = 0;
      scanWave.visible = false;
    }
  }

  /* ---------- 星链传播 ---------- */
  for (let i = chainScheduled.length - 1; i >= 0; i--) {
    const c = chainScheduled[i];
    c.at -= dt;
    if (c.at <= 0) {
      const layer = layers[c.li];
      const glow = layer.glowAttr.array;
      glow[c.idx] = Math.min(2.6, glow[c.idx] + 1.7);
      chainScheduled.splice(i, 1);
    }
  }
  if (chainClock > rr(1.6, 4.2)) {
    chainClock = 0;
    scheduleChain();
  }

  /* ---------- 星位辉光衰减 ---------- */
  for (const layer of layers) {
    const g = layer.glowAttr.array;
    let dirty = false;
    for (let i = 0; i < g.length; i++) {
      if (g[i] > 0.001) {
        g[i] *= Math.pow(0.06, dt);
        if (g[i] < 0.001) g[i] = 0;
        dirty = true;
      }
    }
    if (dirty) layer.glowAttr.needsUpdate = true;
  }

  /* ---------- 北斗 / 拖尾 ---------- */
  {
    beidouGroup.updateMatrixWorld();
    const trailGeo = trailPoints.geometry;
    const tpos = trailGeo.attributes.position.array;

    beidouStars.forEach((s, i) => {
      tmpV.copy(s.local).applyMatrix4(beidouGroup.matrixWorld);
      const d = trailData[i];
      d.hist.unshift(tmpV.clone());
      if (d.hist.length > trailLen) d.hist.length = trailLen;
      while (d.hist.length < trailLen) d.hist.push(tmpV.clone());

      for (let k = 0; k < trailLen; k++) {
        const idx = (i * trailLen + k) * 3;
        tpos[idx] = d.hist[k].x;
        tpos[idx + 1] = d.hist[k].y;
        tpos[idx + 2] = d.hist[k].z;
      }
    });
    trailGeo.attributes.position.needsUpdate = true;
  }

  /* ---------- 北斗连珠 / 指向 ---------- */
  {
    const bdGeo = beidouGroup.userData.geo;
    const glow = bdGeo.attributes.aGlow.array;
    const phase = (t % 12) / 12;
    for (let i = 0; i < 7; i++) {
      const target = i / 7;
      const d = Math.abs(phase - target);
      const v = d < 0.06 ? 1.0 : Math.max(0, 1 - d * 5.5);
      glow[i] = Math.max(glow[i] * Math.pow(0.02, dt), v);
    }
    bdGeo.attributes.aGlow.needsUpdate = true;

    // 摇光光柱指向
    if (Math.abs(phase - 1.0) < 0.08 || Math.abs(phase - 0.0) < 0.05) {
      U.scanI.value = Math.max(U.scanI.value, 0.4);
    }
  }

  /* ---------- 四象神兽呼吸 ---------- */
  beasts.forEach((b, i) => {
    b.boostU.value *= Math.pow(0.35, dt);
    b.eyeTimer -= dt;
    if (b.eyeTimer <= 0) {
      b.eyeTimer = rr(4, 12);
      b.boostU.value = Math.min(1.6, b.boostU.value + 0.9);
    }
  });

  /* ---------- 神兽降临 ---------- */
  if (t - events.lastBeast > rr(14, 22)) {
    events.lastBeast = t;
    triggerBeast(Math.floor(Math.random() * 4));
    U.scanI.value = Math.max(U.scanI.value, 0.9);
    events.shake = Math.max(events.shake, 0.5);
  }

  /* ---------- 三垣共鸣（超载） ---------- */
  if (t - events.lastOverload > 26) {
    events.lastOverload = t;
    triggerOverload();
  }
  if (events.overloadT >= 0) {
    events.overloadT += dt;
    const k = Math.max(0, 1 - events.overloadT / 3.5);
    U.overload.value = k;
    U.bright.value = 1.0 + k * 0.4;   // 原 1.4 —— 过载时不再把画面顶爆
    U.coreFlash.value = Math.max(U.coreFlash.value, k * 0.9);
    if (events.overloadT > 3.5) {
      events.overloadT = -1;
      U.bright.value = 1.0;
      U.overload.value = 0;
    }
  } else {
    U.bright.value += (1.0 - U.bright.value) * dt * 3;
  }

  /* ---------- 日月同辉 ---------- */
  if (t - events.lastTaiji > 24) {
    events.lastTaiji = t;
    triggerTaiji();
  }
  if (events.taijiT >= 0) {
    events.taijiT += dt;
    const k = events.taijiT < 1.2
      ? events.taijiT / 1.2
      : Math.max(0, 1 - (events.taijiT - 1.2) / 3.0);
    taijiMat.uniforms.uOpacity.value = k * 0.9;
    taijiMesh.scale.setScalar(0.6 + k * 0.9);
    if (events.taijiT > 4.2) {
      events.taijiT = -1;
      taijiMesh.visible = false;
      taijiMat.uniforms.uOpacity.value = 0;
    }
  }
  U.coreFlash.value *= Math.pow(0.12, dt);

  /* ---------- 星河倒灌 ---------- */
  if (!infState.active && t - events.lastInf > 30) {
    events.lastInf = t;
    startInfall();
  }
  if (infState.active) {
    infState.timer += dt;
    const arr = infGeo.attributes.position.array;
    let alive = 0;
    for (let i = 0; i < INF_N; i++) {
      const d = infData[i];
      if (!d.active) {
        arr[i * 3 + 1] = -9999;
        continue;
      }
      d.life -= dt;
      d.p.addScaledVector(d.v, dt);
      // 向心引力
      const toCenter = d.p.clone().multiplyScalar(-1).normalize().multiplyScalar(dt * 55);
      d.v.add(toCenter);
      // 切向涡旋
      const tang = new THREE.Vector3(-d.p.z, 0, d.p.x).normalize().multiplyScalar(dt * 20);
      d.v.add(tang);

      arr[i * 3] = d.p.x;
      arr[i * 3 + 1] = d.p.y;
      arr[i * 3 + 2] = d.p.z;

      if (d.life <= 0 || d.p.length() < 6) {
        d.active = false;
        arr[i * 3 + 1] = -9999;
      } else {
        alive++;
      }
    }
    infGeo.attributes.position.needsUpdate = true;
    if (alive === 0 || infState.timer > 8) {
      infState.active = false;
      infPoints.visible = false;
      // 中心爆发
      U.coreFlash.value = 1.2;
      U.scanI.value = 1.6;
      U.scanR.value = 0;
      events.scanT = 0;
      events.shake = 1.0;
    }
  }

  /* ---------- 流星 ---------- */
  if (Math.random() < dt * 0.55) spawnMeteor();
  for (const m of meteors) {
    if (!m.active) continue;
    m.life -= dt;
    m.pos.addScaledVector(m.vel, dt);
    m.hist.unshift(m.pos.clone());
    if (m.hist.length > m.LEN) m.hist.length = m.LEN;

    const arr = m.line.geometry.attributes.position.array;
    for (let k = 0; k < m.LEN; k++) {
      const p = m.hist[Math.min(k, m.hist.length - 1)];
      arr[k * 3] = p.x;
      arr[k * 3 + 1] = p.y;
      arr[k * 3 + 2] = p.z;
    }
    m.line.geometry.attributes.position.needsUpdate = true;

    if (m.life <= 0 || m.pos.length() > 900) {
      m.active = false;
      m.line.visible = false;
    }
  }

  /* ---------- 涟漪 ---------- */
  for (const r of ripples) {
    if (r.t < 0) continue;
    r.t += dt;
    const k = r.t / 1.4;
    if (k >= 1) {
      r.t = -1;
      r.mesh.visible = false;
      r.mat.uniforms.uOpacity.value = 0;
      continue;
    }
    const sc = r.maxR * k;
    r.mesh.scale.set(sc, sc, 1);
    r.mat.uniforms.uOpacity.value = (1 - k) * 0.85;
    const hue = 0.11 + (1 - k) * 0.45;
    r.mat.uniforms.uColor.value.setHSL(hue, 1.0, 0.62);
  }

  /* ---------- 屏幕抖动 ---------- */
  events.shake *= Math.pow(0.08, dt);
  finalPass.uniforms.uShake.value = events.shake;

  /* ---------- 悬停 ---------- */
  updateHover();

  /* ---------- 渲染 ---------- */
  composer.render();
}


export { clock, frameAcc, frameCount, scheduleChain, chainClock, animate };


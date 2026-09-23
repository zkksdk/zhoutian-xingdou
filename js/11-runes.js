/* ============================================================
   周天星斗大阵 · 11. 符文光纹
   源文件分节 #11 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { canvas } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   11. 符文光纹
   ============================================================ */
function makeRuneTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.lineCap = 'round';
  const N = 40;
  for (let i = 0; i < N; i++) {
    g.save();
    g.rotate((i / N) * Math.PI * 2 + Math.random() * 0.05);
    g.translate(215, 0);
    g.strokeStyle = 'rgba(190,215,255,0.95)';
    g.lineWidth = 2.6;
    g.beginPath();
    const strokes = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < strokes; k++) {
      const x1 = (Math.random() - 0.5) * 18;
      const y1 = (Math.random() - 0.5) * 18;
      const x2 = (Math.random() - 0.5) * 18;
      const y2 = (Math.random() - 0.5) * 18;
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
    }
    g.stroke();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const runeTex = makeRuneTexture();
const runes = [];
for (let i = 0; i < 3; i++) {
  const r = 14 + i * 14;
  const size = r * 2.55;
  const m = new THREE.MeshBasicMaterial({
    map: runeTex, transparent: true, opacity: 0.13 + i * 0.03,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    color: new THREE.Color([0xbb88ff, 0x66ddff, 0xffddaa][i])
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 1.2 + i * 0.5;
  mesh.userData.spd = (i % 2 === 0 ? 1 : -1) * (0.03 + i * 0.012);
  arrayGroup.add(mesh);
  runes.push(mesh);
}


export { makeRuneTexture, runeTex, runes };


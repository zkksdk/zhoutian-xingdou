/* ============================================================
   周天星斗大阵 · 14. 星河倒灌
   源文件分节 #14 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { isMobile, rnd, rr } from './00-utils.js';
import { scene, U } from './01-core.js';

/* ============================================================
   14. 星河倒灌
   ============================================================ */
const INF_N = isMobile ? 260 : 600;
const infGeo = new THREE.BufferGeometry();
const infPos = new Float32Array(INF_N * 3);
const infCol = new Float32Array(INF_N * 3);
const infSize = new Float32Array(INF_N);
const infData = [];
for (let i = 0; i < INF_N; i++) {
  infData.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, active: false });
  infSize[i] = rr(0.2, 0.6);
  infCol[i * 3] = 0.85; infCol[i * 3 + 1] = 0.92; infCol[i * 3 + 2] = 1.0;
}
infGeo.setAttribute('position', new THREE.BufferAttribute(infPos, 3).setUsage(THREE.DynamicDrawUsage));
infGeo.setAttribute('aColor', new THREE.BufferAttribute(infCol, 3));
infGeo.setAttribute('aSize', new THREE.BufferAttribute(infSize, 1));
const infMat = new THREE.ShaderMaterial({
  uniforms: { uScale: U.scale },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    uniform float uScale;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vColor = aColor;
      gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.5, 18.0);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main(){
      vec2 p = gl_PointCoord - 0.5;
      float r2 = dot(p, p) * 4.0;
      if(r2 > 1.0) discard;
      gl_FragColor = vec4(vColor * 2.2, exp(-r2 * 2.8));
    }
  `
});
const infPoints = new THREE.Points(infGeo, infMat);
infPoints.frustumCulled = false;
infPoints.visible = false;
scene.add(infPoints);

let infActive = false, infTimer = 0;

function startInfall() {
  infActive = true;
  infTimer = 0;
  infPoints.visible = true;
  for (const d of infData) {
    const a = rnd() * Math.PI * 2;
    const r = rr(180, 320);
    d.p.set(Math.cos(a) * r, rr(40, 160), Math.sin(a) * r);
    d.v.copy(d.p).multiplyScalar(-1).normalize();
    // 添加切向，形成螺旋倒灌
    const tang = new THREE.Vector3(-d.p.z, 0, d.p.x).normalize().multiplyScalar(rr(20, 70));
    d.v.multiplyScalar(rr(90, 190)).add(tang);
    d.life = rr(1.8, 3.6);
    d.active = true;
  }
}


/* ---------- 跨模块可变状态桥 ----------
   infActive / infTimer 是 let 变量，被 20-主循环 读写；
   ES 模块导入的绑定是只读的，所以这里用访问器桥接出去。 */
const infState = {
  get active() { return infActive; },
  set active(v) { infActive = v; },
  get timer() { return infTimer; },
  set timer(v) { infTimer = v; }
};

export { INF_N, infGeo, infPos, infCol, infSize, infData, infMat, infPoints, infState, startInfall };

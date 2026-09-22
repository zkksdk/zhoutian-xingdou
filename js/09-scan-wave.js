/* ============================================================
   周天星斗大阵 · 9. 周天扫描波
   源文件分节 #9 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   9. 周天扫描波
   ============================================================ */
const scanWaveMat = new THREE.ShaderMaterial({
  uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xffd070) }, uTime: U.time },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uOpacity, uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main(){
      float ang = atan(vUv.y - 0.5, vUv.x - 0.5);
      float ripple = 0.5 + 0.5 * sin(ang * 60.0 - uTime * 6.0);
      float a = uOpacity * (0.45 + 0.55 * ripple);
      gl_FragColor = vec4(uColor * a * 1.6, a);
    }
  `
});
const scanWave = new THREE.Mesh(new THREE.RingGeometry(0.94, 1.0, 256, 1), scanWaveMat);
scanWave.rotation.x = -Math.PI / 2;
scanWave.visible = false;
arrayGroup.add(scanWave);


export { scanWaveMat, scanWave };

/* ============================================================
   周天星斗大阵 · 10. 太极光晕（日月同辉）
   源文件分节 #10 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { U } from './01-core.js';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   10. 太极光晕（日月同辉）
   ============================================================ */
const taijiMat = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time, uOpacity: { value: 0 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime, uOpacity;
    varying vec2 vUv;
    void main(){
      vec2 p = (vUv - 0.5) * 2.0;
      float r = length(p);
      if(r > 1.0) discard;
      float ang = atan(p.y, p.x) + uTime * 0.35;
      float swirl = sin(ang * 2.0 + r * 9.0) * 0.5 + 0.5;
      float ring = exp(-pow((r - 0.62) * 5.0, 2.0));
      float body = smoothstep(1.0, 0.15, r);
      float a = uOpacity * body * (0.25 + 0.75 * swirl) * (0.5 + 0.8 * ring);
      vec3 gold = vec3(1.0, 0.80, 0.30);
      vec3 ice  = vec3(0.45, 0.82, 1.0);
      vec3 col = mix(gold, ice, smoothstep(0.35, 0.65, swirl));
      gl_FragColor = vec4(col * a * 1.8, a);
    }
  `
});
const taijiMesh = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), taijiMat);
taijiMesh.rotation.x = -Math.PI / 2;
taijiMesh.visible = false;
arrayGroup.add(taijiMesh);


export { taijiMat, taijiMesh };

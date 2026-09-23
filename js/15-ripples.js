/* ============================================================
   周天星斗大阵 · 15. 点击涟漪
   源文件分节 #15 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { arrayGroup } from './03-array-root.js';

/* ============================================================
   15. 点击涟漪
   ============================================================ */
const ripples = [];
for (let i = 0; i < 8; i++) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xffd070) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float ring = exp(-pow((d - 0.78) * 9.0, 2.0));
        float a = ring * uOpacity;
        gl_FragColor = vec4(uColor * a * 2.0, a);
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  arrayGroup.add(mesh);
  ripples.push({ mesh, mat, t: -1, maxR: 1 });
}


export { ripples };


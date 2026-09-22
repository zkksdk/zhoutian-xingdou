/* ============================================================
   周天星斗大阵 · 17. 后处理
   源文件分节 #17 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { isMobile } from './00-utils.js';
import { renderer, scene, camera } from './01-core.js';

/* ============================================================
   17. 后处理
   ============================================================ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  isMobile ? 0.85 : 1.18,
  0.72,
  0.20
);
composer.addPass(bloomPass);

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uShake: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uShake;
    varying vec2 vUv;

    float hash(vec2 p){
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main(){
      vec2 uv = vUv;

      // 轻微屏幕抖动
      if(uShake > 0.001){
        uv.x += (hash(vec2(uTime * 91.7, 3.1)) - 0.5) * 0.006 * uShake;
        uv.y += (hash(vec2(7.3, uTime * 77.3)) - 0.5) * 0.006 * uShake;
      }

      vec2 dir = uv - 0.5;
      float d = length(dir);

      // 色差
      float ca = 0.0012 + d * d * 0.0075;
      vec2 off = dir * ca;

      vec3 col;
      col.r = texture2D(tDiffuse, uv - off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv + off).b;

      // 暗角
      float vig = smoothstep(1.25, 0.18, d * 1.42);
      col *= mix(0.42, 1.0, vig);

      // 胶片颗粒
      float g = hash(uv * uRes + vec2(uTime * 173.0, uTime * 91.0));
      col += (g - 0.5) * 0.042;

      // 轻微对比增强
      col = (col - 0.5) * 1.06 + 0.5;
      col = max(col, 0.0);

      // 边缘微暗红晕
      col += vec3(0.06, 0.02, 0.0) * smoothstep(0.75, 1.35, d * 1.4);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};
const finalPass = new ShaderPass(FinalShader);
composer.addPass(finalPass);


export { composer, bloomPass, FinalShader, finalPass };

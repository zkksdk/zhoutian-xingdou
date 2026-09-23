/* ============================================================
   周天星斗大阵 · 0. 基础工具
   源文件分节 #0 —— 仅加入了模块 import / export，逻辑未改动
   ============================================================ */
/* 无外部依赖 */

/* ============================================================
   0. 基础工具
   ============================================================ */
const isMobile = /Mobi|Android|iPhone|iPad|iPod|HarmonyOS/i.test(navigator.userAgent) || innerWidth < 820;

let _seed = 987654321;
function rnd() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }
function rr(a, b) { return a + (b - a) * rnd(); }
function pick(arr) { return arr[(rnd() * arr.length) | 0]; }

/* ---------- 通用 GLSL 噪声 ---------- */
const NOISE = `
vec3 hash33(vec3 p){
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
                     dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
                     dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
                     dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
                     dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 4; i++){ v += a * snoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;


export { isMobile, rnd, rr, pick, NOISE };


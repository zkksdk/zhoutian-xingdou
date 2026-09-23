/* ============================================================
   周天星斗大阵 · 入口清单
   按顺序导入 22 个分节：ES 模块会按此顺序依次求值，
   与原始单文件中代码自上而下执行的顺序、结果完全一致。
   ============================================================ */
import './00-utils.js';
import './01-core.js';
import './02-nebula.js';
import './03-array-root.js';
import './04-starfield.js';
import './05-dust-stars.js';
import './06-beasts.js';
import './07-beidou.js';
import './08-sun-moon.js';
import './09-scan-wave.js';
import './10-taiji.js';
import './11-runes.js';
import './12-motes.js';
import './13-meteors.js';
import './14-infall.js';
import './15-ripples.js';
import './16-events.js';
import './17-postfx.js';
import './18-interaction.js';
import './19-hover.js';
import './20-main-loop.js';
import './22-intro.js';
import './21-boot.js';

/* 汇总导出（按需取用，非必需） */
export * from "./01-core.js";
export * from "./04-starfield.js";
export * from "./16-events.js";
export * from "./20-main-loop.js";


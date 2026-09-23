# 周天星斗大阵（工程化拆分版）

由一个 78KB 的单文件 HTML 拆成的标准前端工程：**视觉逻辑一行未改**，只做了「搬家 + 模块化」，
之后叠加了移动端可用的交互、自适应画质与过曝压制。

> 线上：**https://zkksdk.github.io/zhoutian-xingdou/**

## 目录结构

```
zhoutian-xingdou/
├── index.html          # 页面骨架 + importmap + 入口脚本 + 错误兜底
├── css/
│   └── style.css       # 原 <style> 块
├── js/
│   ├── main.js         # 入口清单：按顺序 import 22 个分节
│   ├── 00-utils.js     # 0. 基础工具（伪随机、GLSL 噪声）
│   ├── 01-core.js      # 1. 渲染器 / 场景 / 相机 / 共享 uniforms
│   ├── 02-nebula.js    # 2. 背景星云 + 深空星尘
│   ├── 03-array-root.js# 3. 大阵根节点
│   ├── 04-starfield.js # 4. 星位数据层（三垣 + 二十八宿）
│   ├── 05-dust-stars.js# 5. 副星辰（14800 颗尘星）
│   ├── 06-beasts.js    # 6. 四象神兽虚影
│   ├── 07-beidou.js    # 7. 北斗七星 + 拖尾
│   ├── 08-sun-moon.js  # 8. 阵眼：太阳星 / 太阴星 + 日珥
│   ├── 09-scan-wave.js # 9. 周天扫描波
│   ├── 10-taiji.js     # 10. 太极光晕（日月同辉）
│   ├── 11-runes.js     # 11. 符文光纹
│   ├── 12-motes.js     # 12. 星尘粒子
│   ├── 13-meteors.js   # 13. 流星
│   ├── 14-infall.js    # 14. 星河倒灌
│   ├── 15-ripples.js   # 15. 点击涟漪
│   ├── 16-events.js    # 16. 事件系统
│   ├── 17-postfx.js    # 17. 后处理（Bloom / 色差 / 暗角 / 高光压制）
│   ├── 18-interaction.js # 18. 交互（拖拽 / 滚轮 / 双指捏合 / 双击复位）
│   ├── 19-hover.js     # 19. 星位悬停与点选
│   ├── 20-main-loop.js # 20. 主循环（含自适应画质）
│   └── 21-boot.js      # 21. 启动
├── vendor/three/       # three.js r160（min 版）+ 后处理插件，已本地化，不依赖 CDN
└── README.md
```

## 交互

| 操作 | 桌面 | 手机 |
|---|---|---|
| 旋转视角 | 拖拽 | 拖拽 |
| 缩放 | 滚轮 | **双指捏合** |
| 复位视角 | 双击 | **双击** |
| 看星名 | 悬停 / 点击 | **点按** |
| 呼出涟漪 | 点击 | 点按 |

地址后加 `?dbg=1` 可打开左上角调试面板（FPS / 画质等级 / DPR / 绘制调用数）。

## 自适应画质

主循环会统计实时帧率，**低于 34 FPS 持续两秒**就自动降级：

1. 第 1 级：关闭全屏辉光（UnrealBloom 要跑 5 级模糊，是最贵的一项）
2. 第 2 级：像素比降到 1.0

切到后台会停止排帧，回到前台自动恢复（省电、防过热）。

## 依赖

three.js **已本地化到 `vendor/`**（r160，min 版约 655KB），不依赖任何 CDN。
想升级版本：替换 `vendor/three/three.module.js` 与 `vendor/three/addons/` 下的 4 个 pass 插件及其依赖
（`Pass.js` / `MaskPass.js` / `shaders/CopyShader.js` / `shaders/LuminosityHighPassShader.js`）。

## 运行

模块 + importmap 需要 HTTP 环境（`file://` 会被 CORS 拦）：

```bash
cd zhoutian-xingdou
python3 -m http.server 8080      # 或 npx serve .
# 浏览器打开 http://localhost:8080/
```

## 排查

- 页面顶部出现**红色横幅**：里面会直接写清失败原因（WebGL 不支持 / 模块加载失败 / 运行错误）。
- 控制台敲 `__errs` 可以看到收集到的全部错误。
- `_diagnose.html` 是独立的渲染自检页，逐项检测 WebGL2 / GPU / half-float / 着色器 / 模块加载。

## 改动记录

- **拆分**：22 个分节 → 独立 ES 模块（依赖单向，前向 import 末尾 export；`infActive`/`infTimer` 用 `infState` 访问器桥接）。
- **过曝压制**：Bloom 强度/半径/阈值下调；日月本体加 `min(uFlash,1.0)` 上限；光晕 Sprite 缩小；过载亮度 `1.4→0.4`；
  后处理末尾加 Reinhard 高光压制。实测白爆像素占比 47.7% → 10.3%。
- **移动端交互**：双指捏合缩放、双击复位、点按选中星位（原来手机既不能缩放也看不到星名）。
- **性能**：悬停检测由「每帧 365 次投影」改为「隔 3 帧搜索 + 每帧只算选中星位」；新增自适应降级与后台暂停。
- **健壮性**：three.js 本地化；页面内错误横幅；真实首帧后才撤掉「布阵中」遮罩。

## 部署

GitHub Pages（`main` 分支根目录）。⚠️ Pages 的 CDN 缓存是 `max-age=600`，
推完代码后**刷新页面可能仍拿到旧 JS**，等 10 分钟或硬刷新即可。

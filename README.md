# 周天星斗大阵（工程化拆分版）

把原来的单文件 HTML（HTML + CSS + JS 全塞在一个 `deepseek_html_*.html` 里）拆成了标准的前端工程结构，
**所有视觉与交互逻辑一行未改**，只做了「搬家 + 模块化」。

## 目录结构

```
zhoutian-xingdou/
├── index.html          # 页面骨架 + importmap + 入口脚本
├── css/
│   └── style.css       # 原 <style> 块，原样搬出
├── js/
│   ├── main.js         # 入口清单：按顺序 import 22 个分节
│   ├── 00-utils.js       # 0. 基础工具
│   ├── 01-core.js        # 1. 渲染器 / 场景 / 相机
│   ├── 02-nebula.js      # 2. 背景：动态星云 + 深空星尘
│   ├── 03-array-root.js  # 3. 大阵根节点
│   ├── 04-starfield.js   # 4. 星位数据层（三垣 + 二十八宿）
│   ├── 05-dust-stars.js  # 5. 副星辰（一万四千八百颗尘星）
│   ├── 06-beasts.js      # 6. 四象神兽虚影
│   ├── 07-beidou.js      # 7. 北斗七星
│   ├── 08-sun-moon.js    # 8. 阵眼：太阳星 / 太阴星
│   ├── 09-scan-wave.js   # 9. 周天扫描波
│   ├── 10-taiji.js       # 10. 太极光晕（日月同辉）
│   ├── 11-runes.js       # 11. 符文光纹
│   ├── 12-motes.js       # 12. 星尘粒子（阵周围漂浮）
│   ├── 13-meteors.js     # 13. 流星
│   ├── 14-infall.js      # 14. 星河倒灌
│   ├── 15-ripples.js     # 15. 点击涟漪
│   ├── 16-events.js      # 16. 事件系统
│   ├── 17-postfx.js      # 17. 后处理
│   ├── 18-interaction.js # 18. 交互
│   ├── 19-hover.js       # 19. 悬停检测
│   ├── 20-main-loop.js   # 20. 主循环
│   ├── 21-boot.js        # 21. 启动
└── README.md
```

## 分节对照（原文件编号 → 文件）

- `js/00-utils.js` — 0. 基础工具
- `js/01-core.js` — 1. 渲染器 / 场景 / 相机
- `js/02-nebula.js` — 2. 背景：动态星云 + 深空星尘
- `js/03-array-root.js` — 3. 大阵根节点
- `js/04-starfield.js` — 4. 星位数据层（三垣 + 二十八宿）
- `js/05-dust-stars.js` — 5. 副星辰（一万四千八百颗尘星）
- `js/06-beasts.js` — 6. 四象神兽虚影
- `js/07-beidou.js` — 7. 北斗七星
- `js/08-sun-moon.js` — 8. 阵眼：太阳星 / 太阴星
- `js/09-scan-wave.js` — 9. 周天扫描波
- `js/10-taiji.js` — 10. 太极光晕（日月同辉）
- `js/11-runes.js` — 11. 符文光纹
- `js/12-motes.js` — 12. 星尘粒子（阵周围漂浮）
- `js/13-meteors.js` — 13. 流星
- `js/14-infall.js` — 14. 星河倒灌
- `js/15-ripples.js` — 15. 点击涟漪
- `js/16-events.js` — 16. 事件系统
- `js/17-postfx.js` — 17. 后处理
- `js/18-interaction.js` — 18. 交互
- `js/19-hover.js` — 19. 悬停检测
- `js/20-main-loop.js` — 20. 主循环
- `js/21-boot.js` — 21. 启动

## 为什么可以这样拆

原文件的 22 个分节**依赖方向是单向的**：后面的分节只引用前面已经定义好的东西，
所以每节都能安全地变成一个 ES 模块 —— 前向 import，末尾 export。
执行顺序由 `js/main.js` 的导入顺序保证，与单文件自上而下执行完全等价。

唯一需要特殊处理的是 `infActive` / `infTimer`：它们是 `let` 变量，会被主循环（第 20 节）读写，
而 ES 模块的导入绑定是只读的。因此 `js/14-infall.js` 末尾加了一个 `infState` 访问器桥，
主循环改用 `infState.active` / `infState.timer`，行为不变。

## 运行

模块 + importmap 的方式必须通过 HTTP 访问（`file://` 会被 CORS 拦）：

```bash
cd zhoutian-xingdou
python3 -m http.server 8080      # 或 npx serve .
# 浏览器打开 http://localhost:8080/
```

three.js 走 CDN（unpkg，见 `index.html` 的 importmap），需要联网。

## 调试

`index.html` 里有个小钩子：运行期报错会收集到 `window.__errs`，控制台敲 `__errs` 就能看。不需要可直接删。

## 交互

- 拖拽旋转 / 滚轮缩放 / 悬停星位看名字
- 点击阵面触发涟漪，另有「周天扫描」「三垣共鸣」「日月同辉」「星河倒灌」「神兽降临」等自动事件

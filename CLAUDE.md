# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指引。

## 项目概述

孤鱼GY 的个人主页 — 纯静态 HTML/CSS/JS，无框架、无构建工具。

> **优化提醒**：魔术数字集中管理在 `main.js` 开头的 `CONFIG` 对象中，修改参数前先检查。

## 文件结构

```text
index.html              — 入口（SEO、OG、JSON-LD、Twemoji）
css/style.css           — 全部样式（CSS 变量 + 响应式）
js/main.js              — 全局 rAF 调度、光粒子、飞鱼、音乐播放器、日夜切换
js/zodiac.js            — 星座运势、塔罗日历、星环日轨、星空 Canvas、烟花动效
generate_playlist.py    — 扫描 assets/music/ 生成 playlist.js
live2d/                 — 看板娘（autoload.js + SDK + 双模型）
assets/                 — 头像、favicon、Twemoji 库、字体、音乐
web.config              — IIS 缓存策略（分层缓存）+ 安全头 + 压缩
live2d/web.config       — 注册 .moc/.mtn MIME 映射
```

## 核心架构

### 全局 rAF 调度（`main.js` `_globalLoop`）

所有动画子系统通过 `window._registerTick` 注册到统一 `requestAnimationFrame` 循环，共享 `_pageVisible` 控制启停。注册者：光粒子、飞鱼、星空。

### 飞鱼自主飞行（`main.js` `initParallax`）

SVG 飞鱼（`#cursor-fish`）三种模式，位置通过 `transform: translate3d()` 驱动（Compositor-only）：

- **漫游**：从左向右正弦波起伏
- **追逐**：鼠标活跃时被光标吸引
- **受惊逃跑**：点击鱼附近则反向弹飞后恢复

关键：`transform-origin: 42.1% 51.6%`；瞳孔追踪低通滤波（30% 帧插值）。

### 音乐播放器（`main.js` `initMusic`）

四行卡片式 UI（曲名 → 控制 → 进度条 → 列表/模式/音量）。核心设计：

- 进度条/音量条通过 `createSlider` 工厂统一处理拖拽（`mousedown`/`touchstart`）
- 播放列表：事件委托 + DOM 缓存（首次渲染后仅更新高亮）
- 智能预加载：当前曲目缓冲充足后下载下一首
- 播放列表下拉动量滚动（参数见 `CONFIG.playlist`）
- 静音管理：`_isMuted` + `_volumeBeforeMute` 独立管理
- 键盘快捷键：空格播放/暂停、左右切歌、上下调音量（输入框中不触发）
- 音频错误计数：连续失败达阈值后停止

### 星座星空模块（`zodiac.js`）

页面布局：hero（100vh）→ 星座区域（全屏，Canvas 透明底与页面同色）→ 页脚。

启动顺序：`initFortune()` → `initStars()` → 按模式调 `initTarot`/`initOrbit` → `initScrollBehavior()`.

1. **运势**（`initFortune`）：API 查询今日/周/月/年运势。`AbortController` 竞态保护。移动端始终展开。

2. **白天模式：塔罗符卡 + 星丸日期**（`initTarot`）：上排 12 星座符卡（grid-6，毛玻璃），下排 31 星丸（flex-wrap）。选月触发 `syncDayDim` 超天数置灰。确认后结果展示，12s 复位。

3. **夜间模式：星环日轨**（`initOrbit`）：SVG 双环自转（CSS 变量 `--outer-rot`/`--inner-rot` 驱动）。点星 → 光束 → 涟漪 → 确认金色爆发。Canvas 3 级发光（`glowSmooth` 插值）。

4. **星空 Canvas**（`initStars`）：200 自由粒子（移动端 100），12 星座锚点。`_canvasVisible` 控制渲染启停——白天仅在有庆祝粒子时临时激活（仅渲染粒子）。手机端（≤768px）跳过星座节点/连线/光束，仅保留自由粒子、庆祝粒子、流星。流星仅在夜间生成。

5. **庆祝烟花**（`spawnCelebrate`）：60 金色粒子 + 350ms 后 35 次级火星，带重力/拖尾/闪烁。爆发源：夜间桌面 → 星座中心；手机夜间 → 星环中心；白天（桌面/手机）→ 确认按钮上方 30px。

## 移动端适配

断点：768px（Live2D 隐藏、云层视差跳过、飞鱼禁能、星环缩小、星空降级）、640px（播放器缩小）、480px（符卡 6→4 列）、400px（播放器再缩 + 音量条换行）。`@media (hover: none)` 清除触屏 hover 残留。

安全区域：`viewport-fit=cover`，`min-height: 100dvh`，`env(safe-area-inset-bottom)`。

## 重要注意事项

- **全局 rAF 禁止独立循环**：必须通过 `window._registerTick` 注册。
- **CONSTELLATIONS 与 ZODIAC 同序**：均为黄道顺序（白羊 0 → 双鱼 11），`findConstellationIndex` 按中文名映射。
- **结果面板 id 不同**：白天 `#orbit-result`（static），夜间 `#orbit-result-ring`（absolute）。
- **日期星丸 class**：选中 `active`，确认 `matched`，超月天数 `dimmed`。
- **确认按钮强制回流**：`display:none` 切换后需 `animation='none'` → `void offsetHeight` → `animation=''` 三段式确保 WebKit 重启动画。
- **确认按钮只绑定 `click`**：不绑 `touchend`，防移动端双重触发。
- **主题切换清理**：`_clearCanvasEffects` 清除庆祝粒子/光束/流星/连线状态。
- **星空颜色变量**：CSS 变量驱动，`lerpTheme` 插值渐变。
- **飞鱼 SVG**：默认朝左，`scaleX(-1)` = 朝右，`transform-origin: 42.1% 51.6%`。
- **CSS 兼容**：避免 `:has()`，`backdrop-filter` 有 `@supports` 降级。
- **Twemoji**：`.emoji` 类 `pointer-events: none`；动态 emoji 须手动 `twemoji.parse()`。
- **静音管理**：键盘调音量时同步处理 `_isMuted` 状态，防止标志位与实际音量脱节。
- **IIS**：`.moc`/`.mtn` 通过 `live2d/web.config` 注册 MIME；`web.config` 含分层缓存和安全头。

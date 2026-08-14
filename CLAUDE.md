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
web.config              — IIS 缓存策略 + 安全头 + 压缩；live2d/web.config 注册 .moc/.mtn MIME
```

## 核心架构

### 全局 rAF 调度（`main.js` `_globalLoop`）

所有动画子系统通过 `window._registerTick` 注册到统一 rAF 循环，共享 `_pageVisible` 控制启停。注册者：光粒子、飞鱼、星空。**禁止独立 rAF 循环**。

### 光粒子（`main.js` `initParticles`）

全屏发光粒子。性能：光晕初始化时预烘焙为离屏 sprite（`makeSprite`），运行时 `drawImage` + `globalAlpha` 闪烁，替代每帧 `shadowBlur`——视觉逐像素等价（fill α 与光晕 α×0.6 由 globalAlpha 统一缩放）。改绘制方式时须保持等价。

### 飞鱼自主飞行（`main.js` `initParallax`）

SVG 飞鱼三种模式（漫游/追逐光标/受惊逃跑），`transform: translate3d()` 驱动（Compositor-only）。关键：`transform-origin: 42.1% 51.6%`；瞳孔追踪低通滤波（30% 帧插值）。

### 音乐播放器（`main.js` `initMusic`）

四行卡片 UI（曲名 → 控制 → 进度条 → 列表/模式/音量）。核心设计：

- `createSlider` 工厂统一处理进度条/音量条拖拽
- 播放列表：事件委托 + DOM 缓存（首次渲染后仅更新高亮）；开关只由 ☰ 按钮控制
- 智能预加载下一首；音频错误达阈值停止
- 静音：`_isMuted` + `_volumeBeforeMute` 独立管理，静音态与恢复音量持久化（`gy_muted` + `gy_volume`），拖动音量条/键盘调音量均需同步 `_isMuted`
- 键盘快捷键：空格播放/暂停、左右切歌、上下调音量（INPUT/TEXTAREA 及 `role="slider"` 内不触发）
- 播放列表滚动陷阱见「重要注意事项」

### 星座星空模块（`zodiac.js`）

布局：hero（100vh）→ 星座区（Canvas 透明底与页面同色）→ 页脚。启动顺序：`initFortune` → `initStars` → 按模式调 `initTarot`/`initOrbit` → `initScrollBehavior`。

1. **运势**：API 查询今/周/月/年运势，`AbortController` 竞态保护，移动端始终展开。
2. **白天塔罗符卡 + 星丸**：12 符卡（grid-6，毛玻璃）+ 31 星丸。符卡符号与 `MONTH_TO_SIGNS` 对齐（每月取"该月起始星座"，如 1月=水瓶 ♒）。选月 `syncDayDim` 超天数置灰。确认后展示，12s 复位。
3. **夜间星环日轨**：SVG 双环自转（rAF 驱动 transform，Compositor-only），内圈日期节点复用 + 隐藏多余。点星 → 光束 → 涟漪 → 确认金色爆发 → 结果面板。Canvas 3 级发光（`glowSmooth` 插值）。重新选择时连线反向退场（`_glowDismiss`），500ms 后 DOM 复位。
4. **星空 Canvas**：200 粒子（移动端 100），`_canvasVisible` 控制启停（白天仅庆祝粒子时临时激活）；流星仅夜间生成。手机端跳过星座节点/连线/光束。性能：DPR 上限 2；`_sectionInView` 视口门控（section 滚出视口暂停绘制，庆祝粒子不受门控）。
5. **庆祝烟花**：60 + 35 粒子，带重力/拖尾/闪烁。爆发源：夜间桌面 → 星座中心；手机夜间 → 星环中心；白天 → 确认按钮上方 30px。

## 移动端适配

断点：768px（Live2D 隐藏、云层视差跳过、飞鱼禁能、星环缩小、星空降级）、640px（播放器缩小）、480px（符卡 6→4 列）、400px（播放器再缩 + 音量条换行）。安全区：`viewport-fit=cover`、`min-height: 100dvh`、`env(safe-area-inset-bottom)`。

## 重要注意事项

- **CONSTELLATIONS 与 ZODIAC 同序**：黄道顺序（白羊 0 → 双鱼 11），`findConstellationIndex` 按中文名映射。
- **结果面板 id 不同**：白天 `#orbit-result`（static），夜间 `#orbit-result-ring`（absolute）。
- **日期星丸 class**：选中 `active`，确认 `matched`，超月天数 `dimmed`。
- **确认按钮**：`display:none` 切换后需 `animation='none'` → `void offsetHeight` → `animation=''` 强制回流重启动画；只绑 `click`，防移动端双重触发。
- **主题切换清理**：`_clearCanvasEffects` 清庆祝粒子/光束/流星/连线状态及 `_glowDismiss`。
- **星空颜色**：CSS 变量驱动，`lerpTheme` 插值渐变。
- **CSS 兼容**：避免 `:has()`；`backdrop-filter` 有 `@supports` 降级。
- **Twemoji**：`.emoji` 类 `pointer-events: none`；动态 emoji 须手动 `twemoji.parse()`。
- **滚动浮现兜底**：`.reveal-up` 默认可见，仅当 `initScrollBehavior` 正常注册 IO 时才给 `<html>` 加 `js` 类隐藏（`html.js .reveal-up`）。保持"内容默认可见、JS 参与后才隐藏"的依赖方向，防止脚本异常时标题永久不可见。
- **播放列表移动端滚动**：`scrollToListIndex` 在触屏直接赋值 `scrollTop` 并 return，禁止 rAF 弹簧循环（否则持续写 scrollTop 会与原生触摸滚动打架，列表拖不动）。打开列表时移动端不做定位跳转；`openPlaylist` 必须先加 `.open` 再渲染——折叠态（max-height:0）写 scrollTop 在 iOS 会破坏原生滚动导致列表卡死。`createSlider` 须绑 `touchcancel` 复位 `dragging`，防系统取消触摸后 preventDefault 卡死整页滚动。

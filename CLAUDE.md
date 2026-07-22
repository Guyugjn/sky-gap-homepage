# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指引。

## 项目概述

孤鱼GY 的个人主页 — 纯静态 HTML/CSS/JS，无框架、无构建工具。

> **优化提醒**：魔术数字集中管理在 `main.js` 开头的 `CONFIG` 对象中（`CONFIG.fish`、`CONFIG.playlist`、`CONFIG.loadBar`、`CONFIG.particles`），修改参数前先检查 CONFIG。

## 文件结构

```text
index.html              — 结构（SEO、OG、JSON-LD、Twemoji 内联初始化）
css/style.css           — 全部样式（CSS 变量、动画、响应式、Live2D 覆盖）
js/main.js              — 全局 rAF 调度、光粒子、飞鱼飞行、音乐播放器、日夜切换、社交按钮、Toast、访客足迹、加载进度条
js/zodiac.js            — 星座数据、运势 API、白天塔罗日历、夜间星环日轨、星空 Canvas、烟花动效、滚动浮现
generate_playlist.py    — 扫描 assets/music/ 生成 playlist.js（自然排序 + 异常处理）
live2d/                 — 看板娘（autoload.js + SDK + 双模型 Pio/Izumi）
assets/                 — 头像、favicon、Twemoji 库、字体、音乐（mp3 不上传 git）
web.config              — IIS 缓存策略（分层缓存：HTML 不缓存、CSS/JS 1天、assets 30天）
live2d/web.config       — 注册 .moc/.mtn MIME 映射
```

## 核心架构

### 设备检测

模块级 `isTouchDevice`（`window.matchMedia('(pointer: coarse)')`）判断触屏设备，用于播放列表滚动方式选择。飞鱼交互用 `window.innerWidth <= 768`（`initParallax` 内局部变量）。

### 全局 rAF 调度（`main.js` `_globalLoop`）

所有动画子系统统一注册到一个 `requestAnimationFrame` 循环（`window._registerTick`），统一节拍、共享 `_pageVisible` 控制启停。注册者：光粒子、飞鱼、星空。

### 飞鱼自主飞行（`main.js` `initParallax`）

SVG 飞鱼（`#cursor-fish`）三种模式，位置和变换全部通过 `transform: translate3d()` 驱动（Compositor-only，不触发布局重排）：

- **漫游**：从左向右正弦波起伏（`attractBlend = 0`）
- **追逐**：鼠标活跃时 `attractBlend` 渐升至 1，鱼被光标吸引（死区 `CONFIG.fish.minCursorDist`）
- **受惊逃跑**：点击鱼附近 `CONFIG.fish.scareRange` → 反向弹飞（`CONFIG.fish.scareSpeed` px/帧）、`CONFIG.fish.scareDurationMin`~`+rand` 后恢复

关键：惯性速度 `fishVel`（`CONFIG.fish.inertIa` 插值）、朝向平滑 `fishFlipSmooth`、瞳孔追踪低通滤波（30% 帧插值 `_smoothX/_smoothY`，归中时重置）。`transform-origin: 42.1% 51.6%`。

### 音乐播放器（`main.js` `initMusic`）

四行卡片式 UI（曲名 → 控制按钮 → 进度条 → 列表/模式/音量）。核心变量：

- `playlist = window.__PLAYLIST__`
- `playMode`：0 列表循环 / 1 单曲循环 / 2 随机（默认）
- `playHistory`：随机模式历史栈（上限 100，超限自动 shift）
- `volume` 从 `localStorage.gy_volume` 读取，无则默认 0.20，修改时同步持久化。2 秒 easeOutCubic 淡入。
- `_isMuted` / `_volumeBeforeMute`：静音状态独立管理，消除滑块与静音按钮不同步。
- **键盘快捷键**：空格播放/暂停、左右切歌、上下调音量。

进度条/音量条通过 `createSlider(container, onChange)` 工厂统一处理拖拽（`mousedown`/`touchstart`）。播放列表下拉含动量滚动（滚轮推 `scrollVel`，EWMA 平滑滤波 `_wheelSmooth` + 单次增量上限 `MAX_SPEED_CHANGE=1.8`，惯性摩擦 `FRICTION=0.92`，弹簧定位 `SPRING_TENSION=0.20`，参数见 `CONFIG.playlist`）。智能预加载：当前曲目缓冲 >30s 或 >40% 后下载下一首。音频错误计数 `_audioErrorCount`：连续失败 `CONFIG.music.errorMaxCount` 次后停止并提示。成功播放时计数器归零。

播放列表使用 **事件委托**（`listInner` 上的 click/touch 委托）+ **DOM 缓存**（`_playlistRendered` 标志，首次渲染后仅更新高亮），降低监听器数量和 DOM 重建开销。

### 星座星空模块（`zodiac.js`）

页面布局：hero（100vh 居中）→ 星座区域（全屏，星空 Canvas 透明底，与全站纯色背景同色）→ 页脚。

子模块：

1. **运势**（`initFortune`）：API `v2.xxapi.cn/api/horoscope`，今日/周/月/年 Tab，`stripSource()` 过滤广告。卡片左右分栏（进度条 + 信息/概述 + 幸运宜忌）。移动端始终展开。**竞态保护**：`AbortController` 取消前次未完成请求，catch 区分 `AbortError` 不做 UI 操作。**无缓存**：每次切换星座或时间维度都发起新 API 请求。

2. **白天模式：塔罗牌卡 + 星丸日期**（`initTarot`）：上排 12 张星座符卡（grid-6，毛玻璃），下排 31 个圆形星丸（flex-wrap）。选月触发 `syncDayDim` 将超天数星丸置灰（`dimmed`），选日自动清空另一侧。确认后结果流式排列，12s 复位。`_tarotInited` 防重复，`window._resetTarot` 暴露。

3. **夜间模式：星环日轨**（`initOrbit`）：SVG 双环（外圈 12 月，内圈 28-31 日），星体径向渐变发光。内外圈持续自转，旋转由 CSS 变量 `--outer-rot`/`--inner-rot` 驱动（JS 只更新 CSS 变量值，不操作 DOM 属性）。点星涟漪 + 引导光束 + 中心脉冲 → 确认金色星屑爆发 + 金色涟漪。Canvas 3 级发光（`glowSmooth` 插值）。`_orbitInited` 防重复，`window._resetOrbit` 暴露。

4. **星空 Canvas**（`initStars`）：透明底，200 自由粒子（移动端 100）。12 星座锚点动态计算（桌面左右交错，移动端居中）。星座形状由 `CONSTELLATION_SHAPES` 提供（0~1 坐标）。平时星点与自由粒子同分布不可辨；确认后延迟 430ms 金色链式描画（含随机延迟 `Math.random() * 0.04` 增强手绘感）。`_canvasVisible` 控制 tick 启停：白天直接 return，不执行 update/draw；手机端（≤768px）跳过星座节点弹簧更新、连线描画、光束绘制，仅保留自由粒子、庆祝粒子和流星。流星调度含 `_canvasVisible` 检查，白天模式不生成。**性能**：发光效果用 `ctx.shadowBlur` 替代 `createRadialGradient` 以减少 GC 压力。主题切换时通过 `_clearCanvasEffects()` 清空残留庆祝粒子、光束、流星和连线状态。

5. **庆祝烟花**（`spawnCelebrate`）：从星座中心（桌面）或星环中心（手机夜间，星环隐藏时回退确认按钮）喷射 60 个金色粒子 + 350ms 后 35 个次级火星，带重力、拖尾、闪烁。

启动顺序：`initFortune()` → `initStars()` → 按模式调 `initTarot`/`initOrbit` → `initScrollBehavior()`。

## 其他子系统

- **光粒子**（`initParticles`）：55 个上升发光粒子（移动端 27），`ctx.shadowBlur` 发光 + 闪烁（`ctx.save/restore` 移至循环外减少操作次数）。
- **云层漂移 + 视差**：三层 CSS 漂移（58/45/35s，`will-change: transform` 优化渲染层）+ JS 鼠标微移（移动端跳过）。
- **日夜切换**（`initNightMode`）：19:00–06:00 自动，优先系统主题，手动覆盖。切换 `html.night-mode` class，同时调 `window._onThemeSwitch` 切换星环/塔罗显示（首次懒初始化，后续 reset）。切换时自动更新 `<meta name="theme-color">` 并清空 Canvas 残留粒子。
- **Toast 队列**：`showToast` 顺序播放。
- **加载进度条**：`window.onload` 至 100% 后移除。`CONFIG.loadBar.timeout`（8 秒）超时保险强制完成。
- **访客足迹**：localStorage 存储，UTC 日期比较（消除时区依赖），完整数据模型（`first`/`last`/`count`/`todayCount`/`streak`/`lastDate`），情感化文案池随机展示。

## 移动端适配

四断点：768px（Live2D 隐藏、云层视差跳过、飞鱼禁能、星环缩小、星空降级（星座节点/连线/光束全跳过）、烟花从星环中心爆发）、640px（播放器缩小）、480px（符卡 6→4 列、星丸缩小）、400px（播放器再缩、音量条换行）。另有 `@media (hover: none)` 全局清理触屏设备的 hover 假态残留。

安全区域：`viewport-fit=cover`，`min-height: 100dvh`，`env(safe-area-inset-bottom)`。

## 重要注意事项

- **全局 rAF 禁止独立循环**：必须通过 `window._registerTick` 注册。
- **CONSTELLATIONS 与 ZODIAC 同序**：均为黄道顺序（白羊 0 → 双鱼 11），`findConstellationIndex` 按中文名映射。
- **`orbitState.activeSignIndex`** 是 CONSTELLATIONS 索引，确认时用 `getZodiacSign` 权威查询再转换。
- **`_updateGlow`** 已共享化（全局函数，`CONSTELLATIONS` 定义后），白天/夜间/主题切换统一调用，无副本。
- **`fireStarBeam`** 定义在 IIFE 顶层（`initOrbit()` 外部），白天/夜间共享调用，指引光束从星环中心射向星座 Canvas。`fireBeam` 旧名已删除，统一使用 `fireStarBeam`。
- **结果面板 id 不同**：白天 `#orbit-result`（static），夜间 `#orbit-result-ring`（absolute）。
- **日期星丸 class**：选中用 `active`，确认后用 `matched`。`syncDayDim` 控制 `dimmed`，`today` 由底部小圆点标记。
- **确认按钮强制回流**：`tarot-confirm`/`orbit-confirm` 从 `display:none` 切换显示后，需 `animation = 'none'` → `void offsetHeight` → `animation = ''` 三段式强制回流，确保 WebKit 系浏览器重启动画。
- **确认按钮事件只绑定 `click`**：取消 `touchend` 监听，避免移动端 tap 模拟 click 导致双重触发。
- **星空手机端降级**：星座节点弹簧更新、连线描画状态、连线绘制、节点绘制、光束绘制均跳过，仅保留自由粒子、庆祝粒子、流星；烟花从星环中心爆发（夜间）或确认按钮（白天）。流星含 `_canvasVisible` 检查确保白天不生成。
- **星空颜色变量**：`--star-rgb` 等从 CSS 读取，日夜切换 `lerpTheme` 插值渐变。
- **主题切换清理**：`_clearCanvasEffects` 清理 celebrateParticles、starBeams、meteors、constellationLines.reveal、_revealHold。
- **Live2D 模型路径**：`file://` 走 CDN，HTTP 走本地。
- **IIS MIME**：`.moc`/`.mtn` 通过 `live2d/web.config` 注册（含 `<remove>` 确保幂等）。
- **IIS 缓存**：`web.config` 分层缓存策略（HTML 不缓存、CSS/JS 1天、assets 30天、音乐/Live2D 7天），开启 HTTP 压缩和安全头。
- **飞鱼 SVG**：默认朝左，`scaleX(-1)` = 朝右，`transform-origin: 42.1% 51.6%`。
- **Twemoji**：`.emoji` 类 `pointer-events: none`，动态 emoji 需手动 `twemoji.parse()`。脚本加载顺序：`twemoji.min.js` → `main.js` → `zodiac.js`（`defer` 链式保证执行顺序）。
- **CSS 兼容**：避免 `:has()`，`backdrop-filter` 有 `@supports` 降级。
- **运势始终展开**（≤768px）：所有子元素 `max-height: none !important; overflow: visible !important`，折叠箭头隐藏。
- **播放列表滚动**：EWMA 平滑 `_wheelSmooth`（α=0.55）+ 单次增量上限 `MAX_SPEED_CHANGE=1.8`，关闭时重置。桌面端绑定 `listInner` 上的 `wheel`，移动端走原生滚动。
- **播放列表 `margin`**：`margin: 0 -0.65rem`（无底部负值）。
- **社交按钮响应式**：`flex-wrap: wrap`，尺寸 `clamp(44px, 10vw, 48px)`。
- **音量条超小屏**：`order: 3; flex-basis: 100%` 换行独占。
- **静音管理**：`_isMuted` + `_volumeBeforeMute` 替代 `volumePrev`，消除滑块调整后静音恢复旧值 bug。
- **键盘快捷键**：空格播放/暂停、左右切歌、上下调音量，输入框中不触发。
- **空歌单保护**：`playNext`/`playPrev` 含 `totalTracks` 检查，列表渲染含空状态提示。

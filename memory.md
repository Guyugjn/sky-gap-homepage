# memory.md

本文件是 Roxy 在「孤鱼GY 个人主页」项目中的记忆库。每次在该仓库工作时先通读本文件，再动手改代码。

## 项目概述

孤鱼GY 的个人主页 — 纯静态 HTML/CSS/JS，无框架、无构建工具。

> **优化提醒**：魔术数字集中管理在 `main.js` 开头的 `CONFIG` 对象中，修改参数前先检查。

## 文件结构

```text
index.html              — 入口（SEO、OG、JSON-LD、Twemoji）
css/style.css           — 全部样式（CSS 变量 + 响应式）
js/main.js              — 全局 rAF 调度、光粒子、飞鱼、音乐播放器、日夜切换、访客统计
js/zodiac.js            — 星座运势、星轨生日选择器、星空 Canvas、烟花动效
js/settings.js          — 设置面板（gy_settings 存储、齿轮按钮、毛玻璃面板、主题/特效/音乐/看板娘）
generate_playlist.py    — 扫描 assets/music/ 生成 playlist.js（含 U+00A0 文件名警告）
release/                — 构建输出目录（部署打包用，git 不跟踪，勿删）
live2d/                 — 看板娘（autoload.js + SDK + 双模型）
assets/                 — 头像、apple-touch-icon、og-image、favicon、Twemoji 库、字体、音乐
web.config              — IIS 缓存策略 + 安全头（CSP/HSTS 已启用）+ 压缩；live2d/web.config 注册 .moc/.mtn MIME

## 字体（Ma Shan Zheng 马山正体）

- **unicode-range 分片方案**（2026 优化）：`assets/fonts/ma-shan-zheng.css` 引用 91 个分片（`assets/fonts/split/ma-shan-zheng-{N}-400-normal.woff2`，来自 @fontsource@5.2.9 的 400.css），浏览器按页面用到的汉字下载对应分片，不再加载 2.6MB 整包。
- **分片 119 是关键"常用字片"**：覆盖基本拉丁字母/数字/常用汉字（一/中/新/日等），默认必下载；其余分片按需。
- **latin 必备**：`ma-shan-zheng-latin-400-normal.woff2`（13KB）补齐基本拉丁区缺口（N、^、`、|、~ 等分片 119 未覆盖的码位），CSS 里 unicode-range 明确限定，勿删。
- **更新字体分片流程**：从 jsDelivr `@fontsource/ma-shan-zheng@5.2.9/400.css` 复制 unicode-range 块 → 下载对应 `files/ma-shan-zheng-{N}-400-normal.woff2` → 丢弃 woff 只留 woff2 → 更新本地 CSS。
- **index.html 无需 preload 字体文件**（分片后浏览器自动按需），只保留 CSS preload + avatar preload；API 域名 v2.xxapi.cn 有 `dns-prefetch`。
- **性能预算**：首屏约 22 分片 ~1.6MB（原整包 2.6MB），全站交互后约 44 分片 ~2.2MB。
```

## 核心架构

### 设置面板（`js/settings.js`）

统一设置入口——把社交栏原「日夜切换」按钮替换为齿轮设置按钮（`#settings-toggle`），点击弹出毛玻璃面板（`#settings-overlay`）。所有偏好持久化到单一键 `gy_settings`（JSON）：
`{ theme, effects:{particles,fish,clouds,starfield}, music:{mode}, live2d }`

- 跨模块接口（main.js/zodiac.js/autoload.js 各自暴露，settings.js 统一调度）：
  - `window.__gySettings.get()/save(patch)`：存储读写，`deepMerge` 深浅合并保证单键改动不丢其他键。
  - `window.__gyTheme.set(theme)`（'auto'/'day'/'night'）：驾 `_nightManual` + `applyNight` + 持久化；重置初始值也从设置读取。**社交栏不再有独立日夜按钮**。
  - `window.__gyFx`（`register(name,fn)` / `set(name,on)`）：视觉特效开关注册表。main.js 注册 particles/fish/clouds，zodiac.js 注册 starfield。
  - `window.__gyMusic`（`getMode/setMode/getVolume/setVolume`）：播放模式与音量，主播放器 modeBtn 切换也持久化到 `gy_settings.music.mode`；音量仍走现有 `gy_volume`/`gy_muted` 存储（不迁移）。设置面板音量条**复用 main.js 的 `createSlider` 工厂**（暴露为 `window.__gyCreateSlider`），与音乐播放器音量条同款拖拽/键盘逻辑 + `.volume-bar-wrap/.volume-fill/.volume-pct` 样式。
  - `window.__gyWaifu`（`set(on)/getLoaded()`）：控制 live2d-widget 根容器 `#waifu` 显隐；`initLive2D` 读取 `gy_settings.live2d`，为 false 时跳过加载（省 ~2.6MB）。

### 全局 rAF 调度（`main.js` `_globalLoop`）

所有动画子系统通过 `window._registerTick` 注册到统一 rAF 循环，共享 `_pageVisible` 控制启停。注册者：光粒子、飞鱼、星空。**禁止独立 rAF 循环**。

### 光粒子（`main.js` `initParticles`）

全屏发光粒子。性能：光晕初始化时预烘焙为离屏 sprite（`makeSprite`），运行时 `drawImage` + `globalAlpha` 闪烁，替代每帧 `shadowBlur`——视觉逐像素等价（fill α 与光晕 α×0.6 由 globalAlpha 统一缩放）。改绘制方式时须保持等价。

### 飞鱼自主飞行（`main.js` `initParallax`）

SVG 飞鱼三种模式（漫游/追逐光标/受惊逃跑），`transform: translate3d()` 驱动（Compositor-only）。关键：`transform-origin: 42.1% 51.6%`；瞳孔追踪低通滤波（30% 帧插值）。

### 音乐播放器（`main.js` `initMusic`）

四行卡片 UI（曲名 → 控制 → 进度条 → 列表/模式/音量）。核心设计：

- `createSlider(container, onChange, onKey)` 工厂统一处理进度条/音量条拖拽；**第三参数 onKey 为键盘回调**（进度条 ±seekStep/±seekStepFast/Home/End 改 `audio.currentTime`，timeupdate 回写 UI；音量条复用 `adjustVolume`，自然带静音解除/持久化）
- 播放列表：事件委托 + DOM 缓存（首次渲染后仅更新高亮）；开关只由 ☰ 按钮控制
- 智能预加载下一首；音频错误达阈值停止
- 静音：`_isMuted` + `_volumeBeforeMute` 独立管理，静音态与恢复音量持久化（`gy_muted` + `gy_volume`），拖动音量条/键盘调音量均需同步 `_isMuted`
- 键盘快捷键：空格播放/暂停、左右切歌、上下调音量（INPUT/TEXTAREA 及 `role="slider"` 内不触发——滑块自己的方向键由 createSlider 的 onKey 处理，二者不冲突）
- 播放列表滚动陷阱见「重要注意事项」
- **曲名是原生 `<button>`**（`#music-label`，可点击复制），CSS 里有 button 样式重置，勿改回 span

### 星座星空模块（`zodiac.js`）

布局：hero（100vh）→ 星座区（Canvas 透明底与页面同色）→ 页脚。启动顺序：`initFortune` → `initStars`（先于星轨，CONSTELLATIONS 供查询）→ `initStarTrail` → 注册 `window._onThemeSwitch` → `initScrollBehavior`。

1. **运势**：API 查询今/周/月/年运势，`AbortController` 竞态保护，移动端始终展开。
2. **星轨滑星（生日选择器，`initStarTrail`）**：双弧同心滑轨——**内弧月（12 节点，半径 150）+ 外弧日（星点，半径 235）**，viewBox 640×344，弧心 (320,330)。**默认选中 1 月**（`_selMonth = 1`：金色星核 + 月份高亮初始落位 1 月节点，日期弧显示 1 月，hint「1月 · 沿外弧滑选日期」；resetState 同样回 1 月）。**每轨一条透明命中带 `.trail-arc-hit`**（stroke 44 宽、touch-action:none、pointer-events:stroke，顶层独立存在，不随 dayArc 重建）；`pointerdown` 命中哪条轨就锁定 `_dragArc` 直到松手（维度绝不误判），桌面/手机统一：按下即选 + 滑动连续选取（`_pending` rAF 合并调度）。轨道带外：容器 `touch-action: pan-y`，触摸滚动页面；旧版 Safari（SVG 子元素 touch-action 不生效）兜底 = `touchstart` 里 `isNearArc`（±24 几何判定）才 `preventDefault`。**换月日期弧三态**（`updateMonth(m, mode)`：'start'/'move'，配合 `buildDayArc(animate)`）：**按下即选（'start'）→ 日期数字立即显示无动画**（`buildDayArc(false)`，月节点弹跳）；**滑动跟随（'move'）→ 日期弧保持不动（`_dayArcDirty` 推迟重建）避免快速切换闪烁，月节点不弹**；**松手（`endDrag`）→ 先应用 `_pending` 残留落点，再统一重建** `buildDayArc(true)`——**日期数字从弧线上沿径向依次升起**（`trail-label-rise`：起点 = 弧线位置（JS 设 `--rise-x/y` 径向偏移），飘出到弧外 18 单位标签位 + 淡入缩放，animation-delay 递增）+ 星点同样亮起。**弧线 `.trail-day-line` 无动画直接显示**；`buildDayArc` 防抖：距上次**动画**重建 <350ms 降级为即时（按下时的无动画重建不占防抖窗口，`_lastAnim` 只记录动画重建）。选中日 → 金环涟漪 `.trail-ring`（animationend 自清理）+ 星座图标 `.tarot-oracle.pop` 重放；**选中月节点同样金环涟漪**（`spawnRing(x,y,parent)` 通用函数，父分组 = dayArc/monthArc）；星核 `setCoreTo` 用 CSS transform（`.trail-core-group` transition，`.dragging` 禁用）。**视觉契约**：日弧为**一条完整 2.5px 纯色细线**（`.trail-day-line`，stroke: var(--accent)，**无渐变、不随星座分段**——分段色在浅底上对比度不足会断块）；**外弧弧线外侧 18 单位处为日期数字** `.trail-day-label`（全部常显 opacity .6、**无出现动画**（换月随重建直接显示），选中日 `.active` 金色加粗）；内弧引导线 `.trail-month-guide`（单色蓝）；**无弧上宫符标签**（星座图标只在确认按钮上方 `#tarot-oracle` 出现）；日期星点默认稀疏（`updateStarVisibility(0)`：仅 1/每 5 天/月末），选中/滑动时以当日为中心 ±2 天浮现（`STAR_VISIBLE_RADIUS`/`STAR_KEY_STEP`），其余 `.faint`(opacity .12)。**无自动复位**——仅「重新选择」按钮/日夜切换调 `resetState()`。**换月即取消选日**：`_selDay`/`orbitState.day`/`activeSignIndex` 清零 + `_updateGlow(-1, 0)`（防止上次选中星座的发光残留）；星核初始落位在 `svg.appendChild(frag)` **之前**执行（首渲染无过渡，避免从 SVG 原点 (0,0) 飞入 1 月的问题）。
3. **星空 Canvas**：200 粒子（移动端 100），`_canvasVisible` 控制启停（白天仅庆祝粒子时临时激活）；流星仅夜间生成。手机端跳过星座节点/连线/光束。性能：DPR 上限 2；`_sectionInView` 视口门控（section 滚出视口暂停绘制，庆祝粒子不受门控）。
4. **庆祝烟花**：60 + 35 粒子，带重力/拖尾/闪烁。爆发源：夜间桌面 → 星座中心；**触屏设备（`isTouchCoarse`，含横屏手机 >768px）→ 星核（当前选中位置）→ 星轨中心 → 按钮回退**；白天桌面 → 确认按钮上方 30px。**注意**：`isMobileViewport`（≤768px）在横屏手机/大屏触屏上为 false，烟花判定必须用 `isTouchCoarse`（宽度 OR pointer:coarse），否则触屏会走桌面分支炸在按钮上。
5. **引导光束** `spawnStarBeam`：**从「确认选择」按钮中心射向对应星座**（仅夜间桌面，`_canvasVisible` 门控）。触发：鼠标 hover 确认按钮（或键盘 focus）时生成，**离开按钮即清空**（`window._clearStarBeam`）；确认点击时金色光束（`doConfirm` 先射后隐藏按钮，rect 仍有效）。**替换式**——生成时 `starBeams.length = 0`，任何时刻最多一条（hover 中滑动选日光束实时追赶当前星座）。选中日期不再自动发射。移动端不生成（无 hover 且 `isMobileViewport` 门控）。
5. **日期弧天数**：`_selDays()` 对 2 月动态判断闰年（闰年 29 天，可选中 2/29），勿改回固定平年表。

## 移动端适配

断点：768px（Live2D 隐藏、云层视差跳过、飞鱼禁能、星轨视觉降级、星空降级）、640px（播放器缩小）、480px（星轨细线加粗/标签缩小）、400px（播放器再缩 + 音量条换行）。安全区：`viewport-fit=cover`、`min-height: 100dvh`、`env(safe-area-inset-bottom)`。

## 重要注意事项

- **CONSTELLATIONS 与 ZODIAC 同序**：黄道顺序（白羊 0 → 双鱼 11），`findConstellationIndex` 按中文名映射。
- **结果面板**：只有 `#orbit-result`（白天/夜间共用），位于 `.tarot-actions` 固定高度容器内，确认/复位切换不抖。
- **确认按钮**：`display:none` 切换后需 `animation='none'` → `void offsetHeight` → `animation=''` 强制回流重启动画；只绑 `click`，防移动端双重触发。
- **确认/重新选择按钮视觉统一**：`.tarot-confirm` 与 `.orbit-redo` 完全同款（金色渐变底 + `#B87A20` 文字 + 暖金边框 + 22px 圆角 + blur 毛玻璃；夜间同为深蓝渐变 + `#E8C268` 亮金文字），`@media (hover:none)` 里的 redo 覆写保持同一配色。改其中一个的样式时另一个必须同步，包括移动端 hover 清理覆写。
- **主题切换清理**：`_clearCanvasEffects` 清庆祝粒子/光束/流星/连线状态及 `_glowDismiss`。
- **星空颜色**：CSS 变量驱动，`lerpTheme` 插值渐变。
- **CSS 兼容**：避免 `:has()`；`backdrop-filter` 有 `@supports` 降级。
- **Twemoji**：`.emoji` 类 `pointer-events: none`；动态 emoji 须手动 `twemoji.parse()`。
- **滚动浮现兜底**：`.reveal-up` 默认可见，仅当 `initScrollBehavior` 正常注册 IO 时才给 `<html>` 加 `js` 类隐藏（`html.js .reveal-up`）。保持"内容默认可见、JS 参与后才隐藏"的依赖方向，防止脚本异常时标题永久不可见。
- **播放列表移动端滚动**：`scrollToListIndex` 在触屏直接赋值 `scrollTop` 并 return，禁止 rAF 弹簧循环（否则持续写 scrollTop 会与原生触摸滚动打架，列表拖不动）。打开列表时移动端不做定位跳转；`openPlaylist` 必须先加 `.open` 再渲染——折叠态（max-height:0）写 scrollTop 在 iOS 会破坏原生滚动导致列表卡死。`createSlider` 须绑 `touchcancel` 复位 `dragging`，防系统取消触摸后 preventDefault 卡死整页滚动。
- **访客统计（`initVisitor`）按本地时区换日**：日期键 = `YYYYMMDD` 整数（`getLocalDayKey`），**禁用 UTC 换日**——UTC+8 用户 00:00–07:59 的访问会被归到前一天。
- **光粒子 DPR 上限 2**：`initParticles` 与星空 Canvas 一致，`Math.min(dpr, 2)`。
- **手动日夜模式可恢复**：`_nightManual` 为 true 时再次点击按钮恢复自动；按钮 title/aria-label 由 `updateHead()` 同步（"已手动切换 · 点击恢复自动"）。
- **运势 Tab 用 aria-pressed**：`initFortune` / `setFortuneSign` 两处切换时同步（for 循环遍历，勿用 NodeList.forEach——兼容旧浏览器）。
- **mp3 文件名不得含 U+00A0**：`generate_playlist.py` 会警告非断行空格文件；新增曲目先检查。
- **web.config 已启用 CSP**：允许内联脚本/样式 + jsdelivr + v2.xxapi.cn；**不得添加 upgrade-insecure-requests**（源站服务在 HTTP 上，会强制升级子资源导致页面损坏）。HSTS 头仅未来 HTTPS 回源时生效。
- **设置脚本顺序**：`js/settings.js` 必须置于 `main.js` 之前（defer 按序执行），各模块 init 才能读到 `__gySettings` 默认值；面板打开（用户点击）晚于所有 init，可安全调用各 setter。
- **settings.js 时序坑**：defer 脚本执行时 `document.readyState` 已是 `'interactive'`（非 `'loading'`），`settings.js` 的 `initSettings()` 会**立即执行**、早于 `main.js` 的 `init()`。凡在 initSettings 里**立即用到 `window.__gyCreateSlider/__gyMusic/__gyFx/__gyWaifu/__gyTheme` 的绑定必须「在用户交互/首次打开面板时」懒绑定**（如音量条 `bindVolumeSlider()`），否则工厂未定义、绑定被跳过；事件回调（click/change）因执行晚不受影响。
- **星空特效开关**：`_fxStarfield` 与 `_canvasVisible`（夜间才显示）做「与」运算；关闭星空会连流星/引导光束/庆祝粒子一并清空，但保留星座选择器与运势功能。
- **看不到活看板娘开/关**：`__gyWaifu.set(true)` 时若 `getLoaded()` 为 false（初始被跳过）需提示刷新生效；live2d-widget 重复 init 有竞态风险，不强行二次初始化。
- **看板娘气泡本地定制（更新 live2d-widget 时须保留）**：
  - `live2d/waifu.css` → `#waifu-tips`：加 `z-index:10` + `bottom:calc(100% - 6px); left:0; right:0; margin:0 auto`，让气泡悬浮在人物头顶正上方、不被 Live2D 人物遮挡。
  - `live2d/waifu-tips.js` → mouseover 委托里注入 `window._waifuLastTip` 500ms 防抖（`if(window._waifuLastTip&&(performance.now()-window._waifuLastTip)<500)return`），避免快速扫过不同 selector 时气泡内容乱跳。此文件是压缩三方库，改动最小化且已备份（`%TEMP%\waifu-tips.backup.js`）。
  - `live2d/autoload.js` → `initLive2D()` 内注册 **window 捕获阶段 mouseover 节流**（`_waifuMouseThrottle`，500ms，`e.stopImmediatePropagation()` 吞掉命中 selector 的快速连续 hover）：**这是 `file://` 下的兜底**——该协议下 waifu-tips.js 因 ES module CORS 回退 CDN，本地注入的防抖不生效，必须靠 autoload.js 的捕获拦截（两种协议都加载）。改节流窗口时两处须同步。

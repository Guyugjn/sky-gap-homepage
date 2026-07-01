# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指引。

## 项目概述

孤鱼GY 的个人主页 — 纯静态站点，无框架、无构建工具。浏览器直接打开 `index.html` 即可运行。

## 文件结构

```
index.html              — 结构（~234行）
css/style.css           — 样式（~918行）
js/main.js              — 逻辑（~750行），IIFE 包裹，'use strict'
generate_playlist.py    — 扫描 assets/music/ 生成 playlist.js
assets/
  avatar.jpg            — 头像
  favicon.svg           — 标签页图标（淡蓝圆底 + 小鱼）
  music/                — mp3 文件 + playlist.js，mp3 不上传 git
```

## 关键架构

### 飞鱼自主飞行系统（main.js `initParallax`）

飞鱼替换了原来的鼠标柔光跟随，是项目最复杂的子系统。

**飞行模式**：
- **漫游**：从左向右正弦波起伏飞行，始终朝右。无鼠标活动时纯漫游。
- **追逐**：鼠标移动后 `attractBlend` 从 0 渐变为 1，鱼被光标吸引。
- **失去兴趣**：鼠标静止 4 秒后 `attractBlend` 从 1 渐变为 0，1.5 秒内完全回到漫游。
- **受惊逃跑**：点击鱼附近（100px 内）→ 立刻反向弹飞，`attractBlend` 直接归零纯漫游，`fishFlipSmooth` 瞬间翻转朝远离方向，3~5 秒后恢复。

**死区机制**：距光标 62-78px 为死区（`MIN_CURSOR_DIST=70, margin=8`）。>78px 靠近，<62px 后退，死区内吸引方向为零。

**惯性系统**：`fishVelX/Y` 存储当前速度，`targetVel` 从混合方向计算。`fishVel += (targetVel - fishVel) * 0.08` 平滑趋近，产生自然的过冲和弧线迂回。

**速度缩放**：距光标 >300px 时 1.5 倍速追赶，70-300px 线性过渡，仅在追逐模式下生效。

**朝向与渲染**：
- `fishFlipTarget`：`faceDirX >= 0 ? -1 : 1`（-1=朝右 via `scaleX(-1)`，1=朝左）
- `fishFlipSmooth`：0.08 插值避免翻转突变
- 旋转角：`-atan2(faceDirY, |faceDirX|)`（`rotate(正)`=顺时针=头向上，故取反保证光标在下时头向下），永远在 ±90° 内，眼睛在上
- `transform: translate(-42.1%, -51.6%) scaleX(fishFlipSmooth) rotate(fishAngle)`
- `transform-origin: 42.1% 51.6%` 对齐鱼身体心，防止旋转偏移

**瞳孔追踪**：追逐时瞳孔在眼窝内偏移追踪光标（±35° 范围），`fishFlipSmooth` 补偿 `scaleX` 水平反转。漫游时瞳孔归中。

**边界处理**：右边界外 +80px 后瞬移到左边界外 -80px，随机 Y；上下边界钳制 50px。

**受惊状态**：
- `scaredUntil` 时间戳，点击涟漪距鱼 <100px 时设为 `now + 3000~5000ms`
- 受惊期间 `attractBlend` 直接归零、`fishFlipSmooth = fishFlipTarget` 瞬间翻转
- `.click-ripple`：80px 淡蓝光晕圆环，`@keyframes ripple-expand` 0.2→3x 缩放 + 渐隐

**关键变量**：
- `FISH_SPEED = 2.5`（px/帧）、`IDLE_TIMEOUT = 4000`（ms）、`MIN_CURSOR_DIST = 70`（px）
- `INERTIA = 0.08`、速度缩放范围 `1.0x ~ 1.5x`（300px 满速）
- `FISH_SCARE_RANGE = 100`、弹飞速度 `22`（px/帧）

### 云层漂移（纯 CSS）

- `.cloud-drift` 应用 `@keyframes cloud-drift`（`translateX` 从左到右），远/中/近三层各 58/45/35 秒周期。
- `.cloud` 本体由多个 `<span>` 椭圆拼成蓬松形状，`filter: blur(6px)`。
- **云层不再跟随鼠标**（早期版本的 JS 视差已移除）。`data-speed` 属性和 `.cloud` 上的 `will-change: transform` 为历史遗留，无功能影响。

### CSS 与 JS 的交互约定

- **唱片旋转**：`.vinyl-wrap.spinning .vinyl-disc` 触发 `animation-play-state: running`。JS 通过 `vinylWrap.classList.add/remove('spinning')` 控制。
- **播放图标切换**：CSS 规则 `#music-icon-play` / `#music-icon-pause` 的 `display` 切换，纯 CSS 通过 `.music-btn.playing` 控制。
- **模式图标**：三个 SVG path 定义在 `main.js` 的 `modeIcons` 对象中，标准 Material Design 路径。点击时更新 path 的 `d` 属性和 CSS 类。
- **进度条显隐**：`width: 0; opacity: 0; overflow: hidden` → `.visible` 类展开为 `width: 190px; opacity: 1`，JS `progressWrap.classList.add/remove('visible')` 控制。
- **音量条显隐**：同进度条模式，但由 CSS `:hover` 触发而非 JS 类。
- **曲名气泡显隐**：CSS 默认 `display: none`，JS `updateLabel()` 中设置 `display: block` 在首次播放时显示。
- **飘散音符**：`.float-note` 三个 span，`.vinyl-wrap.spinning` 时触发 `@keyframes float-note-up` 从唱片飘出。
- **毛玻璃提示气泡**：`.tip-wrap` / `.mode-wrap` 包裹触发元素 + `.social-tip` / `.mode-tip` span，CSS `:hover` 通过 `opacity` 过渡显示。
- **点击涟漪**：`document` click 时 JS 动态创建 `<div class="click-ripple">`，CSS `@keyframes ripple-expand` 控制缩放+渐隐，动画结束后 JS 移除元素。鱼在范围内则触发受惊逃跑。

### 音乐播放器核心变量（main.js）
- `playlist` — 从 `window.__PLAYLIST__` 读取（由 `<script src="assets/music/playlist.js">` 注入），文件名数组
- `getDisplayName(index)` — 从文件名去掉 `.mp3` 后缀作为曲名
- `playMode` — 0=列表循环, 1=单曲循环, 2=随机（默认值 2）
- `volume` — 初始 0.05（5%），通过 `CONFIG.music.startVolume` 配置
- `fadeAnimId` — 当前淡入/淡出动画 ID，快速切歌时取消旧动画
- `started` — 是否已完成首次加载，控制 prev/next/vinyl 点击是否生效

### 共享函数（IIFE 顶层）
- `showToast(msg, duration)` — 右下角毛玻璃提示，自动管理定时器
- `copyText(text, onSuccess)` — 剪贴板复制（优先 `navigator.clipboard.writeText`，降级 `execCommand`）

### 播放列表加载机制
- `generate_playlist.py` 扫描 `assets/music/` 下所有 `.mp3`，生成 `playlist.js`
- `playlist.js` 设置 `window.__PLAYLIST__ = ["曲名.mp3", ...]`
- `index.html` 中 `<script src="assets/music/playlist.js">` 在 `main.js` 之前加载
- 使用 `<script>` 标签而非 `fetch`，避免 `file://` 协议下浏览器拦截本地文件请求

## 开发方式

```bash
# 无构建步骤，直接编辑文件后在浏览器打开
start index.html

# 添加/删除/改名歌曲后
python generate_playlist.py
```

## 已知注意事项

- **音乐文件名**：支持 Unicode 文件名（通过 `encodeURIComponent` 编码），建议避免 URL 保留字符 `#?&`。
- **playlist.js**：由 `generate_playlist.py` 生成，`.gitignore` 例外追踪（`!assets/music/playlist.js`），mp3 本身不上传。
- **CSS 变量**：色调统一在 `:root` 中定义（`--sky-top`, `--text-primary`, `--accent` 等），全局使用。
- **Windows 8 兼容**：需避免使用 `:has()` 等较新的 CSS 选择器。
- **默认随机播放**：`playMode = 2`，首次点击播放随机选曲。
- **无自动播放**：浏览器自动播放策略限制，必须用户点击播放按钮。
- **飞鱼 SVG 向**：鱼默认面朝**左**（SVG viewBox 中尾在右、眼在左），`scaleX(-1)` 翻转为朝右。
- **飞鱼 `transform-origin`**：设为鱼身体心（42.1%, 51.6%），修改 SVG 尺寸/形状后需重新计算此值，否则旋转会偏移。

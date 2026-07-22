# 天空之隙

> 谢谢你，游到这里。

**在线访问：[www.080322.xyz](https://www.080322.xyz)**

孤鱼GY 的个人主页。清晨天空纯色背景下，一只飞鱼穿梭于云层与星辰之间。纯 HTML/CSS/JS，零框架、零构建。

> 🔧 配置参数集中在 `js/main.js` 的 `CONFIG` 对象中（飞鱼物理、播放列表滚动、粒子数量等），修改前先查 CONFIG。

---

## ✨ 亮点

- **飞鱼自主飞行** — SVG 飞鱼自由游动：正弦波漫游 → 鼠标吸引追逐 → 点击惊吓逃跑。瞳孔追踪光标（低通滤波平滑），`translate3d` Compositor-only 渲染。
- **日夜双模星座查询** — 白天用塔罗牌卡日历（毛玻璃方块 + 湖蓝选中），夜间用旋转星环日轨（双环持续自转，点星选月日）。确认后光束射向星图、星座连线金色逐笔浮现。
- **昼夜双风格运势卡片** — 白天毛玻璃白底，夜间深蓝底。进度条（综合/爱情/工作/财富/健康）+ 概述/幸运/宜忌，详细运势可折叠。
- **藏星于野的星图** — 12 黄道星座藏在繁星中，确认后金线一笔一笔勾勒，庆祝粒子弧线爆发。
- **Live2D 看板娘** — Pio / Izumi 双模型，120+ 条对话，延迟初始化，移动端隐藏。
- **音乐播放器** — 自定义拖拽进度条/音量条，三种循环模式，智能预加载，淡入切歌。播放列表动量滚动。

## 🎯 功能一览

### 视觉

- 全站纯色背景（白天浅蓝 / 夜间深蓝），日夜切换整体色调 + `theme-color` 自动更新
- 光粒子上升（55 个发光粒子，移动端 27，`shadowBlur` 渲染降 GC）
- 星空 Canvas（200 自由粒子 + 12 星座星图 + 偶发流星，星座节点 `shadowBlur` 发光）
- 三层云朵 CSS 漂移（`will-change: transform` 优化渲染层）+ JS 鼠标视差
- 滚动驱动的卡片浮现（IntersectionObserver，d0~d6 交错延迟）

### 交互

- 日夜模式自动切换（19:00–06:00）+ 手动覆盖，切换时平滑过渡
- 星座查询：白天选月份卡片 + 点日期星丸；夜间点自转星环选月日。确认后切换运势
- 每日/本周/本月/年度运势（xxapi.cn API，`AbortController` 竞态保护 + 1 天缓存）
- 社交链接：GitHub、Bilibili、邮箱复制 + Toast 提示
- 访客足迹：页脚显示"第 N 次相遇 · 第 M 天"（localStorage，隔天计次）
- 12s 无操作自动复位

### 技术

- **配置集中管理**: 飞鱼物理参数、播放列表滚动、加载条超时等全部集中于 `CONFIG` 对象
- **Compositor 优先**: 飞鱼 `translate3d` 渲染、CSS 变量驱动星环旋转，避免 DOM 属性操作和布局重排
- **GC 友好**: 星空节点发光和光粒子使用 `ctx.shadowBlur` 替代 `createRadialGradient`，减少每帧对象创建
- **Twemoji v17.0.3** 跨平台 emoji 渲染（`defer` 链式加载：twemoji → main → zodiac）
- **四断点响应式**（768/640/480/400px）+ `@media (hover: none)` 全局清除移动端 hover 假态
- **全局统一 rAF 调度**（切标签页整体暂停，节省 GPU）
- 脚本全部 `defer`，Live2D `requestIdleCallback` 延迟初始化
- 页面加载进度条（DOM 就绪加速，load 事件完成，8 秒超时保险）

## 🚀 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器直接打开 `index.html`，无需构建。

> IIS 部署注意：`live2d/web.config` 注册 `.moc`/`.mtn` MIME 类型，根目录 `web.config` 设置静态资源缓存策略。

### 音乐管理

```bash
python generate_playlist.py   # 将 mp3 放入 assets/music/ 后运行
```

## 📁 项目结构

```text
index.html            — 页面结构（SEO、OG、Twemoji）
css/style.css         — 全局样式、CSS 变量、动画、响应式
js/main.js            — rAF 调度、飞鱼、音乐播放器、日夜切换、社交、Toast
js/zodiac.js          — 星座数据、运势、塔罗日历、星环日轨、星空 Canvas
live2d/               — 看板娘（autoload.js + SDK + 双模型 Pio/Izumi）
assets/               — 头像、favicon、Twemoji、字体、音乐
generate_playlist.py  — 生成播放列表
web.config            — IIS 缓存策略
```

## 🎨 设计系统

- **背景**: 全站单一纯色 `var(--sky-mid)` — 白天 `#B0D2E7` / 夜间 `#132744`
- **交互色**: 湖蓝 `#89C4E1`，暖金 `#E8B860` 贯穿全站
- **毛玻璃**: `rgba(255,255,255,0.4)` + `backdrop-filter: blur(6px)` + 蓝白内发光
- **动效**: Playful 弹性回弹 `--ease-playful`，四级时长 80/150/300/500ms
- **字体**: 马山正体（星座标题）+ 系统字体栈（正文）
- **星座符号**: 淡紫 `#8E7CC3`，选中转为白色

## 📄 协议

本项目代码以 MIT License 发布。

Live2D 看板娘基于 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（GPL-3.0），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

---

*由 Claude Code + DeepSeek AI 辅助设计*
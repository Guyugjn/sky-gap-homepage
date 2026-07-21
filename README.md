# 天空之隙

> 谢谢你，游到这里。

**在线访问：[www.080322.xyz](https://www.080322.xyz)**

孤鱼GY 的个人主页。清晨天空纯色背景下，一只飞鱼穿梭于云层与星辰之间。纯 HTML/CSS/JS，零框架、零构建。

---

## ✨ 亮点

- **飞鱼自主飞行** — SVG 飞鱼在页面自由游动：正弦波漫游 → 鼠标吸引追逐 → 点击惊吓逃跑。瞳孔追踪光标，惯性系统带来自然的弧线迂回。
- **日夜双模星座查询** — 白天用塔罗牌卡日历（淡紫色星座符号 + 毛玻璃方块 + 湖蓝选中态），夜间用旋转星环日轨（双环星盘持续自转，点星选月日）。选齐后光束射向星图、星座连线金色逐笔浮现。日夜切换无重复绑定，首次切换目标模式懒初始化。
- **昼夜双风格运势卡片** — 白天毛玻璃白底 + 湖蓝语义色，夜间深蓝渐变底。左侧进度条（综合/爱情/工作/财富/健康）+ 下方星座信息，右侧概述/幸运信息/宜忌。详细运势可折叠。
- **藏星于野的星图** — 12 黄道星座按经典星图画法藏在繁星里，平时不可辨；确认后金线一笔一笔勾勒浮现，庆祝粒子弧线爆发。
- **Live2D 看板娘** — Pio / Izumi 双模型，120+ 条对话与页面联动，延迟初始化不抢首屏，移动端隐藏。
- **音乐播放器** — 自定义拖拽进度条/音量条（`createSlider` 工厂函数统一管理），三种循环模式，智能预加载，淡入切歌。播放列表动量滚动。

## 🎯 功能一览

### 视觉

- 全站纯色背景（白天浅蓝 / 夜间深蓝），切换时全页颜色 2s 整体渐变，载入直接到位不闪
- "清晨天空"浅色毛玻璃质感：所有卡片/方块 `bg-white/40` + `backdrop-filter: blur(6px)` + 蓝白内发光，16px 圆角
- 光粒子上升系统（55 个径向渐变发光粒子，移动端 27）
- 星空 Canvas（200 自由粒子 + 12 黄道星座经典星图 + 偶发流星）
- 白天模式：12 张星座符卡（grid-cols-6，淡紫 emoji + "X月"）+ 7 列日历网格（星期与日期同列宽对齐，今日边框加粗）
- 夜间模式：SVG 星环双环自转，径向渐变发光星体、呼吸闪烁、选中四芒星光、轨道碎屑漂移
- 三层云朵 CSS 漂移 + JS 鼠标视差
- 滚动驱动的卡片浮现（IntersectionObserver，d0\~d6 交错延迟）

### 交互

- 日夜模式自动切换（19:00–06:00）+ 手动覆盖
- 星座查询：白天选月份卡片 + 点日历日期；夜间点自转星环选月份+日期。选齐射出引导光束，确认后星座连线浮现并自动切换运势
- 每日/本周/本月/年度运势（xxapi.cn API）
- 社交链接：GitHub、Bilibili、邮箱复制 + Toast 提示
- 访客足迹：页脚显示"第 N 次相遇 · 第 M 天"（localStorage，隔天计次）
- 确认结果常驻，12s 无操作自动复位

### 技术

- Twemoji v17.0.3 跨平台 emoji 统一渲染（CDN 优先 + 本地降级）
- 四断点响应式（768/640/480/400px）
- 全局统一 rAF 调度（所有动画共用一个循环，切标签页整体暂停，白天模式跳过星空 Canvas 绘制节省 GPU）
- 脚本全部 `defer` 并行加载，Live2D `requestIdleCallback` 延迟初始化
- 页面加载进度条（顶部渐变色，DOM 就绪后加速，load 事件完成）

## 🚀 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器直接打开 `index.html`，无需构建。

> IIS 部署注意：`live2d/web.config` 注册了 `.moc`/`.mtn` MIME 类型，根目录 `web.config` 设置了静态资源缓存策略。

### 音乐管理

```bash
python generate_playlist.py   # 将 mp3 放入 assets/music/ 后运行
```

## 📁 项目结构

```text
index.html            — 页面结构（SEO meta / OG / Twemoji 初始化）
css/style.css         — 全局样式、CSS 变量设计系统、动画、响应式
js/main.js            — 全局 rAF 调度、光粒子、飞鱼、音乐播放器、云层视差、日夜切换、社交按钮、Toast、访客足迹、加载进度条
js/zodiac.js          — 星座数据、运势 API、白天塔罗日历、夜间星环日轨、星空 Canvas、动效编排、滚动浮现
live2d/               — Live2D 看板娘（autoload.js + Cubism 2 SDK + 双角色模型 Pio/Izumi）
assets/               — 头像、favicon、Twemoji 库、字体、音乐
generate_playlist.py  — 扫描 assets/music/ 生成 window.__PLAYLIST__
web.config            — IIS 缓存策略
```

## 🎨 设计系统

- **背景**: 全站单一纯色 `var(--sky-mid)` — 白天 `#B0D2E7` / 夜间 `#132744`
- **交互色**: 湖蓝 `--accent: #89C4E1`，暖金 `--warm-accent: #E8B860` 贯穿全站
- **毛玻璃**: `rgba(255,255,255,0.4)` + `backdrop-filter: blur(6px)` + 蓝白内发光
- **动效**: Playful 个性 — 弹性回弹 `--ease-playful`，四级时长 80/150/300/500ms
- **字体**: 马山正体（星座标题）+ 系统字体栈（正文/英文）
- **星座符号**: 淡紫色 `#8E7CC3`，选中转为白色

## 📄 协议

本项目代码以 MIT License 发布。

Live2D 看板娘基于 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（GPL-3.0），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

---

*由 Claude Code + DeepSeek AI 辅助设计*

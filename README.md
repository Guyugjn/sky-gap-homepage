# 天空之隙

> 谢谢你，游到这里。

**在线访问：[www.080322.xyz](https://www.080322.xyz)**

孤鱼GY 的个人主页。清晨天空渐变背景下，一只飞鱼穿梭于云层与星辰之间。纯 HTML/CSS/JS，零框架、零构建。

---

## ✨ 亮点

- **飞鱼自主飞行** — SVG 飞鱼在页面自由游动：正弦波漫游 → 鼠标吸引追逐 → 点击惊吓逃跑。瞳孔追踪光标，惯性系统带来自然的弧线迂回。
- **星环日轨查询** — 双环星盘持续自转，点星选月日：星点是发光星体（呼吸闪烁 + 选中绽放四芒星光），选齐后一道光束射向星图、确认瞬间金色星屑爆发。
- **藏星于野的星图** — 12 黄道星座按经典星图画法藏在繁星里，平时与普通星点无异；确认生日后，属于你的星座被金线一笔一笔勾勒浮现。
- **Live2D 看板娘** — Pio / Izumi 双模型，120+ 条对话与页面元素联动。延迟初始化不抢首屏带宽，移动端自动隐藏。
- **音乐播放器** — 自定义拖拽进度条/音量条，三种播放模式，智能预加载，淡入切歌。63 首曲目，默认随机播放。播放列表支持动量滚动（滚轮惯性滑行 + 弹簧定位），切换曲目自动跟随，点击即切歌不关闭面板。

## 🎯 功能一览

### 视觉
- 全站纯色背景（白天浅蓝 / 夜间深蓝），切换时全页颜色如黄昏般 2s 整体渐变，载入直接到位不闪渐变
- 光粒子上升系统（Canvas，径向渐变发光）
- 星空 Canvas（200 自由粒子铺满全区 + 12 黄道星座经典星图 + 偶发流星划过；星座平时融入星空，确认后金线逐笔描画）
- 星环星体：径向渐变亮核光晕、随机相位呼吸闪烁、选中星四芒星光、轨道虚线流动、碎屑光点漂移
- 三层云朵 CSS 漂移 + 鼠标视差
- 滚动驱动的卡片弹性浮现（IntersectionObserver）

### 交互
- 日夜模式自动切换（19:00–06:00）+ 手动覆盖（手动设 `_nightManual`）
- 星座查询：点自转星环上的星星选月份+日期（先日后月也行，换月保留日期），选齐射出引导光束点亮星图，确认后星座连线浮现并自动切换运势
- 每日/本周/本月/年度运势（xxapi.cn API）
- 社交链接：GitHub、Bilibili、邮箱复制
- 访客足迹 — 页脚显示访问次数与天数（localStorage，按天计数）
- Toast 消息队列提示（复制/跳转通知）
- 星环中心实时反馈已选月日（hover 预览），确认结果常驻、点「重新选择」按钮才复位，未确认 12s 无操作自动复位

### 技术
- Twemoji v17.0.3 跨平台 emoji 统一渲染（CDN 优先 + 本地降级）
- 刘海屏安全区适配 + 三断点响应式（768/640/400px）
- 全局统一 rAF 调度（所有动画共用一个循环，切标签页整体暂停零消耗）
- 脚本全部 `defer` 并行加载，Live2D `requestIdleCallback` 延迟初始化
- 页面加载进度条（顶部渐变色细线，DOM 就绪加速，load 事件完成）

## 🚀 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器直接打开 `index.html`，无需构建。

> IIS 部署注意：`live2d/web.config` 注册了 `.moc`/`.mtn` MIME 类型，根目录 `web.config` 设置了静态资源缓存。非 IIS 服务器可忽略。

### 音乐管理

```bash
# 将 mp3 放入 assets/music/ 后运行
python generate_playlist.py
```

## 📁 项目结构

```
index.html           — 页面结构（SEO meta、Twemoji 初始化）
css/style.css        — 全局样式、CSS 变量设计系统、动画、响应式
js/main.js           — 光粒子、飞鱼、音乐播放器、云层视差、日夜切换、Toast
js/zodiac.js         — 星座数据、星环日轨、运势 API、星空 Canvas、动效编排、滚动浮现
live2d/              — Live2D 看板娘（autoload.js + Cubism SDK + 双角色模型）
assets/              — 头像、favicon、Twemoji 库、字体、音乐
generate_playlist.py — 扫描 assets/music/ 生成播放列表（按 A→Z 字母序）
```

## 📄 协议

本项目代码以 MIT License 发布。

Live2D 看板娘基于 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（GPL-3.0），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

---

*由 Claude Code + DeepSeek AI 辅助设计*
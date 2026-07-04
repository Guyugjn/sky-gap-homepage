# 天空之隙

> 谢谢你，游到这里。

**在线访问：[www.080322.xyz](https://www.080322.xyz)**

孤鱼GY 的个人主页 — 清晨天空渐变背景下，飞鱼穿梭于云层与星辰之间。纯 HTML/CSS/JS，零框架，毛玻璃卡片，Live2D 看板娘。

---

## 功能

- **飞鱼自主飞行** — SVG 飞鱼正弦波漫游 + 鼠标吸引追逐 + 点击涟漪惊吓逃跑 + 瞳孔追踪
- **星座星空** — 7 个真实星座的粒子网络星图，弹簧物理 + 涟漪推开 + 自主微晃
- **生日倒计时** — 精确到秒，生日当天彩带特效
- **每日运势** — 今日/本周/本月/年度运势，访客可输入生日查询星座并自动切换运势
- **云层漂移** — 纯 CSS 远/中/近三层云朵以不同速度漂过，无 JS 参与
- **唱片音乐播放器** — 旋转唱片 + 三种播放模式 + 淡入淡出切歌 + 智能预加载（等当前曲目缓冲足够后才下载下一首）+ 慢网加载状态提示
- **Live2D 看板娘** — Pio/Izumi 双模型，延迟初始化（不抢首屏带宽），对话气泡与页面元素联动
- **Twemoji 跨平台 emoji** — 本地部署 Twemoji v14.0.2，统一 Windows/macOS/iOS 的 emoji 风格

## 技术栈

纯静态站点，浏览器直接打开 `index.html` 即可运行。

| 层级 | 实现 |
|------|------|
| 结构 | HTML5 语义化标签 |
| 样式 | 纯 CSS，CSS 变量统一色调，毛玻璃卡片，刘海屏安全区适配 |
| 字体 | Ma Shan Zheng（毛笔展示体），系统无衬线正文 |
| 动画 | Canvas 2D（粒子星图）、CSS @keyframes（云层/唱片/涟漪）、requestAnimationFrame（飞鱼） |
| 滚动 | JS 滚动位置驱动浮现动画，逐像素双向渐入渐出 |
| Emoji | Twemoji v14.0.2 本地部署，跨平台统一渲染 |
| 加载 | 脚本全部 `defer` 并行下载，Live2D `requestIdleCallback` 延迟初始化，智能音乐预加载 |
| 数据 | xxapi.cn 星座运势 API，Python 脚本生成音乐播放列表 |

## 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器直接打开 `index.html`，无需构建。

> **IIS 部署注意**：`live2d/web.config` 注册了 `.moc` / `.mtn` 的 MIME 类型，`web.config`（根目录）设置了 7 天静态资源缓存。非 IIS 服务器可忽略这两个文件。

## 音乐管理

```bash
# 将 mp3 放入 assets/music/ 后运行
python generate_playlist.py
```

## 项目结构

```
index.html              — 页面结构
css/style.css           — 全局样式、设计系统、动画
js/main.js              — 飞鱼、音乐播放器、交互逻辑
js/zodiac.js            — 星座模块（倒计时/运势/星图/浮现）
generate_playlist.py    — 扫描 assets/music/ 生成播放列表
web.config              — IIS 静态资源缓存（7 天）
live2d/
  autoload.js           — Live2D 加载器（内联对话配置，延迟初始化）
  live2d.min.js         — Cubism 2 Core SDK
  waifu.css             — 看板娘样式
  web.config            — IIS MIME 类型（.moc/.mtn）
  models/
    pio/                — Pio 角色模型（默认）
    izumi/              — 和泉 Izumi 角色模型
assets/
  avatar.jpg            — 头像
  favicon.svg           — 标签页图标
  twemoji.min.js        — Twemoji v14.0.2 本地副本
  music/                — mp3 文件 + playlist.js
```

## 协议

本项目代码以 MIT License 发布。

Live2D 看板娘使用 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（GPL-3.0），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

---

*由 Claude Code 和 DeepSeek 辅助设计*

# 孤鱼GY · 天空之隙 🐟

孤鱼GY 的个人主页 — 一条在天空之隙中游弋的飞鱼。

[![在线预览](https://img.shields.io/badge/%F0%9F%8C%90%20%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88-www.080322.xyz-4A90D9?style=for-the-badge)](https://www.080322.xyz)

> 在像素与星空间，编织属于自己的小小世界

---

## ✨ 特色功能

### 🐟 飞鱼自主飞行
桌面端三种行为：漫游（自左向右正弦起伏）、追逐光标、点击附近反向弹飞；移动端无鼠标交互，只做自主漫游。

### 🎵 音乐播放器
iOS 控制中心风格的四行卡片：列表循环 / 单曲循环 / 随机播放、拖拽音量与一键静音、动量滚动播放列表、空格与方向键快捷键，播放模式与音量状态刷新后保留。

- **本地音乐**：播放列表分「本地音乐 / 网站歌单」两个标签，各自独立成列表，**切歌与随机只在当前列表内进行**；没有本地音乐时默认显示网站歌单。
- 来源在**设置面板的「音乐」分区**选择，可多选文件，也可选整个文件夹；再次选择即整批替换，另有**「清除选择」**。网页只被授予读取权限，**不会进行读取以外的任何操作，更不会修改或删除电脑上的文件**。
- Chrome / Edge 经 File System Access API 跨会话记住曲目（首次播放时请求一次授权），其它浏览器自动降级为「本次浏览有效」；文件被移动或删除后条目自动消失。
- 桌面端切歌或打开列表会自动居中当前曲目，移动端保持原生滚动不做定位。

### ⚙️ 设置面板
社交栏齿轮按钮打开的毛玻璃设置面板，所有偏好持久化在 localStorage（`gy_settings`）：主题（自动 / 日间 / 夜间）、视觉特效开关（光粒子 / 飞鱼 / 云层 / 星空）、播放模式与音量、本地音乐来源、看板娘显隐。
关闭看板娘立即生效且不再加载 Live2D 资源，**重新开启需刷新页面**。面板打开期间滚轮只滚面板本身，不会带动背后的主页面；关闭后页面仍停在原来浏览的位置。

### 🔮 星座运势
每日 / 周 / 月 / 年运势查询。请求带竞态守卫与 10 秒超时兜底，同一星座与时段的结果在会话内复用 10 分钟；加载失败区分「请求超时 / 网络异常 / 数据暂不可用」并给出一键重试。

### 🗓️ 星轨生日选择器
双弧同心滑轨：**外弧滑选日期、内弧滑选 12 个月**，按住即选、滑动连续选取（星核平滑跟随），按下哪条轨就只改哪条（维度不误判）；轨道外区域保持页面正常滚动。
选齐后「确认选择」揭晓 —— 星座发光 + 庆祝烟花 + 运势联动，夜间另现星座连线描画；鼠标移入确认区会亮起引导光束并一直连着，直到点下确认或移出确认区。
无自动复位，只有「重新选择」按钮或切换日夜才重置，重置时已点亮的星座按入场动画倒放退场。手机端日期数字自动放大、滑动命中带同步加宽，小屏也看得清、滑得准。

### ☀️🌙 日夜双模式
白天浅蓝天空，夜间深蓝星空 + 星座连线光效；19:00–06:00 或系统偏好深色时自动切换，也可在设置面板手动覆盖为日间 / 夜间，选「自动」即恢复自动切换。

### 🌠 星空粒子系统
200 个自由粒子（移动端减半）与 12 黄道星座锚点动态布局，**形状、宽高比、连线拓扑与星点大小均取自真实星空数据**（官方星座连线 + 实际星等，定位为装饰性星图）；金色链式描画、流星偶发、庆祝烟花 60 + 35 粒子。

### 🎀 Live2D 看板娘
右下角可交互的看板娘，支持双模型（Izumi 完整模型含表情 / 动作 / 音效，Pio 简化模型），气泡悬浮在头顶正上方且悬停内容切换带节流（快速扫过不闪变）；移动端（≤768px）不加载。

---

## 📁 文件结构

```text
├── index.html              # 入口（SEO、OG、JSON-LD、Twemoji）
├── css/
│   └── style.css           # 全部样式（CSS 变量 + 响应式）
├── js/                     # main.js 调度与播放器 · zodiac.js 星座星空 · settings.js 设置面板
│                           # localMusic.js 本地音乐存储层 · smoothScroll.js 滚轮动量滚动
├── live2d/                 # 看板娘（autoload.js 入口 · waifu-tips.js 气泡 · chunk/ · models/）
├── assets/                 # 头像、图标、og-image、favicon、Twemoji 图标库、字体分片、音乐
├── generate_playlist.py    # 扫描 assets/music/ 生成 playlist.js
├── release/                # 构建输出目录（部署打包用，git 不跟踪）
├── web.config              # IIS 缓存策略 + 安全头 + 敏感路径屏蔽
├── robots.txt              # 爬虫规则与 sitemap 声明（git 不跟踪，随站上传）
├── sitemap.xml             # 站点地图（git 不跟踪，随站上传）
├── .gitignore              # 忽略规则（音频、Twemoji 本地图标、SEO 文件等）
├── memory.md               # 项目维护笔记（不对访客开放，web.config 已屏蔽）
├── README.md
└── LICENSE
```

---

## 🚀 部署

纯静态项目，直接部署到任意 Web 服务器即可：

```bash
# 本地预览
npx serve .

# 可选：更新播放列表
python generate_playlist.py
```

生产环境推荐 IIS（`web.config` 已配置缓存策略、安全头、压缩，并屏蔽 `.git`、`release/`、`memory.md`、`README.md`、`generate_playlist.py` —— 即使把项目目录整体拷到站点根，源码历史与构建产物也不会被下载），Nginx、Apache 同样可用。示例网站：**[www.080322.xyz](https://www.080322.xyz)**

> 📌 **发布时记得递增版本号**：`index.html` 中 CSS / JS / 字体 CSS / `playlist.js` 的引用都带 `?v=1.3.0`。HTML 不缓存而 css/js 缓存 1 天，改动了这些文件却不递增版本号，老访客 24 小时内会拿到「新页面配旧脚本」。

> ⚠️ **GitHub Pages 不是完整部署**：`.gitignore` 排除了 `assets/music/` 下的音频文件（约 178MB，仅保留 `playlist.js`）、`assets/twemoji-72x72/`、`robots.txt`、`sitemap.xml`，音乐播放、Twemoji 本地图标与 SEO 收录需要把这些资源随站托管。版本包存放在 `release/`，已发布 `sky-gap-v1.0.0/1.1.0/1.2.0.zip`（各约 190MB，含音乐 / Twemoji / SEO 文件的完整部署包）。

---

## ⚙️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | 无（纯原生 HTML/CSS/JS，无构建工具） |
| 样式 | CSS 变量 + Flexbox + Grid + backdrop-filter（不支持时自动换成不透明底色） |
| 动画 | CSS @keyframes + requestAnimationFrame（全局统一调度，页面隐藏即停） |
| 存储 | localStorage（设置 / 音量 / 访客）+ sessionStorage（运势缓存）+ IndexedDB（本地音乐文件句柄） |
| 模型 | Cubism 2.x Live2D SDK |
| 字体 | Ma Shan Zheng（unicode-range 分片，按需下载）；图标为内联 SVG，Emoji 走 Twemoji |
| 设计 | 清晨天空淡蓝基调、毛玻璃卡片、Playful 弹性动效（回弹 12%–18%） |

支持 Chrome / Edge / Firefox / Safari 最新版与移动端 iOS Safari / Android Chrome；`100dvh` 带 `100vh` 兜底。

---

## 🤖 AI 辅助声明

本项目在开发、优化与代码审查过程中使用了 Claude Code / DeepSeek Harness 与 DeepSeek 辅助，所有 AI 生成代码均经人工审核后合并，详见 [commit 记录](https://github.com/Guyugjn/sky-gap-homepage/commits/main)。

---

## 📜 许可

- **本项目自有代码**：以 [MIT License](https://opensource.org/licenses/MIT) 发布。
- **Live2D 看板娘组件**：基于 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

# 孤鱼GY · 天空之隙 🐟

孤鱼GY 的个人主页 — 一条在天空之隙中游弋的飞鱼。

> 在像素与星空间，编织属于自己的小小世界

---

## ✨ 特色功能

### 🐟 飞鱼自主飞行
SVG 宫崎骏风格飞鱼，三种行为模式：
- **漫游**：从左向右正弦波上下起伏
- **追逐**：鼠标活跃时被光标吸引
- **受惊逃跑**：点击飞鱼附近会反向弹飞

### 🎵 音乐播放器
四行卡片式 UI，iOS 控制中心风格：
- 列表循环 / 单曲循环 / 随机播放
- 音量拖动 + 静音切换
- 播放列表动量滚动
- 智能预加载下一首
- **键盘快捷键**：空格播放/暂停、左右切歌、上下调音量
- 持久化音量到 localStorage

### 🔮 星座运势
每日/周/月/年运势查询：
- AbortController 竞态保护
- 内存缓存 1 天 TTL
- 情感化展示（指数条 + 概述 + 幸运宜忌）

### ☀️🌙 日夜双模式
- **白天**：塔罗符卡 + 星丸日期选择
- **夜间**：星环日轨 + 星空 Canvas + 星座连线
- 自动切换（19:00–06:00）+ 手动覆盖
- 颜色主题 CSS 变量渐变过渡

### 🌠 星空粒子系统
- 200 个自由粒子（布朗运动 + 弹簧回归）
- 12 黄道星座锚点动态布局
- 金色链式描画 + 流星偶发
- 庆祝烟花（60 + 35 粒子）

### 🎀 Live2D 看板娘
右下角可交互的看板娘，支持双模型：
- **Izumi**（完整模型，含表情/动作/音效）
- **Pio**（简化模型）

### ♿ 无障碍
- 所有按钮含 aria-label
- 语义化 HTML 结构

---

## 📁 文件结构

```text
├── index.html              # 入口（SEO、OG、JSON-LD、Twemoji）
├── css/
│   └── style.css           # 全部样式（CSS 变量 + 响应式）
├── js/
│   ├── main.js             # 全局调度、飞鱼、音乐播放器、日夜切换
│   └── zodiac.js           # 星座运势、塔罗日历、星环日轨、星空 Canvas
├── live2d/                 # Live2D 看板娘（Izumi + Pio）
│   ├── autoload.js
│   ├── live2d.min.js       # Cubism 2.x SDK
│   ├── waifu.css
│   └── web.config          # .moc/.mtn MIME 映射
├── assets/
│   ├── avatar.jpg
│   ├── favicon.svg
│   ├── twemoji.min.js
│   ├── twemoji-72x72/      # 本地 emoji 备用（CDN 降级）
│   └── music/              # 音乐文件（不上传 git）
│       └── playlist.js     # 自动生成的播放列表
├── generate_playlist.py    # 扫描音乐目录生成 playlist.js
├── web.config              # IIS 缓存策略 + 安全头
├── robots.txt
└── sitemap.xml
```

---

## 🚀 部署

### 方式一：直接运行（本地开发）

```bash
# 可选：生成播放列表
python generate_playlist.py

# 用任意静态服务器启动
npx serve .
```

### 方式二：IIS（生产）

1. 将整个项目复制到 IIS 站点目录
2. 确保 IIS 安装了 URL 重写和静态压缩模块
3. web.config 已配置缓存策略、安全头、压缩

### 方式三：任意 Web 服务器

Nginx、Apache、Caddy、GitHub Pages 均可直接部署（纯静态）。

---

## ⚙️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | 无（纯原生） |
| 样式 | CSS 变量 + Flexbox + Grid + Backdrop-filter |
| 动画 | CSS @keyframes + requestAnimationFrame |
| 存储 | localStorage |
| 模型 | Cubism 2.x Live2D SDK |
| 图标 | 内联 SVG |
| Emoji | Twemoji（CDN → 本地降级） |

---

## 🎨 设计风格

- **色彩**：清晨天空淡蓝基调，夜间深蓝星空
- **字体**：Ma Shan Zheng（马山正体）+ PingFang SC
- **质感**：毛玻璃（backdrop-filter）卡片 + 柔和阴影
- **动效**：Playful 弹性体系（回弹 ~12%–18%）

---

## 🌐 浏览器支持

- Chrome / Edge / Firefox / Safari（最新版）
- 移动端 iOS Safari / Android Chrome
- 降级支持：backdrop-filter 不支持时自动 fallback

---

## 🤖 AI 辅助声明

本项目在开发、优化和代码审查过程中使用了以下 AI 工具辅助：

- **Claude Code（Anthropic）** — 代码编写、架构设计、代码审查、性能优化、文档生成
- **DeepSeek** — 后端模型推理支持

所有 AI 生成代码均经过人工审核和测试后合并。具体参与内容详见 [commit 记录](https://github.com/Guyugjn/sky-gap-homepage/commits/main)。

---

## 📜 许可

MIT © 2026–2077 孤鱼GY

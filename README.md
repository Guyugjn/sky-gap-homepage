# 孤鱼GY · 天空之隙 🐟

孤鱼GY 的个人主页 — 一条在天空之隙中游弋的飞鱼。

[![在线预览](https://img.shields.io/badge/%F0%9F%8C%90%20%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88-www.080322.xyz-4A90D9?style=for-the-badge)](https://www.080322.xyz)

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
- 音量拖动 + 静音切换（拖动音量条自动解除静音）
- 播放列表动量滚动（桌面惯性滚动 / 移动端原生触摸滚动，触摸端点按与滑动互不干扰）
- 智能预加载下一首
- **键盘快捷键**：空格播放/暂停、左右切歌、上下调音量；聚焦进度条/音量条时方向键微调、Home/End 跳首尾
- 播放模式、音量与静音状态持久化到 localStorage（刷新后保留；静音可一键恢复）
- **选择本地音乐**：播放列表顶部有「本地音乐 / 网站歌单」两个标签页，各自独立成列表，**切歌与随机只在当前列表内进行**；
  没有本地音乐时默认显示网站歌单。
  选择来源在**设置面板的「音乐」分区**：可挑选若干音乐文件，也可选择整个文件夹；面板会显示当前来源的文件夹名与曲目数
  （浏览器出于安全只提供文件夹名，拿不到完整系统路径），再次选择即整批替换，另有**「清除选择」**可随时清空。
  网页只被授予读取权限，**不会读取内容以外的任何操作，更不会修改或删除电脑上的文件**；清除只是让网站在浏览器里忘掉这些曲目。
  两个列表共用播放、进度、音量与三种播放模式；切换标签不会打断正在播放的曲目。
  桌面 Chrome / Edge 通过 File System Access API 记住曲目（刷新、重开浏览器后仍在，首次播放时浏览器会请求一次文件访问授权）；
  其它浏览器自动降级为"本次浏览有效"。文件被移动或删除后，该条目会自动从列表中消失。

### ⚙️ 设置面板
社交栏齿轮按钮打开的毛玻璃设置面板，所有偏好持久化到 localStorage（`gy_settings`）：
- **主题**：自动（跟随系统 + 时间）/ 日间 / 夜间
- **视觉特效开关**：光粒子 / 飞鱼 / 云层 / 星空
- **音乐**：播放模式（列表循环 / 单曲 / 随机）+ 音量（复用播放器同款拖拽/键盘滑块）
  + 本地音乐的来源选择与「清除选择」
- **看板娘**：显示 / 隐藏（关闭后不再加载 Live2D 资源）

面板打开期间滚轮只滚面板本身，不会带动背后的主页面；关闭后页面仍停在原来浏览的位置。面板与整页滚动都复用播放列表那套惯性滚动手感（鼠标滚轮细腻分步 + 惯性收尾；触屏与触控板保持系统原生滚动）。

### 🔮 星座运势

每日/周/月/年运势查询：

- 快速切换不卡顿，避免请求冲突
- 情感化展示（指数条 + 概述 + 幸运宜忌）

### 🗓️ 星轨生日选择器

- 双弧同心滑轨：**外弧滑选当月日期，内弧滑选 12 月**，均为一条完整的纯色细线（主题蓝，任何背景下始终完整可见）
- 桌面与手机交互一致：在轨道上按住即选、滑动连续选取（星核平滑跟随）；轨道外区域保持页面正常滚动
- 维度不误判——按下哪条轨就只改哪条，换轨需重新按下
- 切换月份时日期弧**立即重建**：按下即选立即显示无动画；滑动连续换月则日期弧保持不动（避免快速切换闪烁），松手统一重建——日期数字从弧线沿径向依次升起（选中日金色高亮）
- 日期弧外侧**日期数字全部常显**，弧上**星点全部常显**；选中时金环涟漪扩散；星座图标仅在确认按钮上方显示（带浮现动效）
- 选齐后「确认选择」揭晓——星座发光 + 庆祝烟花 + 运势联动（夜间另现连线描画）
- 鼠标移入「确认选择」所在的确认区（按钮及四周留白）时，按钮与星座之间亮起引导光束并**一直连着**，直到点下确认（转金光一次闪灭）或移出确认区
- 无自动复位；只有「重新选择」按钮或切换日夜才重置。「重新选择」时已点亮星座走**入场动画的倒放**：连线从最后画的那条起逐条收回，再让星点辉光落尽

### ☀️🌙 日夜双模式

- **白天**：浅蓝天空 + 星轨生日选择器（确认时绽放庆祝粒子）
- **夜间**：深蓝星空 + 星轨（夜间皮肤）+ 星座连线光效
- 自动切换（19:00–06:00，跟随系统 prefers-color-scheme）+ 手动覆盖（在设置面板选择「日间/夜间」）
- 设置面板选择「自动」即可恢复自动切换
- 颜色主题 CSS 变量渐变过渡

### 🌠 星空粒子系统

- 200 个自由粒子（布朗运动 + 弹簧回归）
- 12 黄道星座锚点动态布局；**形状、宽高比、连线拓扑与星点大小均取自真实星空数据**（官方星座连线 + 实际星等，定位为装饰性星图，不做天球位置投影）
- 金色链式描画 + 流星偶发
- 庆祝烟花（60 + 35 粒子，昼夜均支持）

### 🎀 Live2D 看板娘
右下角可交互的看板娘，支持双模型：
- **Izumi**（完整模型，含表情/动作/音效）
- **Pio**（简化模型）
- 气泡悬浮在头顶正上方，悬停内容切换带节流（快速扫过不闪变）

---

## 📁 文件结构

```text
├── index.html              # 入口（SEO、OG、JSON-LD、Twemoji）
├── css/
│   └── style.css           # 全部样式（CSS 变量 + 响应式）
├── js/
│   ├── main.js             # 全局调度、光粒子、飞鱼、音乐播放器、日夜切换
│   ├── settings.js         # 设置面板（gy_settings 存储、主题/特效/音乐/看板娘开关）
│   ├── localMusic.js       # 本地音乐存储层（FSA 句柄持久化 / 内存会话轨）
│   └── zodiac.js           # 星座运势、星轨生日选择器、星空 Canvas、烟花动效
├── live2d/                 # Live2D 看板娘（Izumi + Pio）
│   ├── autoload.js         # 入口：加载 waifu-tips.js、内联提示语配置、节流
│   ├── waifu-tips.js       # 提示气泡逻辑（本地定制：气泡位置 + 悬停防抖）
│   ├── live2d.min.js       # Cubism 2.x SDK
│   ├── waifu.css
│   ├── chunk/              # waifu-tips.js 依赖的 ES module 分块
│   ├── models/             # Izumi / Pio 模型文件
│   └── web.config          # .moc/.mtn MIME 映射
├── assets/
│   ├── avatar.jpg
│   ├── apple-touch-icon.png    # iOS 主屏图标
│   ├── og-image.jpg            # 社交分享图（1200×630）
│   ├── favicon.svg
│   ├── twemoji.min.js
│   ├── twemoji-72x72/          # Twemoji 本地图标（HTTP 下是主源，见下方部署说明）
│   ├── fonts/                  # 马山正体（unicode-range 分片，按需加载）
│   ├── music/                  # 音频文件
│       └── playlist.js     # 自动生成的播放列表
├── generate_playlist.py    # 扫描音乐目录生成 playlist.js
├── release/                 # 构建输出目录（部署打包用，git 不跟踪）
├── web.config              # IIS 缓存策略 + 安全头
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

生产环境部署到 IIS（`web.config` 已配置缓存策略、安全头、压缩）、Nginx、Apache 均可。示例网站：**[www.080322.xyz](https://www.080322.xyz)**

> ⚠️ **GitHub Pages 不是完整部署**：`.gitignore` 排除了 `assets/music/`（约 178MB）、`assets/twemoji-72x72/`、`robots.txt`、`sitemap.xml`。Pages 只适合代码展示/预览——音乐播放、Twemoji 本地图标、SEO 收录需要把以上资源随站托管（rebuild 播放列表 `python generate_playlist.py` 后一并上传）。`release/` 是构建输出目录（git 不跟踪），部署打包时直接整体拷贝。

### 📦 发布 Release

版本包存放在 `release/`（git 不跟踪），已发布：`sky-gap-v1.0.0.zip`、`sky-gap-v1.1.0.zip`、`sky-gap-v1.2.0.zip`（各约 190MB，含音乐/Twemoji/SEO 文件，为完整部署包）。发布到 GitHub Releases 时拖拽上传 zip 即可（>100MB 建议用 `gh release upload` 或 API）。

---

## ⚙️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | 无（纯原生） |
| 样式 | CSS 变量 + Flexbox + Grid + Backdrop-filter |
| 动画 | CSS @keyframes + requestAnimationFrame |
| 存储 | localStorage（`gy_settings` 设置 + `gy_volume`/`gy_muted` 音量 + `gy_visit` 访客） |
| 模型 | Cubism 2.x Live2D SDK |
| 图标 | 内联 SVG |
| Emoji | Twemoji（HTTPS 走 CDN，HTTP 走本地 `twemoji-72x72/`） |
| 字体 | Ma Shan Zheng（unicode-range 分片，浏览器按需下载） |

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

- **Claude Code / DeepSeek Harness** — 代码编写、架构设计、代码审查、性能优化、文档生成
- **DeepSeek** — 后端模型推理支持

所有 AI 生成代码均经过人工审核和测试后合并。具体参与内容详见 [commit 记录](https://github.com/Guyugjn/sky-gap-homepage/commits/main)。

---

## 📜 许可

- **本项目自有代码**：以 [MIT License](https://opensource.org/licenses/MIT) 发布。
- **Live2D 看板娘组件**：基于 [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)），模型文件来自 [live2d-widget-model-izumi](https://github.com/stevenjoezhang/live2d-widget-model-izumi) 和 [live2d_api](https://github.com/fghrsh/live2d_api)。

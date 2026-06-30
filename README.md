# 天空之隙

> 在像素与星空间，编织属于自己的小小世界。

淡蓝色清晨天空下，云层缓缓飘过。这是孤鱼GY的个人主页——宫崎骏式手绘感，Canvas 光粒子、CSS 视差云、音乐播放器，零框架，纯 HTML/CSS/JS。

## 技术栈

| 层级 | 实现 |
|------|------|
| 粒子动画 | Canvas 2D，55个发光粒子，径向渐变 + 闪烁 |
| 云层 | 纯 CSS 椭圆拼合 + `@keyframes` 漂移 + JS 鼠标视差 |
| 音乐播放器 | `conic-gradient` 纹理 + `repeating-radial-gradient` 沟槽 + CSS 旋转动画 |
| 鼠标跟随 | `mousemove` → 平滑插值 → 径向渐变柔光 |
| 音乐控制 | HTML5 `<audio>`，支持随机/单曲/列表循环，淡入淡出 |

## 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

音乐文件需单独下载：[蓝奏云](https://wwbnn.lanzouu.com/b00q1it9id) 密码 `4tls`，解压后将 `assets/music/` 放入项目根目录，浏览器打开 `index.html`。

## 自定义为你自己的主页

只需改几个文件，无需动代码逻辑：

| 想改的内容 | 操作 |
|-----------|------|
| **头像** | 替换 `assets/avatar.jpg`（保持同名） |
| **名字** | 修改 `index.html:78` — `<h1 class="name">孤鱼GY</h1>` |
| **简介** | 修改 `index.html:81` — `<p class="intro">在像素与星空间…</p>` |
| **GitHub 链接** | 修改 `index.html:86` — `#github-btn` 的 `href` |
| **Bilibili 链接** | 修改 `index.html:97` — `#bilibili-btn` 的 `href` |
| **邮箱** | 修改 `js/main.js:649` — `var email = 'guyu.email@qq.com'` |
| **浏览器图标** | 替换 `assets/favicon.svg`（保持同名） |
| **页面标题** | 修改 `index.html:6` — `<title>孤鱼GY · 天空之隙</title>` |
| **色调** | 修改 `css/style.css:7-19` — `:root` 中的 CSS 变量 |
| **音乐** | 替换 `assets/music/` 中 `00.mp3~62.mp3`，同步更新 `js/main.js:273` 的 `PLAYLIST_NAMES` 数组 |

改完浏览器打开 `index.html` 即生效，无需构建工具。

## 协议

MIT License

---

*由 DeepSeek AI 辅助生成*

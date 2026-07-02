# 天空之隙

> 在像素与星空间，编织属于自己的小小世界。

🌐 **在线访问：[www.080322.xyz](https://www.080322.xyz)**

淡蓝色清晨天空下，云层缓缓飘过。这是孤鱼GY 的个人主页——宫崎骏式手绘感，Canvas 光粒子、CSS 云层漂移、飞鱼跟随光标、唱片音乐播放器，零框架，纯 HTML/CSS/JS。

---

## 功能亮点

- 🐟 **飞鱼自主飞行** — SVG 飞鱼在页面上漫游，鼠标吸引追逐，点击涟漪惊吓逃跑
- ☁️ **云层漂移** — 纯 CSS 远/中/近三层云朵以不同速度缓缓飘过
- ✨ **光粒子动画** — Canvas 2D 绘制 55 个发光粒子，径向渐变 + 闪烁效果
- 🎵 **唱片音乐播放器** — 旋转唱片 + 随机/单曲/列表循环三种播放模式，淡入淡出
- 🎨 **宫崎骏式手绘感** — 淡蓝天空渐变背景，柔和毛玻璃交互提示

## 技术栈

| 层级 | 实现 |
|------|------|
| 结构 | HTML5 语义化标签 |
| 样式 | 纯 CSS，无预处理器，CSS 变量统一色调 |
| 动画 | Canvas 2D（粒子）、CSS `@keyframes`（云层/唱片/涟漪）、JS requestAnimationFrame（飞鱼） |
| 音乐 | HTML5 `<audio>`，Python 脚本生成播放列表 |
| 部署 | 纯静态站点，托管于任意静态服务器 |

## 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器直接打开 `index.html` 即可运行，无需构建步骤。

## 添加/管理音乐

```bash
# 将 mp3 文件放入 assets/music/ 后运行
python generate_playlist.py
```

## 项目结构

```
index.html              — 页面结构
css/style.css           — 全局样式与动画
js/main.js              — 飞鱼、音乐播放器、交互逻辑
generate_playlist.py    — 扫描 assets/music/ 生成播放列表
assets/
  avatar.jpg            — 头像
  favicon.svg           — 浏览器标签页图标
  music/                — mp3 文件 + playlist.js
```

## 协议

MIT License

---

*由 DeepSeek AI 辅助生成*

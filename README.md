[English](README.en.md)

# 天空之隙

> 在像素与星空间，编织属于自己的小小世界。

淡蓝色清晨天空下，云层缓缓飘过。这是孤鱼GY的个人主页——宫崎骏式手绘感，Canvas 光粒子、CSS 云层漂移、飞鱼跟随光标、唱片音乐播放器，零框架，纯 HTML/CSS/JS。

---

## 技术栈

| 层级 | 实现 |
|------|------|
| 粒子动画 | Canvas 2D，55个发光粒子，径向渐变 + 闪烁 |
| 云层 | 纯 CSS 椭圆拼合 + `@keyframes` 漂移（远/中/近三层不同速度） |
| 飞鱼跟随 | SVG 飞鱼自主漫游 + 鼠标吸引，带惯性、瞳孔追踪、翅膀振翅 |
| 音乐播放器 | `repeating-radial-gradient` 沟槽纹理 + CSS 旋转动画 |
| 音乐控制 | HTML5 `<audio>`，支持随机 / 单曲 / 列表循环，淡入淡出 |

## 本地运行

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

浏览器打开 `index.html` 即可运行。

## 协议

MIT License

---

*由 DeepSeek AI 辅助生成*

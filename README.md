# 天空之隙

> 谢谢你，游到这里。

🌐 **在线访问：[www.080322.xyz](https://www.080322.xyz)**

孤鱼GY 的个人主页 — 清晨天空渐变背景下，飞鱼穿梭于云层与星辰之间。纯 HTML/CSS/JS，零框架，毛玻璃卡片，宫崎骏式手绘质感。

---

## 功能亮点

- 🐟 **飞鱼自主飞行** — SVG 飞鱼漫游 + 鼠标吸引追逐 + 点击涟漪惊吓逃跑 + 瞳孔追踪
- 🌌 **星座星空** — 7 个真实星座（白羊/金牛/双子/狮子/天蝎/大熊/猎户）的粒子网络星图，点击涟漪推开星星
- 🎂 **生日倒计时** — 精确到秒，生日当天彩带特效 + 暖金光晕
- 🔮 **每日运势** — 今日/本周/本月/年度运势，访客可输入生日查询星座并自动切换运势
- ☁️ **云层漂移** — 纯 CSS 远/中/近三层云朵以不同速度缓缓飘过
- ✨ **光粒子动画** — Canvas 2D 绘制发光粒子，径向渐变 + 闪烁效果
- 🎵 **唱片音乐播放器** — 旋转唱片 + 三种播放模式 + 淡入淡出
- 🎨 **设计系统** — 冷暖双色系（深海蓝 + 蜂蜜金），Ma Shan Zheng 毛笔字体，毛玻璃卡片差异化设计

## 技术栈

| 层级 | 实现 |
|------|------|
| 结构 | HTML5 语义化标签 |
| 样式 | 纯 CSS，CSS 变量统一色调（深海蓝 + 蜂蜜金双色系），毛玻璃卡片 |
| 字体 | Ma Shan Zheng（毛笔展示体），系统无衬线正文 |
| 动画 | Canvas 2D（粒子星图）、CSS `@keyframes`（云层/唱片/涟漪/迷雾标题）、JS requestAnimationFrame（飞鱼/星图） |
| 滚动 | JS 滚动位置驱动浮现动画（逐像素绑定），双向渐入渐出 |
| 数据 | xxapi.cn 星座运势 API，Python 脚本生成音乐播放列表 |
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
index.html              — 页面结构（首页 + 星座区域 + 页脚）
css/style.css           — 全局样式、设计系统、动画
js/main.js              — 飞鱼、音乐播放器、交互逻辑
js/zodiac.js            — 星座模块（倒计时/运势/星图/浮现动画）
generate_playlist.py    — 扫描 assets/music/ 生成播放列表
assets/
  avatar.jpg            — 头像
  favicon.svg           — 浏览器标签页图标
  music/                — mp3 文件 + playlist.js
```

## 协议

MIT License

---

*由 Claude Code 辅助设计*

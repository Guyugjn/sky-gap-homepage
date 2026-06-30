# Sky Gap

> *Weaving a tiny world of our own, between pixels and stardust.*

*A personal homepage under a pale-blue morning sky. Miyazaki-inspired hand-drawn feel, with drifting clouds, glowing particles, and a vinyl music player. Zero frameworks — just HTML, CSS, and JavaScript.*

---

## Tech Stack

| Layer | Implementation |
|-------|---------------|
| Particles | Canvas 2D — 55 glowing particles with radial gradients & flicker |
| Clouds | Pure CSS ellipses + `@keyframes` drift + JS mouse parallax |
| Player | `repeating-radial-gradient` groove texture + CSS rotation animation |
| Cursor | `mousemove` → smooth interpolation → radial glow |
| Audio | HTML5 `<audio>`, shuffle / repeat-one / list-loop, fade-in/out |

## Getting Started

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

Music files hosted separately: [Lanzou](https://wwbnn.lanzouu.com/b00q1it9id) password `4tls`. Extract and place the `assets/music/` folder at the project root, then open `index.html`.

## Make It Yours

Change a handful of files — no coding required.

| What | How |
|------|-----|
| **Avatar** | Replace `assets/avatar.jpg` (keep filename) |
| **Name** | `index.html:78` — `<h1 class="name">孤鱼GY</h1>` |
| **Bio** | `index.html:81` — `<p class="intro">在像素与星空间…</p>` |
| **GitHub Link** | `index.html:86` — `#github-btn` `href` |
| **Bilibili Link** | `index.html:97` — `#bilibili-btn` `href` |
| **Email** | `js/main.js:649` — `var email = 'guyu.email@qq.com'` |
| **Favicon** | Replace `assets/favicon.svg` (keep filename) |
| **Page Title** | `index.html:6` — `<title>孤鱼GY · 天空之隙</title>` |
| **Colors** | `css/style.css:7-19` — CSS custom properties in `:root` |
| **Music** | Replace `00.mp3~62.mp3` in `assets/music/`, update `PLAYLIST_NAMES` at `js/main.js:273` |

Open `index.html` in your browser — no build step needed.

## License

MIT License

---

*Assisted by DeepSeek AI*
